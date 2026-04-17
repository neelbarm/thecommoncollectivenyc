import { Suspense } from "react";
import Link from "next/link";

import { AuthForm } from "@/components/site/auth-form";

export default function SignupPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
      <section className="space-y-5">
        <p className="eyebrow">Create Account</p>
        <h1 className="font-heading text-4xl leading-[1.08] text-foreground sm:text-5xl">
          Begin your Common Collective journey.
        </h1>
        <p className="prose-calm max-w-xl">
          Set up your account to submit an application, complete onboarding, and access future member experiences.
        </p>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            href="/login?callbackUrl=%2Fapply"
          >
            Log in
          </Link>
        </p>
      </section>

      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
