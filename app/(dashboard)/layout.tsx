import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { workspaceFor } from "@/lib/hub/workspace";
import { montserrat } from "../fonts";
import { PageSurface } from "./_components/page-surface";
import { Sidebar, SidebarWithDates } from "./_components/sidebar";
import { TopBar } from "./_components/top-bar";

// Signed-in shell from the Figma Make "Marketing Intelligence Hub" (2026-11-04): a sidebar beside
// a top bar, on the green gradient. On phones the sidebar sits on top with the areas in a row.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const workspace = workspaceFor(await cookies());

  return (
    <div
      className={`${montserrat.className} shell-gradient flex flex-1 flex-col print:block min-[621px]:grid min-[621px]:grid-cols-[220px_minmax(0,1fr)] min-[1101px]:grid-cols-[250px_minmax(0,1fr)]`}
    >
      {/* The sidebar reads the address to keep the chosen dates, so it sits in Suspense (Next.js 16 docs). */}
      <Suspense fallback={<Sidebar workspace={workspace} />}>
        <SidebarWithDates workspace={workspace} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar workspace={workspace} />
        <PageSurface>{children}</PageSurface>
      </div>
    </div>
  );
}
