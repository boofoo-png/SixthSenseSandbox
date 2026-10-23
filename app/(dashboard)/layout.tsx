import { Suspense, type ReactNode } from "react";
import { AppBar, AppBarWithDates } from "./_components/app-bar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-canvas print:bg-white">
      {/* The top bar reads the address to keep the chosen dates, so it sits in Suspense (Next.js 16 docs). */}
      <Suspense fallback={<AppBar />}>
        <AppBarWithDates />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
