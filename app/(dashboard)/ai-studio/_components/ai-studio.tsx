"use client";

import { useEffect, useRef, useState } from "react";
import type { Platform } from "@/lib/analytics/types";
import { formatTime } from "@/lib/ai-studio/best-time";
import { suggestCaptions } from "@/lib/ai-studio/captions";
import { suggestHashtags } from "@/lib/ai-studio/hashtags";
import { generateIdeas } from "@/lib/ai-studio/ideas";
import type { CaptionTone, ContentIdea, PlannedPost } from "@/lib/ai-studio/types";
import type { Trend } from "@/lib/competitors/types";
import { CaptionStudio } from "./caption-studio";
import { ContentCalendar } from "./content-calendar";
import { IdeaPicker } from "./idea-picker";
import { ScheduleForm } from "./schedule-form";
import { buttonClass } from "./styles";
import { usePlannedPosts } from "./use-planned-posts";

type AiStudioProps = {
  trends: readonly Trend[];
  bestPlatforms: readonly Platform[];
  /** The business's own best-performing hashtags. */
  ownTags: readonly string[];
  today: string;
};

const STEPS = ["Ideas", "Caption", "Schedule"] as const;

const cardClass = "rounded bg-paper shadow-elevation-1 p-5";

/** The idea -> caption -> schedule flow, with the content calendar below. */
export function AiStudio({ trends, bestPlatforms, ownTags, today }: AiStudioProps) {
  const { add } = usePlannedPosts();
  const [step, setStep] = useState(0);
  const [page, setPage] = useState(0);
  const [idea, setIdea] = useState<ContentIdea | null>(null);
  const [tone, setTone] = useState<CaptionTone>("friendly");
  const [selected, setSelected] = useState(0);
  const [added, setAdded] = useState<PlannedPost | null>(null);

  // After the user moves between steps, put keyboard focus on the new step's
  // heading (or the confirmation) so it is announced. Never on first load.
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const focusPending = useRef(false);
  useEffect(() => {
    if (focusPending.current) {
      focusPending.current = false;
      (added !== null ? confirmation.current : stepHeading.current)?.focus();
    }
  }, [step, added]);

  function goTo(next: number) {
    focusPending.current = true;
    setStep(next);
  }

  const ideas = generateIdeas({ trends, bestPlatforms, page });
  const captions = idea ? suggestCaptions(idea, tone) : [];
  const hashtags = idea ? suggestHashtags(idea, ownTags) : [];

  function startOver() {
    goTo(0);
    setIdea(null);
    setSelected(0);
    setAdded(null);
    setPage((p) => p + 1);
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="studio-heading" className={cardClass}>
        <h2 id="studio-heading" className="text-lg font-medium text-ink">Plan a post</h2>
        <p className="mt-1 text-xs text-ink-muted">Suggestions are generated from templates and sample data, not AI.</p>

        <ol aria-label="Steps" className="mt-4 flex flex-wrap gap-2 text-sm">
          {STEPS.map((name, index) => (
            <li
              key={name}
              aria-current={index === step && added === null ? "step" : undefined}
              className={`rounded-full px-3 py-1 text-[13px] leading-[1.85] tracking-[0.16px] ${
                index === step && added === null
                  ? "bg-primary text-primary-contrast"
                  : "bg-selected text-ink"
              }`}
            >
              {`${index + 1}. ${name}`}
            </li>
          ))}
        </ol>

        <div className="mt-5">
          {added === null && (
            <h3 ref={stepHeading} tabIndex={-1} className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted outline-none">
              {`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
            </h3>
          )}
          {added !== null ? (
            <div>
              <p ref={confirmation} tabIndex={-1} role="status" className="text-sm text-ink outline-none">
                {`Added to your calendar for ${added.date} at ${formatTime(added.time)}.`}
              </p>
              <button type="button" className={`mt-3 ${buttonClass}`} onClick={startOver}>Plan another post</button>
            </div>
          ) : step === 0 || idea === null ? (
            <IdeaPicker
              ideas={ideas}
              onChoose={(chosen) => {
                setIdea(chosen);
                setSelected(0);
                goTo(1);
              }}
              onShowMore={() => setPage((p) => p + 1)}
            />
          ) : step === 1 ? (
            <CaptionStudio
              idea={idea}
              tone={tone}
              captions={captions}
              hashtags={hashtags}
              selected={selected}
              onToneChange={(next) => {
                setTone(next);
                setSelected(0);
              }}
              onSelect={setSelected}
              onBack={() => goTo(0)}
              onNext={() => goTo(2)}
            />
          ) : (
            <ScheduleForm
              idea={idea}
              caption={captions[selected] ?? captions[0]}
              hashtags={hashtags}
              today={today}
              onAdd={(post) => {
                add(post);
                focusPending.current = true;
                setAdded(post);
              }}
              onBack={() => goTo(1)}
            />
          )}
        </div>
      </section>

      <div className={cardClass}>
        <ContentCalendar today={today} />
      </div>
    </div>
  );
}
