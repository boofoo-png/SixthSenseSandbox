"use client";

import Link from "next/link";
import { useState } from "react";
import { LineIcon } from "@/components/line-icons";
import {
  COPY_TYPES,
  FILE_FOCUS,
  REPURPOSE_PLATFORMS,
  analyseText,
  checkFile,
  editPost,
  improveCopy,
  repurpose,
  type FileFocus,
  type RepurposePlatform,
} from "@/lib/hub/content/edit";
import { LIBRARY_SAMPLES, fromSaved, libraryText } from "@/lib/hub/content/library";
import type { SavedContent } from "@/lib/hub/content/saved";
import { THEMES, themeOf } from "@/lib/hub/content/themes";
import { useRun } from "./create-tools";
import {
  Alternatives,
  ChoiceGrid,
  CopyBlock,
  DetailsPanel,
  EmptyState,
  GenerateButton,
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
import { useSavedContent } from "./use-saved-content";

// The four edit tools from the Figma Make's Content Creation. Text files are read in the browser;
// other files show their name and ask for the text to be pasted (docs/DECISIONS.md 2026-10-30).

const TEXT_ACCEPT = ".txt,.md,.csv,text/plain,text/markdown,text/csv";

/** Reads a TXT, MD, or CSV file in the browser; null for other types. */
async function readTextFile(file: File): Promise<{ text: string | null; error?: string }> {
  const check = checkFile(file.name, file.size);
  if (!check.ok) return { text: null, error: check.error };
  if (!check.readable) return { text: null };
  try {
    return { text: await file.text() };
  } catch {
    return { text: null, error: "We couldn't read that file. Paste its text instead." };
  }
}

export function EditPostsTool() {
  const { draft, set, run, generate, regenerate } = useRun({
    post: "Refillable amenities help hotels make a positive change. Our new collection is available now.",
    change: "Make this post more engaging and clearer while keeping the professional tone.",
    instructions: "Add one detail about the guest experience and end with a direct next step.",
  });
  const [file, setFile] = useState<{ name: string; error?: string; note?: string } | null>(null);
  const result = editPost(run);

  return (
    <ToolGrid wide>
      <DetailsPanel label="Post to Edit" onSubmit={generate}>
        <UploadZone
          label="Upload your post"
          hint="TXT or MD is read here; for an image, paste its caption below"
          accept={`${TEXT_ACCEPT},image/png,image/jpeg`}
          fileName={file?.name}
          error={file?.error}
          large
          onFile={async (chosen) => {
            const { text, error } = await readTextFile(chosen);
            if (text !== null) set("post", text.slice(0, 2000));
            setFile({ name: chosen.name, error, note: text === null && !error ? "Paste the post's caption below to edit it." : undefined });
          }}
        />
        {file?.note && <p className="-mt-3 mb-3 text-[12px] text-[#5d6c6f]">{file.note}</p>}
        <TextField label="Post caption" value={draft.post} onChange={(value) => set("post", value)} error={result.ok ? undefined : result.error} />
        <TextField label="What would you like to change?" rows={3} value={draft.change} onChange={(value) => set("change", value)} />
        <TextField label="Specific instructions (optional)" rows={3} value={draft.instructions} onChange={(value) => set("instructions", value)} />
        <GenerateButton label="Enhance with AI" />
      </DetailsPanel>
      <SuggestionsPanel label="AI Enhanced Suggestions">
        {!result.ok ? (
          <EmptyState>Your AI suggestions will appear here.</EmptyState>
        ) : (
          <>
            <ResultSection title="Enhanced Caption">
              <CopyBlock lines={result.caption} />
            </ResultSection>
            <ResultSection title="Alternative Options">
              <Alternatives items={result.alternatives} />
            </ResultSection>
            <ResultSection title="Visual Suggestions (optional)">
              <VisualCard src={result.visual.src} alt={result.visual.alt} notes={result.visual.notes} />
            </ResultSection>
            <ResultSection title="Suggested Hashtags (optional)">
              <Tags items={result.hashtags} />
            </ResultSection>
            <ResultActions
              tool="edit-posts"
              title={result.caption[0]}
              text={`${result.caption.join("\n\n")}\n\n${result.hashtags.join(" ")}`}
              saveLabel="Save Changes"
              onRegenerate={regenerate}
            />
          </>
        )}
      </SuggestionsPanel>
    </ToolGrid>
  );
}

export function ImproveCopyTool() {
  const { draft, set, run, generate, regenerate } = useRun({
    type: "Caption" as (typeof COPY_TYPES)[number],
    text: "Refillable amenities help hotels make a positive change.",
    goal: "Make it more engaging, persuasive, and specific.",
    instructions: "Keep the copy concise and professional.",
  });
  const result = improveCopy(run);

  return (
    <ToolGrid wide>
      <DetailsPanel label="Text to Improve" onSubmit={generate}>
        <SelectField label="Content type" value={draft.type} options={COPY_TYPES} onChange={(value) => set("type", value)} />
        <TextField label="Your text" value={draft.text} onChange={(value) => set("text", value)} error={result.ok ? undefined : result.error} />
        <TextField label="What would you like to improve?" rows={3} value={draft.goal} onChange={(value) => set("goal", value)} />
        <TextField label="Additional instructions (optional)" rows={3} value={draft.instructions} onChange={(value) => set("instructions", value)} />
        <GenerateButton label="Improve with AI" />
      </DetailsPanel>
      <SuggestionsPanel label="AI Improved Suggestions">
        {!result.ok ? (
          <EmptyState>Your AI suggestions will appear here.</EmptyState>
        ) : (
          <>
            <ResultSection title="Improved Version">
              <CopyBlock lines={[result.improved]} />
            </ResultSection>
            <ResultSection title="Alternative Options">
              <Alternatives items={result.alternatives} />
            </ResultSection>
            <ResultSection title="Key Improvements">
              <NumberedList items={result.improvements} />
            </ResultSection>
            <ResultActions tool="improve-copy" title={result.improved.slice(0, 60)} text={result.improved} saveLabel="Save Changes" onRegenerate={regenerate} />
          </>
        )}
      </SuggestionsPanel>
    </ToolGrid>
  );
}

const PLATFORM_ICONS: Record<RepurposePlatform, "message" | "content"> = { Instagram: "message", Facebook: "message", TikTok: "message", Blog: "content" };

const EXAMPLE_SOURCE = "Refillable amenities help independent hotels reduce everyday waste while improving the guest experience.";

/** Repurpose content; `from` is a My Content item to start from (its Reuse link). */
export function RepurposeTool({ from }: { from?: string }) {
  const { items } = useSavedContent();
  const source = from ? [...fromSaved(items), ...LIBRARY_SAMPLES].find((item) => item.id === from) : undefined;
  const text = source ? libraryText(source) : null;
  // Saved content appears once the browser has read it, so the editor starts again with that text.
  return <RepurposeEditor key={text ? from : "example"} items={items} initialText={text?.slice(0, 2000) ?? EXAMPLE_SOURCE} />;
}

function RepurposeEditor({ items, initialText }: { items: SavedContent[]; initialText: string }) {
  const { draft, set, run, generate, regenerate } = useRun({
    text: initialText,
    platforms: ["Instagram", "Blog"] as RepurposePlatform[],
    instructions: "Make each version native to its platform.",
  });
  const [tab, setTab] = useState<RepurposePlatform | null>(null);
  const result = repurpose(run);
  const current = result.ok ? (result.versions.find((version) => version.platform === tab) ?? result.versions[0]) : null;
  const theme = THEMES[themeOf(run.text)];

  return (
    <ToolGrid wide>
      <DetailsPanel
        label="Source Content"
        onSubmit={() => {
          setTab(null);
          generate();
        }}
      >
        <SelectField
          label="Select saved content"
          value={"Choose from saved content"}
          options={["Choose from saved content", ...items.map((item) => item.id)]}
          labelOf={(id) => items.find((item) => item.id === id)?.title ?? id}
          onChange={(id) => {
            const item = items.find((entry) => entry.id === id);
            if (item) set("text", item.text.slice(0, 2000));
          }}
        />
        {items.length === 0 && <p className="-mt-2 mb-3 text-[11px] text-[#5d6c6f]">Nothing saved yet. Save a result from any tool to reuse it here.</p>}
        <TextField label="Paste your content" value={draft.text} onChange={(value) => set("text", value)} error={result.ok || run.platforms.length === 0 ? undefined : result.error} />
        <ChoiceGrid
          label="Repurpose for"
          options={REPURPOSE_PLATFORMS}
          isSelected={(platform) => draft.platforms.includes(platform)}
          onToggle={(platform) =>
            set("platforms", draft.platforms.includes(platform) ? draft.platforms.filter((item) => item !== platform) : [...draft.platforms, platform])
          }
          icon={(platform) => PLATFORM_ICONS[platform]}
        />
        {!result.ok && run.platforms.length === 0 && (
          <p role="alert" className="-mt-2 mb-3 text-[12px] font-semibold text-[#9b2c2c]">
            {result.error}
          </p>
        )}
        <TextField label="Additional instructions (optional)" rows={3} value={draft.instructions} onChange={(value) => set("instructions", value)} />
        <GenerateButton label="Enhance with AI" />
      </DetailsPanel>
      <SuggestionsPanel label="AI Repurposed Content">
        {!result.ok || !current ? (
          <EmptyState>Your AI suggestions will appear here.</EmptyState>
        ) : (
          <>
            <div role="tablist" aria-label="Platform" className="mb-[18px] flex gap-4 border-b border-brand-teal/14 pb-2.5">
              {result.versions.map((version) => {
                const selected = version.platform === current.platform;
                return (
                  <button
                    key={version.platform}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setTab(version.platform)}
                    className={`relative text-[12px] font-bold ${selected ? "text-brand-teal after:absolute after:inset-x-0 after:-bottom-[11px] after:h-0.5 after:rounded after:bg-brand-teal" : "text-[#5f6b6d] hover:text-brand-teal"}`}
                  >
                    {version.platform}
                  </button>
                );
              })}
            </div>
            <div role="tabpanel" aria-label={current.platform}>
              <ResultSection title={current.title}>
                <VisualCard
                  src={current.platform === "Blog" ? theme.image.src : "/content/dispenser.jpg"}
                  alt={current.platform === "Blog" ? theme.image.alt : "A refillable soap dispenser ready for a hospitality post"}
                  notes={[current.text]}
                  tall
                />
                <small className="text-[11px] text-[#5f6b6d]">
                  {current.text.length} characters{current.limit ? ` (limit ${current.limit})` : ""}
                </small>
              </ResultSection>
              {current.hashtags.length > 0 && (
                <ResultSection title="Suggested Hashtags (optional)">
                  <Tags items={current.hashtags} />
                </ResultSection>
              )}
            </div>
            <ResultSection title="Key adjustments">
              <NumberedList items={result.adjustments} />
            </ResultSection>
            <ResultActions
              tool="repurpose"
              title={`${current.title}: ${current.text.slice(0, 40)}`}
              text={`${current.text}${current.hashtags.length ? `\n\n${current.hashtags.join(" ")}` : ""}`}
              saveLabel="Save Version"
              onRegenerate={regenerate}
            />
          </>
        )}
      </SuggestionsPanel>
    </ToolGrid>
  );
}

const SAMPLE_DRAFT =
  "Our refillable amenity collection helps independent hotels cut single-use plastic in every room. Guests notice the difference, and housekeeping saves time on restocking because one refill lasts for weeks across a busy season. Ask us for a sample kit.";

const FOCUS_ICONS: Record<FileFocus, "edit" | "repeat" | "sparkles"> = { Edit: "edit", Repurpose: "repeat", Copy: "edit", Insights: "sparkles" };
const ACTION_LINKS: Record<string, string> = {
  "Edit for clarity": "/content/edit-posts",
  "Repurpose content": "/content/repurpose",
  "Turn into ad copy": "/content/ad-copy",
  "Write a caption": "/content/social-post",
  "Compare with competitors": "/competitors",
};

export function UploadTool() {
  const { draft, set, run, generate, regenerate } = useRun({
    text: SAMPLE_DRAFT,
    focus: "Edit" as FileFocus,
    instructions: "Identify the strongest message and recommend practical improvements.",
  });
  const [file, setFile] = useState<{ name: string; readable: boolean; error?: string } | null>(null);
  const [tab, setTab] = useState<"preview" | "summary">("preview");
  const result = analyseText(run.text, run.focus);

  return (
    <ToolGrid wide>
      <DetailsPanel label="File Details" onSubmit={generate}>
        <UploadZone
          label="Upload your file"
          hint="TXT, MD, or CSV is read here; DOCX, PDF, or images ask for the text. Up to 10 MB. Nothing leaves your browser."
          accept=".txt,.md,.csv,.pdf,.docx,.png,.jpg,.jpeg"
          fileName={file?.name}
          error={file?.error}
          large
          onFile={async (chosen) => {
            const { text, error } = await readTextFile(chosen);
            if (text !== null) set("text", text.slice(0, 2000));
            setFile({ name: chosen.name, readable: text !== null, error });
          }}
        />
        {file && !file.readable && !file.error && (
          <p className="-mt-3 mb-3 text-[12px] text-[#5d6c6f]">This prototype can&apos;t read that file type yet. Paste its text below.</p>
        )}
        <TextField
          label={file ? "The file's text" : "The file's text (a sample draft until you upload one)"}
          rows={6}
          value={draft.text}
          onChange={(value) => set("text", value)}
          error={result.ok ? undefined : result.error}
        />
        <ChoiceGrid
          label="What would you like us to focus on?"
          options={FILE_FOCUS}
          isSelected={(option) => draft.focus === option}
          onToggle={(option) => set("focus", option)}
          icon={(option) => FOCUS_ICONS[option]}
        />
        <TextField label="Specific instructions (optional)" rows={3} value={draft.instructions} onChange={(value) => set("instructions", value)} />
        <GenerateButton label="Analyze with AI" />
      </DetailsPanel>
      <SuggestionsPanel label="AI Suggestions">
        {!result.ok ? (
          <EmptyState>Your AI suggestions will appear here.</EmptyState>
        ) : (
          <>
            <div role="tablist" aria-label="View" className="mb-[18px] flex gap-4 border-b border-brand-teal/14 pb-2.5">
              {(["preview", "summary"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={`relative text-[12px] font-bold ${tab === value ? "text-brand-teal after:absolute after:inset-x-0 after:-bottom-[11px] after:h-0.5 after:rounded after:bg-brand-teal" : "text-[#5f6b6d] hover:text-brand-teal"}`}
                >
                  {value === "preview" ? "File preview" : "Summary"}
                </button>
              ))}
            </div>
            <p className="-mt-2 mb-3.5 text-[11px] text-[#5f6b6d]">
              Analysis focus: {run.focus} · {result.words} words
            </p>
            <div role="tabpanel" aria-label={tab === "preview" ? "File preview" : "Summary"}>
              <ResultSection title={tab === "preview" ? "File preview" : "Summary"}>
                {tab === "preview" ? (
                  <VisualCard src="/content/amenities.jpg" alt="" notes={[result.preview]} tall />
                ) : (
                  <CopyBlock lines={[result.summary]} />
                )}
              </ResultSection>
            </div>
            <ResultSection title="Suggested Actions">
              <ul className="grid gap-2.5 min-[621px]:grid-cols-3">
                {result.actions.map((action) => (
                  <li key={action}>
                    {ACTION_LINKS[action] ? (
                      <Link
                        href={ACTION_LINKS[action]}
                        className="flex min-h-12 items-center justify-between gap-2 rounded-[9px] border border-brand-teal/11 bg-white/65 p-3 text-[12px] font-semibold text-brand-teal hover:border-brand-teal"
                      >
                        {action} <LineIcon name="chevron" size={14} />
                      </Link>
                    ) : (
                      <span className="flex min-h-12 items-center rounded-[9px] border border-brand-teal/11 bg-white/65 p-3 text-[12px] font-semibold text-[#41585c]">{action}</span>
                    )}
                  </li>
                ))}
              </ul>
            </ResultSection>
            <ResultSection title="Key Takeaways">
              <NumberedList items={result.takeaways} />
            </ResultSection>
            <ResultActions
              tool="upload"
              title={file?.name ?? "Uploaded draft"}
              text={run.text}
              saveLabel="Save Content"
              onRegenerate={regenerate}
            />
          </>
        )}
      </SuggestionsPanel>
    </ToolGrid>
  );
}
