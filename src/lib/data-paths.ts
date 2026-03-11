import path from "path";

const root = process.cwd();

/** Next.js best practice: all content data lives under src/data */
export const DATA_DIRS = {
  mainChannel: path.join(root, "src/data/main-channel"),
  podcasts: path.join(root, "src/data/podcasts"),
} as const;
