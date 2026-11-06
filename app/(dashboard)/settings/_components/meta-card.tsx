"use client";

import { useFormStatus } from "react-dom";
import { LineIcon } from "@/components/line-icons";
import type { ConnectionSummary } from "@/lib/social/meta/access";
import type { MetaResult } from "@/lib/social/meta/results";
import { disconnectMeta } from "../actions";

// Settings, Workspace: connect the chosen business's Instagram professional account and Facebook
// Page (read only). The card sits inside the settings form, so Disconnect uses formAction.

const MESSAGES: Record<MetaResult, { text: string; tone: "good" | "bad" }> = {
  connected: { text: "Connected. Overview and Reports now show live Instagram numbers for this business.", tone: "good" },
  disconnected: { text: "Disconnected. Overview and Reports show sample numbers again.", tone: "good" },
  cancelled: { text: "Facebook login was cancelled, so nothing was connected.", tone: "bad" },
  "no-instagram": { text: "None of the Pages you shared has an Instagram professional account linked. Link one to a Facebook Page, then connect again and tick that Page.", tone: "bad" },
  permission: { text: "Facebook didn't give Sixth Sense the permissions it needs. Connect again and leave every permission ticked.", tone: "bad" },
  "not-configured": { text: "The Meta app isn't set up for this copy of Sixth Sense yet (see docs/META_SETUP.md).", tone: "bad" },
  "expired-login": { text: "That login took too long or was started in another browser. Please connect again.", tone: "bad" },
  error: { text: "Something went wrong talking to Meta. Please try again in a minute.", tone: "bad" },
};

const dateOf = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

const button = "inline-flex min-h-[38px] items-center rounded-[18px] px-4 text-[13px] font-semibold";

function DisconnectButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" formAction={disconnectMeta} formNoValidate disabled={pending} className={`${button} border border-brand-teal/40 bg-white text-brand-teal hover:bg-brand-cream disabled:opacity-50`}>
      {pending ? "Disconnecting…" : "Disconnect"}
    </button>
  );
}

export function MetaCard({ summary, result, businessName }: { summary: ConnectionSummary; result: MetaResult | null; businessName: string }) {
  const message = result ? MESSAGES[result] : null;
  return (
    <div className="mt-4 grid gap-3 rounded-[12px] border border-brand-teal/15 bg-white/75 p-4" aria-labelledby="meta-card-title">
      <div className="flex items-start gap-3">
        <LineIcon name="link" size={18} className="mt-0.5 shrink-0 text-brand-teal" />
        <div className="grid min-w-0 gap-1 text-[13px]">
          <strong id="meta-card-title" className="text-[14px]">
            Instagram and Facebook for {businessName}
          </strong>
          {summary.status === "connected" ? (
            <p className="break-words text-[#3f4b4d]">
              Connected to <strong>@{summary.igUsername}</strong> through the Facebook Page <strong>{summary.pageName}</strong> on {dateOf(summary.connectedAt)}. Access lasts until{" "}
              {dateOf(summary.expiresAt)}; connect again after that. Read only: nothing is ever posted.
            </p>
          ) : summary.status === "not-connected" ? (
            <p className="text-[#3f4b4d]">Connect an Instagram professional account (linked to a Facebook Page) to see its real followers, reach, views, and top posts. Read only: nothing is ever posted.</p>
          ) : (
            <p className="text-[#3f4b4d]">Not available yet: the Meta app keys are not set up for this copy of Sixth Sense.</p>
          )}
        </div>
      </div>
      {message && (
        <p role="status" className={`rounded-[10px] px-3 py-2 text-[12px] font-semibold ${message.tone === "good" ? "bg-brand-lime/50 text-brand-navy" : "bg-[#fbe9e7] text-[#9b2c2c]"}`}>
          {message.text}
        </p>
      )}
      {summary.status !== "not-configured" && (
        <div className="flex flex-wrap gap-2">
          {/* A plain link: /api/meta/connect is a route handler that redirects to Facebook. */}
          <a href="/api/meta/connect" className={`${button} bg-brand-teal text-brand-cream hover:bg-brand-navy`}>
            {summary.status === "connected" ? "Reconnect" : "Connect Instagram and Facebook"}
          </a>
          {summary.status === "connected" && <DisconnectButton />}
        </div>
      )}
    </div>
  );
}
