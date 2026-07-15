"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { homeForRole } from "@/lib/roles";

export default function Home() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(homeForRole(user.role, user.onboarding_completed));
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, user, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-indigo-600" />
    </main>
  );
}
