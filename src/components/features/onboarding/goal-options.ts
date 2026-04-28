export const GOAL_OPTIONS = [
  { value: "learn", label: "Learn from mentors" },
  { value: "podcasts", label: "Get insights from podcasts" },
  { value: "growth", label: "Track my growth" },
  { value: "exploring", label: "Just exploring" },
  { value: "other", label: "Other" },
] as const;

export type GoalValue = (typeof GOAL_OPTIONS)[number]["value"];

export function resolveGoalLabel(value: string, otherText: string): string {
  if (value === "other") return otherText.trim();
  return GOAL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
