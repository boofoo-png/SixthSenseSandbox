"use client";

import { useState } from "react";
import { CAPTION_TONES, type CaptionTone, type ContentIdea } from "@/lib/ai-studio/types";
import { buttonClass, secondaryButtonClass } from "./styles";

type CaptionStudioProps = {
  idea: ContentIdea;
  tone: CaptionTone;
  captions: readonly string[];
  hashtags: readonly string[];
  /** Index of the chosen caption. */
  selected: number;
  onToneChange: (tone: CaptionTone) => void;
  onSelect: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
};

/** Step 2: caption options in a chosen tone, suggested hashtags, and copy buttons. */
export function CaptionStudio({ idea, tone, captions, hashtags, selected, onToneChange, onSelect, onBack, onNext }: CaptionStudioProps) {
  const [message, setMessage] = useState("");
  const tagText = hashtags.join(" ");

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(done);
    } catch {
      setMessage("Could not copy. Select the text and copy it instead.");
    }
  }

  return (
    <div>
      <h3 className="font-medium text-ink">{idea.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{idea.angle}</p>

      <section aria-labelledby="how-to-make-it" className="mt-4 rounded bg-hover p-4">
        <h4 id="how-to-make-it" className="text-sm font-medium text-ink">How to make it</h4>
        <p className="mt-1 text-xs text-ink-muted">You create and post the photo or video yourself; this is a plan to help.</p>
        <p className="mt-3 text-xs font-medium text-ink-muted">Shot list</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink">
          {idea.brief.shots.map((shot) => (
            <li key={shot}>{shot}</li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink">{`Length: ${idea.brief.length}`}</p>
        <p className="mt-3 text-xs font-medium text-ink-muted">Tips</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
          {idea.brief.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <fieldset className="mt-4">
        <legend className="text-xs font-medium text-ink-muted">Tone</legend>
        <div className="mt-1 flex flex-wrap gap-4">
          {CAPTION_TONES.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name="tone" value={option.value} checked={tone === option.value} onChange={() => onToneChange(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <ul className="mt-4 space-y-2">
        {captions.map((caption, index) => (
          <li
            key={caption}
            className={`flex items-start gap-3 rounded border p-3 ${
              index === selected ? "border-primary" : "border-divider"
            }`}
          >
            <input
              type="radio"
              name="caption"
              className="mt-1"
              aria-label={`Use caption ${index + 1}`}
              checked={index === selected}
              onChange={() => onSelect(index)}
            />
            <p className="flex-1 text-sm text-ink">{caption}</p>
            <button
              type="button"
              className={secondaryButtonClass}
              aria-label={`Copy caption ${index + 1}`}
              onClick={() => copy(caption, `Copied caption ${index + 1}.`)}
            >
              Copy
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-ink-muted">Suggested hashtags</p>
          <p className="mt-1 text-sm text-ink">{tagText}</p>
        </div>
        <button type="button" className={secondaryButtonClass} onClick={() => copy(tagText, "Copied hashtags.")}>
          Copy hashtags
        </button>
      </div>

      <p role="status" className="mt-2 min-h-5 text-sm text-ink-muted">{message}</p>

      <div className="mt-4 flex gap-3">
        <button type="button" className={secondaryButtonClass} onClick={onBack}>Back to ideas</button>
        <button type="button" className={buttonClass} onClick={onNext}>Next: schedule</button>
      </div>
    </div>
  );
}
