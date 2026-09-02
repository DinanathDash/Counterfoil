"use client";

import { Sidebar } from "./Sidebar";
import { useSidebarStore } from "@/store/useSidebarStore";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isCollapsed ? "ml-[80px]" : "ml-[280px]"
        )}
      >
        <main className="flex-1 p-6 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
