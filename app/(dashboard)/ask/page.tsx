import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/alert";
import { cardClass, cardHeadingClass, linkClass, pageClass, subtitleClass, titleClass } from "../_components/styles";

export const metadata: Metadata = { title: "Ask anything", description: "Ask Sixth Sense about your market." };

// Where the dashboard's "Ask anything" box and the top bar's search icon lead. Answers come with
// the site map's "Ask the Hub" (plan step 6.2); until then this page is honest about it.

const SUGGESTED = [
  "What's trending in hotel amenities?",
  "How are competitors reaching care homes?",
  "What do senior living buyers care about?",
];

const PLANNED = [
  "Answers about trends, audiences, competitors, and campaign ideas, with supporting sources",
  "A follow-up question when Sixth Sense needs to know which audience to focus on",
  "Save what you find, or turn it into a campaign",
];

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const { q } = await searchParams;
  const question = typeof q === "string" ? q.trim().slice(0, 300) : "";

  return (
    <main className={pageClass}>
      <h1 className={titleClass}>Ask anything</h1>
      <p className={subtitleClass}>Ask about trends, audiences, competitors, or campaign ideas.</p>
      <form action="/ask" method="get" role="search" className="mt-6 max-w-3xl">
        <input
          type="search"
          name="q"
          aria-label="Ask anything"
          placeholder="Ask anything"
          defaultValue={question}
          className="w-full rounded border-2 border-outline bg-paper px-[14px] py-2 text-[16px] leading-6 tracking-[0.15px] text-ink outline-none placeholder:text-ink-disabled hover:border-ink focus:border-primary"
        />
      </form>

      {question ? (
        <section className={`mt-6 max-w-3xl ${cardClass}`}>
          <p className="text-[16px] leading-[1.5] text-ink">
            You asked: <q className="font-medium">{question}</q>
          </p>
          <Alert severity="info" className="mt-4">
            Answers aren&apos;t available yet. Ask anything is part of a later step of the prototype.
          </Alert>
          <h2 className={`mt-6 ${cardHeadingClass}`}>What is planned</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink">
            {PLANNED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-6 max-w-3xl">
          <h2 className={cardHeadingClass}>Try asking</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {SUGGESTED.map((suggestion) => (
              <li key={suggestion}>
                <Link href={`/ask?q=${encodeURIComponent(suggestion)}`} className={linkClass}>
                  {suggestion}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
