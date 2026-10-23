import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NEW_ACCOUNT_COOKIE } from "@/lib/hub/constants";
import { DashboardTiles } from "./_components/dashboard-tiles";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Choose what you would like to do in Sixth Sense.",
};

// The mid-fi dashboard. Right after sign-up it is the "New account" version; when someone signs
// in again it is the "Have account before" version, with Welcome Back! and two extra tiles.
export default async function DashboardPage() {
  const isNewAccount = Boolean((await cookies()).get(NEW_ACCOUNT_COOKIE)?.value);

  return (
    <main className="flex-1 bg-paper">
      <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16 lg:px-20 lg:py-20">
        <div className="flex flex-col gap-6">
          {!isNewAccount && (
            <p className="text-[25px] leading-[1.235] tracking-[0.25px] text-ink sm:text-[34px]">Welcome Back!</p>
          )}
          <h1 className="text-[38px] leading-[1.2] font-light tracking-[-0.5px] text-ink sm:text-[60px]">
            What would you like to do?
          </h1>
          <form action="/ask" method="get" role="search">
            <input
              type="search"
              name="q"
              aria-label="Ask anything"
              placeholder="Ask anything"
              className="w-full rounded border-2 border-outline bg-paper px-[14px] py-2 text-[16px] leading-6 tracking-[0.15px] text-ink outline-none placeholder:text-ink-disabled hover:border-ink focus:border-primary"
            />
          </form>
        </div>
        <DashboardTiles returning={!isNewAccount} />
      </div>
    </main>
  );
}
