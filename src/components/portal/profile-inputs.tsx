"use client";

import * as React from "react";
import { Code2, Palette, PenLine } from "lucide-react";

import { ChipGroup } from "@/components/apply/chip-group";
import { IconTiles, interestIcons, roleIcons } from "@/components/apply/icon-tiles";
import { EnvironmentPicker } from "@/components/portal/environment-picker";
import {
  builderTypeHints,
  builderTypeOptions,
  companySizeOptions,
  fascinationOptions,
  locationOptions,
  profileInterestOptions,
  profileLimits,
  profileRoleOptions,
  profileSkillOptions,
  workAuthOptions,
} from "@/content/profile";
import type { ProfileField, StudentProfile } from "@/lib/profile";

const INPUT_ID = "answer";
const builderIcons = { Technical: Code2, Creative: PenLine, Artist: Palette };

/** Caps a multi-select at `max`, with a message when someone tries to go over. */
function capped(max: number, onOver: (msg: string) => void, set: (v: string[]) => void) {
  return (next: string[]) => {
    if (next.length > max) return onOver(`Up to ${max === 3 ? "three" : max}. Unpick one first.`);
    set(next);
  };
}

/** One option that stands alone: picking it clears the rest, picking another clears it. */
function standalone(only: string, set: (v: string[]) => void) {
  return (v: string[]) => set(v.at(-1) === only ? [only] : v.filter((x) => x !== only));
}

/** Wider card for the questions shown as tiles. */
export function profileFieldIsWide(field: ProfileField) {
  return field === "roles" || field === "interests" || field === "builderTypes";
}

/** True when the question can be left empty, so its button says "Skip". */
export function profileFieldSkippable(field: ProfileField, p: StudentProfile) {
  return (field === "builderTypes" || field === "skills" || field === "fascinations") && !p[field].length;
}

/**
 * The control for one profile question. Used by the application
 * (where the profile is asked inline) and by the portal's editor.
 */
export function ProfileInput({
  field,
  data,
  set,
  onError,
  describedBy,
  invalid,
}: {
  field: ProfileField;
  data: StudentProfile;
  set: <K extends ProfileField>(key: K, value: StudentProfile[K]) => void;
  onError: (msg: string) => void;
  describedBy?: string;
  invalid?: boolean;
}) {
  const chips = { id: INPUT_ID, labelledBy: "question", describedBy, invalid };
  switch (field) {
    case "location":
      return <ChipGroup {...chips} options={locationOptions} value={data.location} onChange={(v) => set("location", v)} />;
    case "workAuth":
      return <ChipGroup {...chips} single options={workAuthOptions} value={data.workAuth} onChange={(v) => set("workAuth", v)} />;
    case "companySize":
      return (
        <ChipGroup
          {...chips}
          options={companySizeOptions}
          value={data.companySize}
          onChange={standalone("No preference", (v) => set("companySize", v))}
        />
      );
    case "roles":
      return (
        <IconTiles
          options={profileRoleOptions}
          icons={roleIcons}
          value={data.roles}
          describedBy={describedBy}
          onChange={capped(profileLimits.roles, onError, (v) => set("roles", v))}
        />
      );
    case "interests":
      return (
        <IconTiles
          options={profileInterestOptions}
          icons={interestIcons}
          value={data.interests}
          describedBy={describedBy}
          onChange={capped(profileLimits.interests, onError, standalone("Open to anything", (v) => set("interests", v)))}
        />
      );
    case "builderTypes":
      return (
        <>
          <IconTiles
            options={builderTypeOptions}
            icons={builderIcons}
            value={data.builderTypes}
            describedBy={describedBy}
            onChange={(v) => set("builderTypes", v)}
          />
          <dl className="mt-3 grid gap-1 px-1 text-[13px] text-muted-foreground sm:grid-cols-3 sm:gap-2">
            {builderTypeOptions.map((b) => (
              <div key={b}>
                <dt className="sr-only">{b}</dt>
                <dd>
                  <span className="font-medium text-foreground sm:hidden">{b}: </span>
                  {builderTypeHints[b]}
                </dd>
              </div>
            ))}
          </dl>
        </>
      );
    case "skills":
      return (
        <ChipGroup
          {...chips}
          options={profileSkillOptions}
          value={data.skills}
          onChange={capped(profileLimits.skills, onError, (v) => set("skills", v))}
          allowCustom
          customPlaceholder="Add one"
        />
      );
    case "fascinations":
      return (
        <ChipGroup
          {...chips}
          options={fascinationOptions}
          value={data.fascinations}
          onChange={capped(profileLimits.fascinations, onError, (v) => set("fascinations", v))}
          allowCustom
          customPlaceholder="Something else"
        />
      );
    case "environment":
      return <EnvironmentPicker value={data.environment} onChange={(v) => set("environment", v)} describedBy={describedBy} />;
  }
}
