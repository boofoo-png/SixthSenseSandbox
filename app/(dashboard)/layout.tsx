import { Suspense, type ReactNode } from "react";
import { Sidebar, SidebarWithDates } from "./_components/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 md:flex-row dark:bg-black">
      {/* The sidebar reads the address to keep the chosen dates, so it sits in Suspense (Next.js 16 docs). */}
      <Suspense fallback={<Sidebar />}>
        <SidebarWithDates />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
