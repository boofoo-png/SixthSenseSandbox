import type { ReactNode } from "react";
import { Sidebar } from "./_components/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 md:flex-row dark:bg-black">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
