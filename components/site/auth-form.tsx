"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isSignup = mode === "signup";

  return (
    <Card className="border-border/70 bg-card/90 shadow-soft">
      <CardHeader>
        <CardTitle className="font-heading text-2xl text-foreground">
          {isSignup ? "Create your account" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {isSignup
            ? "Start your application and unlock member onboarding."
            : "Log in to access your cohort, events, and drop requests."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);

            const formData = new FormData(event.currentTarget);
            const email = String(formData.get("email") ?? "").trim().toLowerCase();
            const password = String(formData.get("password") ?? "");

            startTransition(async () => {
              if (isSignup) {
                const payload = {
                  firstName: String(formData.get("firstName") ?? ""),
                  lastName: String(formData.get("lastName") ?? ""),
                  email,
                  password,
                  confirmPassword: String(formData.get("confirmPassword") ?? ""),
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

              router.push("/dashboard");
              router.refresh();
            });
          }}
        >
          {isSignup ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          {isSignup ? (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Please wait..." : isSignup ? "Create account" : "Log in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
