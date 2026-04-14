"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const defaultQuestions = [
  {
    questionKey: "values_connection",
    section: "VALUES",
    label: "What does meaningful community look like to you?",
  },
  {
    questionKey: "experience_hosting",
    section: "EXPERIENCE",
    label: "Share one moment where you helped shape a social experience.",
  },
  {
    questionKey: "community_contribution",
    section: "COMMUNITY",
    label: "How would you contribute to a recurring member culture?",
  },
] as const;

export function ApplyForm() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  return (
    <Card className="border-border/70 bg-card/90 shadow-soft">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Application form</CardTitle>
        <CardDescription>
          This initial form captures core context now. Full onboarding and matching workflows arrive in later phases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setStatus("idle");
            setMessage("");

            const formData = new FormData(event.currentTarget);
            const payload = {
              headline: String(formData.get("headline") ?? ""),
              aboutText: String(formData.get("aboutText") ?? ""),
              availability: String(formData.get("availability") ?? ""),
              responses: defaultQuestions.map((question) => ({
                questionKey: question.questionKey,
                section: question.section,
                response: String(formData.get(question.questionKey) ?? ""),
              })),
            };

            startTransition(async () => {
              const response = await fetch("/api/applications", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              });

              const body = (await response.json()) as { error?: string };

              if (!response.ok) {
                setStatus("error");
                setMessage(body.error ?? "We could not submit your application.");
                return;
              }

              setStatus("success");
              setMessage("Application submitted. We will follow up with your next onboarding step.");
              event.currentTarget.reset();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="headline">In one line, why The Common Collective?</Label>
            <Input id="headline" name="headline" placeholder="I want deeper social rhythm in NYC." required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutText">Tell us about yourself</Label>
            <Textarea
              id="aboutText"
              name="aboutText"
              placeholder="Share your lifestyle, values, and what kind of people you hope to meet."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Typical availability</Label>
            <Input
              id="availability"
              name="availability"
              placeholder="Weeknights after 6:30pm, occasional Sunday mornings"
              required
            />
          </div>

          {defaultQuestions.map((question) => (
            <div className="space-y-2" key={question.questionKey}>
              <Label htmlFor={question.questionKey}>{question.label}</Label>
              <Textarea id={question.questionKey} name={question.questionKey} rows={4} required />
            </div>
          ))}

          {message ? (
            <p
              role={status === "error" ? "alert" : "status"}
              aria-live="polite"
              className={status === "success" ? "text-sm text-emerald-700" : "text-sm text-destructive"}
            >
              {message}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Submitting..." : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
