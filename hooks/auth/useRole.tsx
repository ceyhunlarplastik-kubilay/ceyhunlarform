"use client";

import { useUser } from "@clerk/nextjs";

export function useRole() {
  const { user } = useUser();
  return {
    role: user?.publicMetadata?.role as "admin" | "user" | undefined,
    isAdmin: user?.publicMetadata?.role === "admin",
  };
}
