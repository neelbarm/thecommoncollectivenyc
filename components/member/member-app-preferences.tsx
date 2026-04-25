"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PreferenceSection = {
  id: string;
  title: string;
  options: {
    id: string;
    label: string;
    description: string;
    defaultChecked?: boolean;
  }[];
};

type StoredPreferences = Record<string, boolean>;

function buildDefaults(sections: PreferenceSection[]): StoredPreferences {
  return sections.reduce<StoredPreferences>((acc, section) => {
    for (const option of section.options) {
      acc[option.id] = option.defaultChecked ?? false;
    }
    return acc;
  }, {});
}

function readStoredPreferences(storageKey: string, defaults: StoredPreferences): StoredPreferences {
  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) {
      return defaults;
    }

    const parsed = JSON.parse(value) as Partial<StoredPreferences>;
    return Object.keys(defaults).reduce<StoredPreferences>((acc, key) => {
      acc[key] = parsed[key] ?? defaults[key];
      return acc;
    }, {});
  } catch {
    return defaults;
  }
}

export function MemberAppPreferences({
  storageKey = "common-collective.member-preferences",
  title = "Member preferences",
  description = "Control the app behaviors that should feel immediate on this device.",
  sections = [
    {
      id: "app-controls",
      title: "App controls",
      options: [
        {
          id: "pushAnnouncements",
          label: "Announcement alerts",
          description: "Get notified when new member or cohort announcements land.",
          defaultChecked: true,
        },
        {
          id: "pushChat",
          label: "Chat alerts",
          description: "Get notified when your cohort room becomes active.",
          defaultChecked: true,
        },
        {
          id: "digestMode",
          label: "Quiet luxury mode",
          description: "Reduce notification cadence to important summaries only.",
          defaultChecked: false,
        },
      ],
    },
  ],
}: {
  storageKey?: string;
  title?: string;
  description?: string;
  sections?: PreferenceSection[];
}) {
  const defaults = useMemo(() => buildDefaults(sections), [sections]);
  const [preferences, setPreferences] = useState<StoredPreferences>(defaults);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setPreferences(readStoredPreferences(storageKey, defaults));
    setHasLoaded(true);
  }, [defaults, storageKey]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [hasLoaded, preferences, storageKey]);

  const enabledCount = useMemo(
    () => Object.values(preferences).filter(Boolean).length,
    [preferences],
  );

  function updatePreference(key: string, checked: boolean) {
    setPreferences((current) => ({
      ...current,
      [key]: checked,
    }));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open app controls"
        className="app-icon-button mt-0.5 cursor-pointer"
      >
        <ShieldCheck className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-80 rounded-[1.1rem] border-border/60 bg-card/98 p-2"
      >
        <DropdownMenuLabel className="px-2 py-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
          App controls
        </DropdownMenuLabel>
        <div className="px-2 pb-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-[0.68rem] uppercase tracking-[0.22em] text-primary">
            <Check className="h-3.5 w-3.5" />
            {enabledCount} enabled
          </p>
        </div>
        {sections.map((section, sectionIndex) => (
          <div key={section.id}>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-2 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
              {section.title}
            </DropdownMenuLabel>
            {section.options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={preferences[option.id]}
                onCheckedChange={(checked) => updatePreference(option.id, checked === true)}
                className="items-start gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/55 text-primary">
                  <Check className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  <span className="text-xs leading-5 text-muted-foreground">{option.description}</span>
                </span>
              </DropdownMenuCheckboxItem>
            ))}
            {sectionIndex === sections.length - 1 ? null : <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
