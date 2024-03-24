export const ACTOR_ID = {
  LEFT_SIDEBAR: "LEFT_SIDEBAR",
  MAIN_CONTENT_MACHINE: "MAIN_CONTENT_MACHINE",
};

export const NOTE_STATUS = {
  TO_DO: { key: "TO_DO", label: "To Do" },
  IN_PROGRESS: { key: "IN_PROGRESS", label: "Doing" },
  ON_HOLD: { key: "ON_HOLD", label: "On Hold" },
  DONE: { key: "DONE", label: "Done" },
} as const;

/**
 * it is time in miliseconds
 */
export const transitionDuration = 500;

export const defaultDebounceDuration = 300;
