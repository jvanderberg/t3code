import { Schema } from "effect";

import { TrimmedNonEmptyString } from "./baseSchemas";

export const YoloboxWorktree = Schema.Struct({
  path: TrimmedNonEmptyString,
  branch: TrimmedNonEmptyString,
});
export type YoloboxWorktree = typeof YoloboxWorktree.Type;

export const YoloboxCreateThreadSandboxInput = Schema.Struct({
  cwd: TrimmedNonEmptyString,
  branch: TrimmedNonEmptyString,
  newBranch: TrimmedNonEmptyString,
});
export type YoloboxCreateThreadSandboxInput = typeof YoloboxCreateThreadSandboxInput.Type;

export const YoloboxCreateThreadSandboxResult = Schema.Struct({
  instanceName: TrimmedNonEmptyString,
  worktree: YoloboxWorktree,
});
export type YoloboxCreateThreadSandboxResult = typeof YoloboxCreateThreadSandboxResult.Type;

export const YoloboxDestroySandboxInput = Schema.Struct({
  path: TrimmedNonEmptyString,
});
export type YoloboxDestroySandboxInput = typeof YoloboxDestroySandboxInput.Type;

export const YoloboxDestroySandboxResult = Schema.Struct({
  removed: Schema.Boolean,
  instanceName: Schema.optional(TrimmedNonEmptyString),
});
export type YoloboxDestroySandboxResult = typeof YoloboxDestroySandboxResult.Type;
