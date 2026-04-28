import path from "path";

const root = process.cwd();

/** All content data lives under src/data. Directories may not exist yet — callers must handle that. */
export const DATA_DIRS = {
  mainChannel: path.join(root, "src/data/main-channel"),
  podcasts: path.join(root, "src/data/podcasts"),
  callRecordings: path.join(root, "src/data/call-recordings"),
  mentorSessions: path.join(root, "src/data/mentor-sessions"),
} as const;
