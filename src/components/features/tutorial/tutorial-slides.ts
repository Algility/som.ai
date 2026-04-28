export type TutorialAction =
  | { kind: "try-prompt"; label: string; prompt: string }
  | { kind: "finish"; label: string };

export type TutorialHighlightTag = "members" | "available";

export interface TutorialHighlight {
  label: string;
  description: string;
  tag?: TutorialHighlightTag;
}

export interface TutorialSlide {
  eyebrow: string;
  title: string;
  body: string;
  highlights?: readonly TutorialHighlight[];
  actions?: readonly TutorialAction[];
}

/**
 * First-run walkthrough. Tight copy, five slides. Slide 4 introduces the
 * three SOM AI modes so users know which one to pick.
 */
export const TUTORIAL_SLIDES: readonly TutorialSlide[] = [
  {
    eyebrow: "Welcome",
    title: "SOM AI",
    body: "Your AI business advisor, grounded in real mentor content from the School of Mentors community.",
  },
  {
    eyebrow: "Your library",
    title: "What the AI knows",
    body: "Four content sources. Two live in your sidebar and need a membership. Two stay quiet in the background.",
    highlights: [
      {
        label: "Mentorship Calls",
        description: "Live sessions with millionaire and billionaire guests.",
        tag: "members",
      },
      {
        label: "Call Recordings",
        description: "Recorded coaching calls, personal and group format.",
        tag: "members",
      },
      {
        label: "Podcasts",
        description: "Full length episodes from operators and investors.",
        tag: "available",
      },
      {
        label: "Main channel videos",
        description: "School of Hard Knocks YouTube content.",
        tag: "available",
      },
    ],
    actions: [
      {
        kind: "try-prompt",
        label: "Try: What content do you have access to?",
        prompt: "What mentor content do you have access to?",
      },
    ],
  },
  {
    eyebrow: "Ask",
    title: "Be specific",
    body: "Ask for scripts, playbooks, numbers, or frameworks. Specific questions unlock specific answers.",
    actions: [
      {
        kind: "try-prompt",
        label: "Try: How do I land my first client?",
        prompt: "How do I land my first client?",
      },
    ],
  },
  {
    eyebrow: "Modes",
    title: "Three ways to chat",
    body: "Pick a mode from the SOM AI menu in the chat box based on what you need.",
    highlights: [
      {
        label: "SOM Advisor",
        description: "Strategy and hard decisions. Slower and deeper.",
      },
      {
        label: "SOM Standard",
        description: "Everyday mentor advice. The balanced default.",
      },
      {
        label: "SOM Quick",
        description: "Clear answers, fast. For quick hits.",
      },
    ],
  },
  {
    eyebrow: "Ready",
    title: "Let's go",
    body: "Chats save automatically. Reopen this from the sidebar or Cmd K anytime.",
    actions: [{ kind: "finish", label: "Start chatting" }],
  },
];
