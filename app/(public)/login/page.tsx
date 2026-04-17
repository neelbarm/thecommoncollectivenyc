import { Suspense } from "react";
import Link from "next/link";

import { AuthForm } from "@/components/site/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
      <section className="space-y-5">
        <p className="eyebrow">Member Access</p>
        <h1 className="font-heading text-4xl leading-[1.08] text-foreground sm:text-5xl">
          Return to your cohort rhythm.
        </h1>
        <p className="prose-calm max-w-xl">
          Access your dashboard, upcoming experiences, and The Drop to continue participating in community life.
        </p>
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            href="/signup?callbackUrl=%2Fapply"
          >
            Create your account
          </Link>
        </p>
      </section>

      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
