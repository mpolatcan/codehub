// File-type monogram for the tree: a short label + an oklch color per extension,
// using the SAME language palette family as lib/highlight.ts so Files / Diff /
// Preview speak one color language. Pure — no React, no deps. Unknown extensions
// fall back to the first letter on a neutral color.

export interface FileMonogram {
  label: string;
  color: string;
}

// Palette (oklch), aligned with highlight.ts: blue=code, orange=rust, amber=data,
// green=style, lavender=docs, cyan=markup, dim=config/other.
const BLUE = "oklch(0.78 0.12 220)";
const ORANGE = "oklch(0.74 0.14 50)";
const AMBER = "oklch(0.78 0.12 70)";
const GREEN = "oklch(0.75 0.14 150)";
const LAV = "oklch(0.72 0.1 290)";
const CYAN = "oklch(0.78 0.12 200)";
const RED = "oklch(0.72 0.14 20)";
const DIM = "oklch(0.62 0.02 250)";

const BY_EXT: Record<string, FileMonogram> = {
  ts: { label: "TS", color: BLUE },
  tsx: { label: "TS", color: BLUE },
  mts: { label: "TS", color: BLUE },
  cts: { label: "TS", color: BLUE },
  js: { label: "JS", color: AMBER },
  jsx: { label: "JS", color: AMBER },
  mjs: { label: "JS", color: AMBER },
  cjs: { label: "JS", color: AMBER },
  rs: { label: "RS", color: ORANGE },
  json: { label: "{}", color: AMBER },
  jsonc: { label: "{}", color: AMBER },
  css: { label: "#", color: GREEN },
  scss: { label: "#", color: GREEN },
  less: { label: "#", color: GREEN },
  html: { label: "<>", color: RED },
  htm: { label: "<>", color: RED },
  svg: { label: "<>", color: CYAN },
  xml: { label: "<>", color: CYAN },
  md: { label: "MD", color: LAV },
  mdx: { label: "MD", color: LAV },
  txt: { label: "¶", color: DIM },
  toml: { label: "TO", color: DIM },
  yaml: { label: "YM", color: DIM },
  yml: { label: "YM", color: DIM },
  sh: { label: "$", color: GREEN },
  bash: { label: "$", color: GREEN },
  zsh: { label: "$", color: GREEN },
  fish: { label: "$", color: GREEN },
  rb: { label: "RB", color: RED },
  py: { label: "PY", color: BLUE },
  go: { label: "GO", color: CYAN },
  java: { label: "JV", color: ORANGE },
  c: { label: "C", color: BLUE },
  h: { label: "H", color: BLUE },
  cpp: { label: "C+", color: BLUE },
  lock: { label: "🔒", color: DIM },
  png: { label: "IMG", color: LAV },
  jpg: { label: "IMG", color: LAV },
  jpeg: { label: "IMG", color: LAV },
  gif: { label: "IMG", color: LAV },
  webp: { label: "IMG", color: LAV },
  ico: { label: "IMG", color: LAV },
};

// Special filenames (no/odd extension) recognized by exact name.
const BY_NAME: Record<string, FileMonogram> = {
  dockerfile: { label: "DK", color: CYAN },
  makefile: { label: "MK", color: DIM },
  ".gitignore": { label: "GIT", color: ORANGE },
  ".dockerignore": { label: "DK", color: CYAN },
  "cargo.toml": { label: "RS", color: ORANGE },
  "cargo.lock": { label: "RS", color: ORANGE },
  "package.json": { label: "NPM", color: RED },
  "package-lock.json": { label: "NPM", color: RED },
  "tsconfig.json": { label: "TS", color: BLUE },
};

export function fileIcon(name: string): FileMonogram {
  const lower = name.toLowerCase();
  if (BY_NAME[lower]) return BY_NAME[lower];
  const dot = lower.lastIndexOf(".");
  const ext = dot > 0 ? lower.slice(dot + 1) : "";
  if (ext && BY_EXT[ext]) return BY_EXT[ext];
  // Unknown: first alphanumeric char, neutral.
  const ch = (lower.match(/[a-z0-9]/)?.[0] ?? "•").toUpperCase();
  return { label: ch, color: DIM };
}
