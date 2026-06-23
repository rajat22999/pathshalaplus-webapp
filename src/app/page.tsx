"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.onboarding_completed ? "/dashboard" : "/onboarding");
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
