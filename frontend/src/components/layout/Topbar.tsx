"use client";

import { useAuthStore } from "@/store/useAuthStore";

export function Topbar() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-surface border-b border-line sticky top-0 z-10 flex items-center justify-end px-6">
      {user ? (
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-ink leading-none">
              {user.name}
            </p>
            <p className="text-xs text-muted mt-1">{user.role}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="h-9 w-9 rounded-full bg-canvas animate-pulse" />
      )}
    </header>
  );
}
