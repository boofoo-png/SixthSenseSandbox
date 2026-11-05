"use client";

import { useEffect, useState } from "react";
import {
  AD_FORMATS,
  AD_GOALS,
  GOALS,
  TONES,
  VIDEO_DURATIONS,
  VIDEO_FORMATS,
  VIDEO_PLATFORMS,
  adCopy,
  blogPlan,
  socialPost,
  videoPlan,
} from "@/lib/hub/content/create";
import {
  CopyBlock,
  DetailsPanel,
  EmptyState,
  GenerateButton,
  InputField,
  NumberedList,
  ResultActions,
  ResultSection,
  SelectField,
  SuggestionsPanel,
  Tags,
  TextField,
  ToolGrid,
  UploadZone,
  VisualCard,
} from "./tool-ui";

// The four create tools from the Figma Make's Content Creation. The suggestions show straight
// away for the example idea, as in the Make; Generate uses the current details, Regenerate
// writes another version of the same details.

const EXAMPLE_IDEA = "Create a practical sustainability story for independent hotel buyers.";

/** Keeps the details as typed (`draft`) apart from the ones the suggestions were made from (`run`). */
export function useRun<T extends object>(initial: T) {
  const [draft, setDraft] = useState(initial);
  const [run, setRun] = useState({ ...initial, variant: 0 });
  return {
    draft,
    set: <K extends keyof T>(key: K, value: T[K]) => setDraft((current) => ({ ...current, [key]: value })),
    run,
    generate: () => setRun({ ...draft, variant: 0 }),
    regenerate: () => setRun((current) => ({ ...current, variant: current.variant + 1 })),
  };
}

export function SocialPostTool({ audience }: { audience: string }) {
  const { draft, set, run, generate, regenerate } = useRun({
    idea: EXAMPLE_IDEA,
    goal: "Awareness" as (typeof GOALS)[number],
    tone: "Professional" as (typeof TONES)[number],
  });
  const [image, setImage] = useState<{ name: string; url: string } | null>(null);
  const [imageError, setImageError] = useState("");
  const result = socialPost({ ...run, audience });

  // Free the preview's memory when it is replaced or the page closes.
  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url);
  }, [image]);

  return (
    <ToolGrid>
      <DetailsPanel label="Post Details" onSubmit={generate}>
        <UploadZone
          label="Upload your post"
          hint="PNG or JPG, optional: it replaces the suggested photo"
          accept="image/png,image/jpeg"
          fileName={image?.name}
          error={imageError}
          onFile={(file) => {
            if (!/^image\/(png|jpeg)$/.test(file.type)) {
              setImageError("Choose a PNG or JPG image.");
              return;
            }
            setImageError("");
            setImage({ name: file.name, url: URL.createObjectURL(file) });
          }}
        />
        <SelectField label="Content Goal" value={draft.goal} options={GOALS} onChange={(value) => set("goal", value)} />
        <SelectField label="Tone of voice" value={draft.tone} options={TONES} onChange={(value) => set("tone", value)} />
        <TextField label="Describe your idea" value={draft.idea} onChange={(value) => set("idea", value)} error={result.ok ? undefined : result.error} />
        <GenerateButton />
      </DetailsPanel>
      <SuggestionsPanel label="AI Content Suggestions">
        {!result.ok ? (
          <EmptyState>Your suggestions will appear here after you generate.</EmptyState>
        ) : (
          <>
            <ResultSection title="Caption">
              <CopyBlock lines={result.caption} />
            </ResultSection>
            <ResultSection title="Visual Guidelines">
              {image ? (
                // A local preview (blob: URL) of the person's own photo, so next/image is not used.
                <div className="grid gap-3 rounded-[10px] border border-brand-teal/10 bg-white/68 p-3.5 min-[621px]:grid-cols-[0.6fr_1.4fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={`Your photo: ${image.name}`} className="max-h-[180px] w-full rounded-[7px] object-cover" />
                  <ul className="grid list-disc gap-1.5 pl-4 text-[12px] leading-[1.5] text-[#41585c]">
                    {result.visual.guidelines.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <VisualCard src={result.visual.src} alt={result.visual.alt} notes={result.visual.guidelines} />
              )}
            </ResultSection>
            <ResultSection title="Suggested Hashtags (optional)">
              <Tags items={result.hashtags} />
            </ResultSection>
            <ResultActions
              tool="social-post"
              title={result.caption[0]}
              text={`${result.caption.join("\n\n")}\n\n${result.hashtags.join(" ")}`}
              onRegenerate={regenerate}
            />
          </>
        )}
      </SuggestionsPanel>
    </ToolGrid>
  );
}

const DURATION_LABELS = VIDEO_DURATIONS.map((duration) => duration.label);

export function VideoTool({ audience }: { audience: string }) {
  const { draft, set, run, generate, regenerate } = useRun({
    idea: EXAMPLE_IDEA,
    platform: "Instagram" as (typeof VIDEO_PLATFORMS)[number],
    goal: "Awareness" as (typeof GOALS)[number],
    format: "Short-form" as (typeof VIDEO_FORMATS)[number],
    duration: "15 seconds" as (typeof DURATION_LABELS)[number],
  });
  const seconds = VIDEO_DURATIONS.find((duration) => duration.label === run.duration)?.seconds ?? 15;
  const result = videoPlan({ ...run, seconds, audience });

  return (
    <ToolGrid>
      <DetailsPanel label="Video Details" onSubmit={generate}>
        <SelectField label="Platform" value={draft.platform} options={VIDEO_PLATFORMS} onChange={(value) => set("platform", value)} />
        <SelectField label="Video Goal" value={draft.goal} options={GOALS} onChange={(value) => set("goal", value)} />
        <SelectField label="Video Format" value={draft.format} options={VIDEO_FORMATS} onChange={(value) => set("format", value)} />
        <SelectField label="Video Duration" value={draft.duration} options={DURATION_LABELS} onChange={(value) => set("duration", value)} />
        <TextField label="Describe your idea" value={draft.idea} onChange={(value) => set("idea", value)} error={result.ok ? undefined : result.error} />
        <GenerateButton />
      </DetailsPanel>
      <SuggestionsPanel label="AI Video Suggestions">
        {!result.ok ? (
          <EmptyState>Your suggestions will appear here after you generate.</EmptyState>
        ) : (
          <>
            <ResultSection title="Video Script">
              <CopyBlock lines={result.script} />
            </ResultSection>
            <ResultSection title="Video Concept">
              <VisualCard src={result.concept.src} alt={result.concept.alt} notes={result.concept.notes} />
            </ResultSection>
            <ResultSection title="Storyboard and Scene Breakdown">
              <NumberedList items={result.scenes.map((scene) => `${scene.label}: ${scene.direction}`)} aside={result.scenes.map((scene) => scene.time)} />
            </ResultSection>
            <ResultActions
              tool="video"
              title={result.script[0]}
              text={`${result.script.join("\n")}\n\n${result.scenes.map((scene) => `${scene.time} ${scene.label}: ${scene.direction}`).join("\n")}`}
              onRegenerate={regenerate}
            />
          </>
        )}
      </SuggestionsPanel>
    </ToolGrid>
  );
}

export function BlogTool({ audience }: { audience: string }) {
  const { draft, set, run, generate, regenerate } = useRun({ idea: "The practical guide to refillable guest amenities for independent hotels." });
  const result = blogPlan({ ...run, audience });

  return (
    <ToolGrid>
      <DetailsPanel label="Blog Details" onSubmit={generate}>
        <TextField label="Topic and content goal" rows={6} value={draft.idea} onChange={(value) => set("idea", value)} error={result.ok ? undefined : result.error} />
        <GenerateButton />
      </DetailsPanel>
      <SuggestionsPanel label="AI Blog Suggestions">
        {!result.ok ? (
          <EmptyState>Your suggestions will appear here after you generate.</EmptyState>
        ) : (
          <>
            <ResultSection title="Suggested Titles">
              <NumberedList items={result.titles} copyable />
            </ResultSection>
            <ResultSection title="Article Outline">
              <CopyBlock lines={result.outline} />
            </ResultSection>
            <div className="grid gap-4 min-[621px]:grid-cols-2">
              <ResultSection title="Key Points & Content Guidance">
                <NumberedList items={result.points} />
              </ResultSection>
              <ResultSection title="SEO Keywords">
                <Tags items={result.keywords} />
              </ResultSection>
            </div>
            <ResultActions
              tool="blog"
              title={result.titles[0]}
              text={`${result.titles[0]}\n\n${result.outline.map((line) => `- ${line}`).join("\n")}\n\nKeywords: ${result.keywords.join(" ")}`}
              onRegenerate={regenerate}
            />
          </>
        )}
      </SuggestionsPanel>
    </ToolGrid>
  );
}

export function AdCopyTool({ audience }: { audience: string }) {
  const { draft, set, run, generate, regenerate } = useRun({
    product: "Refillable hotel amenity collection",
    goal: "Awareness" as (typeof AD_GOALS)[number],
    format: "Image Ad" as (typeof AD_FORMATS)[number],
  });
  const result = adCopy({ ...run, audience });

  return (
    <ToolGrid>
      <DetailsPanel label="Ad Details" onSubmit={generate}>
        <InputField label="Product or Service" value={draft.product} onChange={(value) => set("product", value)} error={result.ok ? undefined : result.error} />
        <SelectField label="Campaign Goal" value={draft.goal} options={AD_GOALS} onChange={(value) => set("goal", value)} />
        <SelectField label="Ad Format" value={draft.format} options={AD_FORMATS} onChange={(value) => set("format", value)} />
        <GenerateButton />
      </DetailsPanel>
      <SuggestionsPanel label="AI Ad Copy Suggestions">
        {!result.ok ? (
          <EmptyState>Your suggestions will appear here after you generate.</EmptyState>
        ) : (
          <>
            <ResultSection title="Ad Headlines">
              <NumberedList items={result.headlines} copyable />
            </ResultSection>
            <ResultSection title="Ad Copy">
              <NumberedList items={result.copy} copyable />
            </ResultSection>
            <div className="grid gap-4 min-[621px]:grid-cols-2">
              <ResultSection title="Call to Action (CTA)">
                <Tags items={result.ctas} />
              </ResultSection>
              <ResultSection title="Creative Guidelines">
                <ul className="grid list-disc gap-1.5 pl-4 text-[12px] leading-[1.5] text-[#41585c]">
                  {result.guidelines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </ResultSection>
            </div>
            <ResultActions
              tool="ad-copy"
              title={result.headlines[0]}
              text={`Headlines:\n${result.headlines.join("\n")}\n\nCopy:\n${result.copy.join("\n")}\n\nCTA: ${result.ctas.join(", ")}`}
              saveLabel="Save Content"
              onRegenerate={regenerate}
            />
          </>
        )}
      </SuggestionsPanel>
    </ToolGrid>
  );
}

