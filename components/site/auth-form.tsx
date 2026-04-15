"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const isSignup = mode === "signup";

  return (
    <Card className="surface-panel motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]">
      <CardHeader className="space-y-3">
        <p className="eyebrow">{isSignup ? "Member account" : "Private member access"}</p>
        <CardTitle className="font-heading text-3xl text-foreground">
          {isSignup ? "Create your account" : "Welcome back"}
        </CardTitle>
        <CardDescription className="prose-calm">
          {isSignup
            ? "Start your application and unlock member onboarding."
            : "Log in to access your cohort, events, and drop requests."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setSuccess(null);
            setFieldErrors({});

            const formData = new FormData(event.currentTarget);
            const email = String(formData.get("email") ?? "").trim().toLowerCase();
            const password = String(formData.get("password") ?? "");
            const firstName = String(formData.get("firstName") ?? "").trim();
            const lastName = String(formData.get("lastName") ?? "").trim();
            const confirmPassword = String(formData.get("confirmPassword") ?? "");

            startTransition(async () => {
              if (!email || !password) {
                setError("Email and password are required.");
                return;
              }

              if (isSignup) {
                const nextFieldErrors: Record<string, string> = {};
                if (firstName.length < 2) {
                  nextFieldErrors.firstName = "First name must be at least 2 characters.";
                }
                if (lastName.length < 2) {
                  nextFieldErrors.lastName = "Last name must be at least 2 characters.";
                }
                if (password.length < 8) {
                  nextFieldErrors.password = "Password must be at least 8 characters.";
                }
                if (password !== confirmPassword) {
                  nextFieldErrors.confirmPassword = "Passwords do not match.";
                }

                if (Object.keys(nextFieldErrors).length > 0) {
                  setFieldErrors(nextFieldErrors);
                  setError("Please review the highlighted fields.");
                  return;
                }

                const payload = {
                  firstName,
                  lastName,
                  email,
                  password,
                  confirmPassword,
                };

                const response = await fetch("/api/auth/signup", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                });

                if (!response.ok) {
                  const body = (await response.json()) as { error?: string };
                  setError(body.error ?? "Unable to create account.");
                  return;
                }

                setSuccess("Account created. Signing you in...");
              }

              const signInResult = await signIn("credentials", {
                email,
                password,
                redirect: false,
              });

              if (signInResult?.error) {
                setError("Invalid email or password.");
                return;
              }

              router.push(callbackUrl);
              router.refresh();
            });
          }}
          noValidate
        >
          {isSignup ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  minLength={2}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
                />
                {fieldErrors.firstName ? (
                  <p id="firstName-error" className="text-xs text-destructive">
                    {fieldErrors.firstName}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  minLength={2}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined}
                />
                {fieldErrors.lastName ? (
                  <p id="lastName-error" className="text-xs text-destructive">
                    {fieldErrors.lastName}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="space-y-2.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
            {fieldErrors.password ? (
              <p id="password-error" className="text-xs text-destructive">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {isSignup ? (
            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {fieldErrors.confirmPassword ? (
                <p id="confirmPassword-error" className="text-xs text-destructive">
                  {fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="status-banner border-destructive/30 bg-destructive/6 text-destructive">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="status-banner border-emerald-700/20 bg-emerald-700/8 text-emerald-800 dark:text-emerald-300">
              {success}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending} className="h-11 w-full text-[0.8rem] tracking-[0.12em] uppercase">
            {isPending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
