import Link from "next/link";

type ComingSoonProps = {
  title: string;
  features: readonly string[];
};

/** Placeholder page for a section that is planned but not built yet. */
export function ComingSoon({ title, features }: ComingSoonProps) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Coming soon</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
        {title}
      </h1>
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">What is planned</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
      >
        Back to overview
      </Link>
    </main>
  );
}
