"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/auth/useRole";

export function AuthActions() {
  const { isAdmin } = useRole();

  return (
    <div className="w-full sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-end">
        <SignedIn>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-black text-white">
                ADMIN
              </span>
            )}

            <UserButton />
          </div>
        </SignedIn>

        <SignedOut>
          <SignInButton>
            <Button
              variant="default"
              size="sm"
              className="font-medium shadow-sm"
            >
              Giriş Yap
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}
