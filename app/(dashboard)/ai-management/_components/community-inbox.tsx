"use client";

import { useState, useSyncExternalStore } from "react";
import { LineIcon } from "@/components/line-icons";
import {
  CONVERSATIONS,
  INBOX_KEY,
  checkReply,
  loadReplies,
  openCount,
  saveReplies,
  sentimentShares,
  type Conversation,
  type Replies,
} from "@/lib/hub/inbox";
import { PanelHeading, eyebrowClass, panelClass, panelTitleClass } from "../../_components/make-ui";

// The Figma Make's AI Management page: a unified inbox with suggested replies, conversation
// sentiment, and response time. Approving records the reply in this browser; nothing is sent.

const EMPTY: Replies = {};
const listeners = new Set<() => void>();
let cache: Replies | null = null;

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getSnapshot(): Replies {
  if (cache === null) cache = loadReplies(storage());
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === INBOX_KEY || event.key === null) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setReplies(next: Replies) {
  cache = next;
  saveReplies(storage(), next);
  for (const listener of listeners) listener();
}

/** Clears the in-memory copy so tests start fresh. */
export function resetInboxForTests() {
  cache = null;
}

const SENTIMENT_STYLES = {
  positive: { label: "Positive", chip: "bg-[#e8f4ee] text-brand-teal", dot: "bg-brand-teal" },
  neutral: { label: "Neutral", chip: "bg-brand-lime text-[#4f5d1f]", dot: "bg-brand-lime" },
  negative: { label: "Negative", chip: "bg-brand-coral/30 text-[#7a2634]", dot: "bg-brand-coral" },
} as const;

function minutesLabel(minutes: number): string {
  return minutes < 60 ? `${minutes} minutes ago` : `${Math.round(minutes / 60)} hour${minutes >= 120 ? "s" : ""} ago`;
}

function InboxCard({ item, approved, onApprove }: { item: Conversation; approved?: string; onApprove: (text: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.reply);
  const [error, setError] = useState("");
  const sentiment = SENTIMENT_STYLES[item.sentiment];

  return (
    <li className={`rounded-[9px] border p-[13px] ${approved ? "border-[#c7dfd4] bg-[#f4faf7]" : "border-brand-teal/12 bg-[#fafaf8]"}`}>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="grid size-[30px] place-items-center rounded-full bg-brand-blue text-[10px] font-bold text-brand-cream">
          {item.initials}
        </span>
        <div className="flex-1">
          <strong className="block text-[13px] text-brand-navy">{item.name}</strong>
          <p className="mt-0.5 text-[11px] text-[#6f7377]">
            {item.channel} · {minutesLabel(item.minutesAgo)}
          </p>
        </div>
        <span className={`rounded-[20px] px-2 py-[3px] text-[10px] font-semibold ${sentiment.chip}`}>{sentiment.label}</span>
      </div>
      <p className="mt-2.5 text-[13px] leading-[1.45] text-[#3f4346]">&ldquo;{item.message}&rdquo;</p>
      <div className="mt-2 grid gap-3 rounded-lg bg-[#f0f5f4] p-2.5 min-[621px]:grid-cols-[120px_minmax(0,1fr)]">
        <span className="flex items-start gap-[5px] text-[10px] font-bold text-brand-teal uppercase">
          <LineIcon name="sparkles" size={14} /> {approved ? "Approved reply" : "Suggested reply"}
        </span>
        {editing && !approved ? (
          <div className="grid gap-1.5">
            <label htmlFor={`reply-${item.id}`} className="sr-only">
              Reply to {item.name}
            </label>
            <textarea
              id={`reply-${item.id}`}
              value={text}
              rows={3}
              maxLength={1000}
              aria-invalid={error ? true : undefined}
              onChange={(event) => setText(event.target.value)}
              className="w-full rounded-lg border border-brand-teal/25 bg-white px-2.5 py-2 text-[12px] text-brand-navy outline-none focus:border-brand-teal"
            />
            {error && (
              <p role="alert" className="text-[11px] font-semibold text-[#9b2c2c]">
                {error}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[12px] leading-[1.45] text-[#4f5a5c]">{approved ?? text}</p>
        )}
      </div>
      <div className="mt-2.5 flex justify-end gap-[7px]">
        {!approved && (
          <button
            type="button"
            onClick={() => {
              setEditing((value) => !value);
              setError("");
            }}
            className="min-h-[29px] rounded-md border border-brand-teal/15 bg-[#fafaf9] px-3 text-[11px] font-medium text-[#4f5357] hover:border-brand-teal"
          >
            {editing ? "Done editing" : "Adjust"}
          </button>
        )}
        <button
          type="button"
          disabled={Boolean(approved)}
          onClick={() => {
            const problem = checkReply(text);
            if (problem) {
              setEditing(true);
              setError(problem);
              return;
            }
            setEditing(false);
            onApprove(text.trim());
          }}
          className={`min-h-[29px] w-[135px] rounded-md text-[11px] font-semibold text-brand-cream ${approved ? "bg-[#4e8067]" : "bg-brand-teal hover:bg-[#00545f]"}`}
        >
          {approved ? "Approved" : "Approve & reply"}
        </button>
      </div>
    </li>
  );
}

export function CommunityInbox() {
  const replies = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const shares = sentimentShares(CONVERSATIONS);
  const ring = `radial-gradient(circle, var(--brand-cream) 0 57%, transparent 58%), conic-gradient(var(--brand-teal) 0 ${shares.positive}%, var(--brand-lime) ${shares.positive}% ${shares.positive + shares.neutral}%, var(--brand-coral) ${shares.positive + shares.neutral}%)`;

  return (
    <div className="grid gap-3 min-[901px]:grid-cols-[minmax(0,1.4fr)_minmax(290px,0.65fr)]">
      <section aria-labelledby="inbox-title" className={`${panelClass} min-[901px]:min-h-[650px]`}>
        <PanelHeading id="inbox-title" eyebrow="Unified inbox" title="Needs your review">
          <span className="rounded-[20px] bg-[#f6f7ed] px-2 py-1 text-[11px] font-semibold text-brand-blue">{openCount(CONVERSATIONS, replies)} open</span>
        </PanelHeading>
        <ul className="mt-4 grid gap-2.5">
          {CONVERSATIONS.map((item) => (
            <InboxCard
              key={item.id}
              item={item}
              approved={replies[item.id]?.text}
              onApprove={(text) => setReplies({ ...getSnapshot(), [item.id]: { text, approvedAt: Date.now() } })}
            />
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-[#6f7377]">
          Sample messages. Suggested replies are templates, and approving one only records it here: nothing is posted, because no
          real accounts are connected yet.
        </p>
      </section>

      <aside className="grid content-start gap-3">
        <section aria-labelledby="sentiment-title" className={panelClass}>
          <p className={eyebrowClass}>Community health</p>
          <h2 id="sentiment-title" className={panelTitleClass}>
            Conversation sentiment
          </h2>
          <div className="mt-[18px] flex items-center gap-[18px]">
            <span
              role="img"
              aria-label={`${shares.positive}% of conversations are positive`}
              className="flex size-[110px] shrink-0 flex-col items-center justify-center rounded-full"
              style={{ background: ring }}
            >
              <strong className="text-[22px] text-brand-navy">{shares.positive}%</strong>
              <small className="text-[10px] text-[#6f7377]">positive</small>
            </span>
            <dl className="grid flex-1 gap-2.5">
              {(["positive", "neutral", "negative"] as const).map((kind) => (
                <div key={kind} className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5 text-[12px] text-[#5f6366]">
                  <i aria-hidden="true" className={`size-2 rounded-full ${SENTIMENT_STYLES[kind].dot}`} />
                  <dt>{SENTIMENT_STYLES[kind].label}</dt>
                  <dd className="font-semibold text-brand-navy">{shares[kind]}%</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section aria-labelledby="response-title" className={`${panelClass} grid justify-items-start`}>
          <span className="grid size-[30px] place-items-center rounded-[7px] bg-[#ecffb6] text-[#00804c]">
            <LineIcon name="message" />
          </span>
          <h2 id="response-title" className="mt-3.5 mb-0.5 text-[12px] font-normal text-[#5f6366]">
            Average response time
          </h2>
          <strong className="text-[28px] text-brand-navy">12 min</strong>
          <small className="text-[11px] font-semibold text-brand-teal">38% faster this week (sample)</small>
        </section>
      </aside>
    </div>
  );
}
