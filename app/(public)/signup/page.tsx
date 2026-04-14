import { Suspense } from "react";
import Link from "next/link";

import { AuthForm } from "@/components/site/auth-form";

export default function SignupPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Create Account</p>
        <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
          Begin your Common Collective journey.
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">
          Set up your account to submit an application, complete onboarding, and access future member experiences.
        </p>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
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
