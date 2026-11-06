import { THEMES, checkText, pick, sentencesOf, shorten, themeOf, tidy } from "./themes";

// Edit tools from the Figma Make's Content Creation: Edit Posts, Improve Copy, Repurpose content,
// and Upload your file. They rework what the person pastes or uploads with rules and templates.

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

export type Alternative = { label: string; text: string };

export type EditInput = { post: string; change: string; instructions: string; variant: number };
export type EditedPost = {
  caption: [string, string];
  alternatives: Alternative[];
  visual: { src: string; alt: string; notes: string[] };
  hashtags: string[];
};

/** Edit Posts: a clearer, more engaging caption plus three alternative versions. */
export function editPost(input: EditInput): Result<EditedPost> {
  const error = checkText(input.post, "The post");
  if (error) return { ok: false, error };
  const theme = THEMES[themeOf(input.post)];
  const { text } = tidy(input.post);
  const first = sentencesOf(text)[0] ?? text;
  const wantsNextStep = /next step|call to action|cta|action/i.test(`${input.change} ${input.instructions}`);
  const wantsGuest = /guest/i.test(`${input.change} ${input.instructions}`);
  const body = [
    shorten(text, 220),
    wantsGuest ? "Guests notice the difference from the moment they walk in." : "",
    wantsNextStep ? theme.proof : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    ok: true,
    caption: [pick(theme.headlines, input.post, input.variant), body],
    alternatives: [
      { label: "Direct & concise", text: `${shorten(first, 90)} ${theme.proof}` },
      { label: "Warm & inviting", text: `Picture your next guest walking in. ${shorten(first, 110)}` },
      { label: "Benefit-led", text: theme.promise },
    ],
    visual: {
      ...theme.image,
      notes: ["Use one bright photo of the product in a real room.", "Put the first line of the caption on the image."],
    },
    hashtags: [...theme.tags, "#BetterStays"],
  };
}

export const COPY_TYPES = ["Caption", "Ad copy", "Email", "Website copy"] as const;

export type ImproveInput = { type: (typeof COPY_TYPES)[number]; text: string; goal: string; instructions: string; variant: number };
export type ImprovedCopy = { improved: string; alternatives: Alternative[]; improvements: string[] };

const LENGTH: Record<ImproveInput["type"], number> = { Caption: 220, "Ad copy": 125, Email: 600, "Website copy": 400 };

/** Improve Copy: the text with filler removed, a clear benefit first, and a stronger ending. */
export function improveCopy(input: ImproveInput): Result<ImprovedCopy> {
  const error = checkText(input.text, "Your text");
  if (error) return { ok: false, error };
  const theme = THEMES[themeOf(input.text)];
  const { text, removed } = tidy(input.text);
  const sentences = sentencesOf(text);
  const opener = pick(theme.headlines, input.text, input.variant);
  const concise = /concise|short|brief/i.test(`${input.goal} ${input.instructions}`);
  const improved = shorten(`${opener} ${text} ${concise ? "" : theme.proof}`.replace(/\s+/g, " ").trim(), LENGTH[input.type]);
  const improvements = [
    removed > 0 ? `Removed ${removed} filler word${removed === 1 ? "" : "s"} so it reads faster` : "Kept your wording and tightened the structure",
    "Leads with a clear benefit in the first line",
    concise ? `Kept to ${LENGTH[input.type]} characters for a ${input.type.toLowerCase()}` : "Ends with a stronger next step",
  ];
  return {
    ok: true,
    improved,
    alternatives: [
      { label: "Shorter", text: shorten(sentences[0] ?? text, 90) },
      { label: "More persuasive", text: shorten(`${theme.promise} ${theme.proof}`, LENGTH[input.type]) },
      { label: "More conversational", text: shorten(`Here's the thing: ${(sentences[0] ?? text).charAt(0).toLowerCase()}${(sentences[0] ?? text).slice(1)}`, 140) },
    ],
    improvements,
  };
}

export const REPURPOSE_PLATFORMS = ["Instagram", "Facebook", "TikTok", "Blog"] as const;
export type RepurposePlatform = (typeof REPURPOSE_PLATFORMS)[number];

/** Recommended caption lengths; a blog has no limit. */
export const PLATFORM_LIMITS: Record<RepurposePlatform, number | null> = { Instagram: 2200, Facebook: 500, TikTok: 150, Blog: null };

export type RepurposeInput = { text: string; platforms: RepurposePlatform[]; instructions: string };
export type RepurposedVersion = { platform: RepurposePlatform; title: string; text: string; hashtags: string[]; limit: number | null };
export type Repurposed = { versions: RepurposedVersion[]; adjustments: string[] };

/** Repurpose content: one version per platform, within its caption length, with matching hashtags. */
export function repurpose(input: RepurposeInput): Result<Repurposed> {
  const error = checkText(input.text, "Your content");
  if (error) return { ok: false, error };
  if (input.platforms.length === 0) return { ok: false, error: "Choose at least one platform to repurpose for." };
  const theme = THEMES[themeOf(input.text)];
  const { text } = tidy(input.text);
  const first = sentencesOf(text)[0] ?? text;
  const hook = theme.headlines[0];
  // Always in the Make's platform order, however they were picked.
  const versions = REPURPOSE_PLATFORMS.filter((platform) => input.platforms.includes(platform)).map((platform): RepurposedVersion => {
    const limit = PLATFORM_LIMITS[platform];
    switch (platform) {
      case "Instagram":
        return { platform, title: "Instagram Caption", text: shorten(`${hook} ${text}`, 2200), hashtags: [...theme.tags, "#HotelLife"], limit };
      case "Facebook":
        return { platform, title: "Facebook Post", text: shorten(`${text} ${theme.proof}`, 500), hashtags: [theme.tags[0]], limit };
      case "TikTok":
        return { platform, title: "TikTok Caption", text: shorten(`${hook} ${first}`, 150), hashtags: [...theme.tags, "#HotelTok"], limit };
      case "Blog":
        return {
          platform,
          title: "Blog Introduction",
          text: `${theme.headlines[1]} ${text} In this post we look at what it means for your property and how to get started. ${theme.proof}`,
          hashtags: [],
          limit,
        };
    }
  });
  return {
    ok: true,
    versions,
    adjustments: [
      "Shortened the hook for social viewing",
      "Moved the main benefit to the first line",
      input.platforms.includes("TikTok") ? "Kept the TikTok caption under 150 characters" : "Added platform-relevant hashtags",
    ],
  };
}

export const FILE_FOCUS = ["Edit", "Repurpose", "Copy", "Insights"] as const;
export type FileFocus = (typeof FILE_FOCUS)[number];

/** Files read in the browser; others show their name and ask for pasted text (DECISIONS.md 2026-10-30). */
export const READABLE_TYPES = ["txt", "md", "csv"] as const;
export const ACCEPTED_TYPES = [...READABLE_TYPES, "pdf", "docx", "png", "jpg", "jpeg"] as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Whether a file can be used, and whether its text can be read here. */
export function checkFile(name: string, bytes: number): { ok: true; readable: boolean } | { ok: false; error: string } {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ACCEPTED_TYPES as readonly string[]).includes(extension)) {
    return { ok: false, error: "Choose a TXT, MD, CSV, PDF, DOCX, PNG, or JPG file." };
  }
  if (bytes > MAX_FILE_BYTES) return { ok: false, error: "That file is over 10 MB. Choose a smaller one." };
  return { ok: true, readable: (READABLE_TYPES as readonly string[]).includes(extension) };
}

export type FileAnalysis = { preview: string; summary: string; words: number; actions: string[]; takeaways: string[] };

const ACTIONS: Record<FileFocus, string[]> = {
  Edit: ["Edit for clarity", "Create summary", "Repurpose content"],
  Repurpose: ["Repurpose content", "Write a caption", "Turn into ad copy"],
  Copy: ["Turn into ad copy", "Write a caption", "Pull out a headline"],
  Insights: ["List key messages", "Find missing proof points", "Compare with competitors"],
};

/** Upload your file: a preview, a one-line summary, suggested actions, and takeaways. */
export function analyseText(text: string, focus: FileFocus): Result<FileAnalysis> {
  const error = checkText(text.slice(0, 2000), "The file's text");
  if (error) return { ok: false, error };
  const sentences = sentencesOf(text);
  const words = text.trim().split(/\s+/).length;
  const longest = sentences.reduce((a, b) => (b.length > a.length ? b : a), "");
  const theme = themeOf(text);
  return {
    ok: true,
    preview: shorten(text, 320),
    summary: shorten(sentences[0] ?? text, 160),
    words,
    actions: ACTIONS[focus],
    takeaways: [
      theme === "general" ? "The main message is broad; pick one benefit to lead with" : `The ${theme} message is the strongest angle`,
      sentences.length > 1 && longest.split(/\s+/).length > 25
        ? `The longest sentence has ${longest.split(/\s+/).length} words; split it in two`
        : `At ${words} words it is easy to read; keep it that way`,
      /\d/.test(text) ? "Keep the numbers: they make the claim believable" : "Add one measurable proof point, like a number or result",
    ],
  };
}
