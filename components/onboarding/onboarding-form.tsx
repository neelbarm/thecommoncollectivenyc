"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AGE_RANGE_OPTIONS,
  BUDGET_COMFORT_OPTIONS,
  DRINKING_PREFERENCE_OPTIONS,
  GROUP_ENERGY_OPTIONS,
  INTEREST_OPTIONS,
  PHYSICAL_ACTIVITY_OPTIONS,
  PLAN_FREQUENCY_OPTIONS,
  PREFERRED_NIGHTS_OPTIONS,
  SMOKING_PREFERENCE_OPTIONS,
  SOCIAL_GOAL_OPTIONS,
  TIME_PREFERENCE_OPTIONS,
  VIBE_OPTIONS,
} from "@/lib/onboarding/constants";
import {
  onboardingSchema,
  onboardingStepSchemas,
  type OnboardingDraftInput,
  type OnboardingInput,
} from "@/lib/validations/onboarding";
import { cn } from "@/lib/utils";

type OnboardingApiResponse = {
  completed: boolean;
  payload: Partial<OnboardingInput>;
};

const TOTAL_STEPS = onboardingStepSchemas.length;

const defaultFormValues: OnboardingDraftInput = {
  firstName: "",
  lastName: "",
  email: "",
  neighborhood: "",
  ageRange: undefined,
  occupation: "",
  socialGoal: undefined,
  interests: [],
  preferredNights: undefined,
  preferredVibe: [],
  budgetComfort: undefined,
  drinkingPreference: undefined,
  smokingPreference: undefined,
  physicalActivityComfort: undefined,
  timePreference: undefined,
  plansFrequency: undefined,
  idealGroupEnergy: undefined,
  peopleToMeet: "",
  idealWeek: "",
};

const stepTitles = [
  "Basics and profile context",
  "Interests and social vibe",
  "Preferences and planning cadence",
  "People and ideal weekly rhythm",
] as const;

export function OnboardingForm() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<OnboardingDraftInput>(defaultFormValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isEditingCompleted, setIsEditingCompleted] = useState(false);
  const [isSubmitting, startSubmitting] = useTransition();
  const [isSavingDraft, startSavingDraft] = useTransition();
  const [isContinuing, setIsContinuing] = useState(false);
  const [isGoingBack, setIsGoingBack] = useState(false);

  const progress = useMemo(() => ((stepIndex + 1) / TOTAL_STEPS) * 100, [stepIndex]);

  useEffect(() => {
    let cancelled = false;

    async function loadOnboarding() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/onboarding");

        if (!response.ok) {
          throw new Error("Unable to load onboarding state.");
        }

        const data = (await response.json()) as OnboardingApiResponse;

        if (cancelled) {
          return;
        }

        setValues((previous) => ({
          ...previous,
          ...data.payload,
          interests: data.payload.interests ?? [],
          preferredVibe: data.payload.preferredVibe ?? [],
        }));
        setIsCompleted(data.completed);
      } catch (error) {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : "Unable to load onboarding.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOnboarding();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading || (isCompleted && !isEditingCompleted)) {
      return;
    }

    const timeout = setTimeout(() => {
      startSavingDraft(async () => {
        try {
          await fetch("/api/onboarding", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          });
          setStatusMessage("Draft saved");
        } catch {
          setStatusMessage("Draft save failed");
        }
      });
    }, 800);

    return () => clearTimeout(timeout);
  }, [isCompleted, isEditingCompleted, isLoading, values]);

  function setField<K extends keyof OnboardingDraftInput>(key: K, value: OnboardingDraftInput[K]) {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));

    setErrors((previous) => {
      if (!previous[key as string]) {
        return previous;
      }

      const next = { ...previous };
      delete next[key as string];
      return next;
    });

    setPageError(null);
  }

  function toggleInterest(option: (typeof INTEREST_OPTIONS)[number]) {
    const current = values.interests ?? [];
    const exists = current.includes(option);
    const next = exists
      ? current.filter((entry) => entry !== option)
      : current.length < 10
        ? [...current, option]
        : current;

    setField("interests", next);
  }

  function togglePreferredVibe(option: (typeof VIBE_OPTIONS)[number]) {
    const current = values.preferredVibe ?? [];
    const exists = current.includes(option);
    const next = exists
      ? current.filter((entry) => entry !== option)
      : current.length < 3
        ? [...current, option]
        : current;

    setField("preferredVibe", next);
  }

  function validateCurrentStep() {
    const parser = onboardingStepSchemas[stepIndex];
    const parsed = parser.safeParse(values);

    if (parsed.success) {
      return true;
    }

    const nextErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!nextErrors[key]) {
        nextErrors[key] = issue.message;
      }
    }

    setErrors((previous) => ({ ...previous, ...nextErrors }));
    return false;
  }

  function nextStep() {
    setPageError(null);
    if (!validateCurrentStep()) {
      return;
    }
    setIsContinuing(true);
    setStepIndex((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  }

  function previousStep() {
    setPageError(null);
    setIsGoingBack(true);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  useEffect(() => {
    if (isContinuing) {
      setIsContinuing(false);
    }
    if (isGoingBack) {
      setIsGoingBack(false);
    }
  }, [isContinuing, isGoingBack, stepIndex]);

  function submitOnboarding() {
    const parsed = onboardingSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }

      setErrors(nextErrors);
      setPageError("Please review the highlighted fields.");
      return;
    }

    startSubmitting(async () => {
      try {
        const response = await fetch("/api/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsed.data),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to submit onboarding.");
        }

        setStatusMessage("Onboarding complete. Redirecting...");
        setIsCompleted(true);
        setIsEditingCompleted(false);

        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 900);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to submit onboarding.");
      }
    });
  }

  if (isLoading) {
    return (
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardContent className="flex items-center gap-3 py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-gold" />
          <p className="text-sm text-muted-foreground">Loading your onboarding profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (pageError && !values.email) {
    return (
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardContent className="space-y-4 py-10">
          <p className="text-sm text-destructive">{pageError}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry loading onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted && !isEditingCompleted) {
    return (
      <Card className="border-border/70 bg-card/90 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Onboarding complete
          </CardTitle>
          <CardDescription>
            Your questionnaire is saved and being used for cohort matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            You can edit your onboarding preferences whenever your lifestyle changes.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
            <Button variant="outline" onClick={() => setIsEditingCompleted(true)}>
              Edit responses
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-soft">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="text-2xl">Onboarding questionnaire</CardTitle>
          <CardDescription>
            Step {stepIndex + 1} of {TOTAL_STEPS}. Slow and thoughtful is perfect.
          </CardDescription>
          <p className="text-sm text-muted-foreground">{stepTitles[stepIndex]}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-oat">
            <div
              aria-hidden="true"
              className="h-2 rounded-full bg-muted-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {stepIndex === 0 ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First name" error={errors.firstName} htmlFor="onboarding-first-name">
                <Input
                  id="onboarding-first-name"
                  aria-invalid={Boolean(errors.firstName)}
                  value={values.firstName ?? ""}
                  onChange={(event) => setField("firstName", event.target.value)}
                />
              </FormField>
              <FormField label="Last name" error={errors.lastName} htmlFor="onboarding-last-name">
                <Input
                  id="onboarding-last-name"
                  aria-invalid={Boolean(errors.lastName)}
                  value={values.lastName ?? ""}
                  onChange={(event) => setField("lastName", event.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Email" error={errors.email} htmlFor="onboarding-email">
              <Input
                id="onboarding-email"
                type="email"
                aria-invalid={Boolean(errors.email)}
                value={values.email ?? ""}
                onChange={(event) => setField("email", event.target.value)}
              />
            </FormField>

            <FormField label="Neighborhood" error={errors.neighborhood} htmlFor="onboarding-neighborhood">
              <Input
                id="onboarding-neighborhood"
                aria-invalid={Boolean(errors.neighborhood)}
                value={values.neighborhood ?? ""}
                onChange={(event) => setField("neighborhood", event.target.value)}
              />
            </FormField>

            <ChoiceGroup
              label="Age range"
              value={values.ageRange}
              options={AGE_RANGE_OPTIONS}
              onSelect={(option) => setField("ageRange", option)}
              error={errors.ageRange}
            />

            <FormField label="Occupation or role" error={errors.occupation} htmlFor="onboarding-occupation">
              <Input
                id="onboarding-occupation"
                aria-invalid={Boolean(errors.occupation)}
                value={values.occupation ?? ""}
                onChange={(event) => setField("occupation", event.target.value)}
              />
            </FormField>

            <ChoiceGroup
              label="Social goal"
              value={values.socialGoal}
              options={SOCIAL_GOAL_OPTIONS}
              onSelect={(option) => setField("socialGoal", option)}
              error={errors.socialGoal}
            />
          </section>
        ) : null}

        {stepIndex === 1 ? (
          <section className="space-y-5">
            <MultiChoiceGroup
              label="Interests"
              helper="Choose up to 10"
              values={values.interests ?? []}
              options={INTEREST_OPTIONS}
              onToggle={toggleInterest}
              error={errors.interests}
            />

            <ChoiceGroup
              label="Preferred nights"
              value={values.preferredNights}
              options={PREFERRED_NIGHTS_OPTIONS}
              onSelect={(option) => setField("preferredNights", option)}
              error={errors.preferredNights}
              capitalize
            />

            <MultiChoiceGroup
              label="Preferred vibe"
              helper="Choose up to 3"
              values={values.preferredVibe ?? []}
              options={VIBE_OPTIONS}
              onToggle={togglePreferredVibe}
              error={errors.preferredVibe}
              capitalize
            />
          </section>
        ) : null}

        {stepIndex === 2 ? (
          <section className="space-y-4">
            <ChoiceGroup
              label="Budget comfort"
              value={values.budgetComfort}
              options={BUDGET_COMFORT_OPTIONS}
              onSelect={(option) => setField("budgetComfort", option)}
              error={errors.budgetComfort}
            />
            <ChoiceGroup
              label="Drinking preference"
              value={values.drinkingPreference}
              options={DRINKING_PREFERENCE_OPTIONS}
              onSelect={(option) => setField("drinkingPreference", option)}
              error={errors.drinkingPreference}
            />
            <ChoiceGroup
              label="Smoking preference"
              value={values.smokingPreference}
              options={SMOKING_PREFERENCE_OPTIONS}
              onSelect={(option) => setField("smokingPreference", option)}
              error={errors.smokingPreference}
            />
            <ChoiceGroup
              label="Physical activity comfort"
              value={values.physicalActivityComfort}
              options={PHYSICAL_ACTIVITY_OPTIONS}
              onSelect={(option) => setField("physicalActivityComfort", option)}
              error={errors.physicalActivityComfort}
            />
            <ChoiceGroup
              label="Time preference"
              value={values.timePreference}
              options={TIME_PREFERENCE_OPTIONS}
              onSelect={(option) => setField("timePreference", option)}
              error={errors.timePreference}
            />
            <ChoiceGroup
              label="How often do you want plans?"
              value={values.plansFrequency}
              options={PLAN_FREQUENCY_OPTIONS}
              onSelect={(option) => setField("plansFrequency", option)}
              error={errors.plansFrequency}
            />
            <ChoiceGroup
              label="Ideal group energy"
              value={values.idealGroupEnergy}
              options={GROUP_ENERGY_OPTIONS}
              onSelect={(option) => setField("idealGroupEnergy", option)}
              error={errors.idealGroupEnergy}
            />
          </section>
        ) : null}

        {stepIndex === 3 ? (
          <section className="space-y-4">
            <FormField
              label="What kind of people are you hoping to meet?"
              error={errors.peopleToMeet}
              htmlFor="onboarding-people-to-meet"
            >
              <Textarea
                id="onboarding-people-to-meet"
                rows={6}
                aria-invalid={Boolean(errors.peopleToMeet)}
                value={values.peopleToMeet ?? ""}
                onChange={(event) => setField("peopleToMeet", event.target.value)}
                placeholder="Tell us about values, energy, and personalities that feel aligned."
              />
            </FormField>

            <FormField
              label="What would your ideal NYC week look like?"
              error={errors.idealWeek}
              htmlFor="onboarding-ideal-week"
            >
              <Textarea
                id="onboarding-ideal-week"
                rows={6}
                aria-invalid={Boolean(errors.idealWeek)}
                value={values.idealWeek ?? ""}
                onChange={(event) => setField("idealWeek", event.target.value)}
                placeholder="Paint a realistic rhythm: movement, social plans, culture, and rest."
              />
            </FormField>
          </section>
        ) : null}

        {pageError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {pageError}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
        {isSavingDraft ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Saving draft...
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={stepIndex === 0 || isSubmitting || isContinuing}
          >
            Back
          </Button>

          {stepIndex < TOTAL_STEPS - 1 ? (
            <Button onClick={nextStep} disabled={isSubmitting || isGoingBack}>
              {isContinuing ? "Continuing..." : "Continue"}
            </Button>
          ) : (
            <Button onClick={submitOnboarding} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting
                </span>
              ) : (
                "Complete onboarding"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FormField({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
  error,
  capitalize,
}: {
  label: string;
  value: T | undefined;
  options: readonly T[];
  onSelect: (option: T) => void;
  error?: string;
  capitalize?: boolean;
}) {
  const groupLabelId = `choice-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label id={groupLabelId}>{label}</Label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={groupLabelId}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            tabIndex={value === option ? 0 : -1}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              capitalize ? "capitalize" : "",
              value === option
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function MultiChoiceGroup<T extends string>({
  label,
  helper,
  values,
  options,
  onToggle,
  error,
  capitalize,
}: {
  label: string;
  helper?: string;
  values: T[];
  options: readonly T[];
  onToggle: (option: T) => void;
  error?: string;
  capitalize?: boolean;
}) {
  const groupLabelId = `multi-choice-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label id={groupLabelId}>{label}</Label>
        {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={groupLabelId}>
        {options.map((option) => {
          const selected = values.includes(option);

          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={selected}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition",
                capitalize ? "capitalize" : "",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onToggle(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
