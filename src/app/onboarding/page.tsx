"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import { ROLE_ADMIN } from "@/lib/roles";
import { OnboardingWizard } from "@/app/onboarding/wizard";
import { ProfileCompletion } from "@/app/onboarding/profile-completion";

export default function OnboardingPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user?.onboarding_completed) {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (status !== "authenticated" || !user || user.onboarding_completed) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </main>
    );
  }

  // An org admin who hasn't set up their organization yet gets the full wizard;
  // everyone else (invited staff/teacher/student/parent) completes their profile.
  const needsOrgSetup = user.role === ROLE_ADMIN && !user.organization_id;

  return needsOrgSetup ? <OnboardingWizard /> : <ProfileCompletion />;
}
