import { PLATFORM_LABELS } from "@/lib/analytics/types";
import { FORMAT_LABELS, type ContentIdea } from "@/lib/ai-studio/types";
import { buttonClass, secondaryButtonClass } from "./styles";

type IdeaPickerProps = {
  ideas: readonly ContentIdea[];
  onChoose: (idea: ContentIdea) => void;
  onShowMore: () => void;
};

/** Step 1: content ideas built from trends; choosing one moves on to captions. */
export function IdeaPicker({ ideas, onChoose, onShowMore }: IdeaPickerProps) {
  if (ideas.length === 0) {
    return <p className="text-sm text-ink-muted">No trend ideas right now. Check back when new trends appear.</p>;
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {ideas.map((idea) => (
          <article key={idea.id} className="flex flex-col rounded border border-divider p-4">
            <h3 className="font-medium text-ink">{idea.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{idea.angle}</p>
            <p className="mt-3 text-xs text-ink-muted">{`Trend: ${idea.trend}`}</p>
            <p className="text-xs text-ink-muted">
              {`${FORMAT_LABELS[idea.format]} for ${idea.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}`}
            </p>
            <button
              type="button"
              className={`mt-4 self-start ${buttonClass}`}
              aria-label={`Use this idea: ${idea.title}`}
              onClick={() => onChoose(idea)}
            >
              Use this idea
            </button>
          </article>
        ))}
      </div>
      <button type="button" className={`mt-4 ${secondaryButtonClass}`} onClick={onShowMore}>
        Show different ideas
      </button>
    </div>
  );
}
