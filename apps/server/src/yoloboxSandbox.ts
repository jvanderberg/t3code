import { spawnSync } from "node:child_process";

import type {
  YoloboxCreateThreadSandboxResult,
  YoloboxDestroySandboxResult,
} from "@t3tools/contracts";

import {
  buildYoloboxRepoBranchInstanceName,
  readYoloboxInstanceMetadata,
  readYoloboxInstanceMetadataForHostPath,
} from "./codexAppServerManager.ts";

function runYoloboxCli(
  args: string[],
  options?: {
    readonly cwd?: string;
    readonly env?: NodeJS.ProcessEnv;
  },
): void {
  const result = spawnSync("yolobox", args, {
    cwd: options?.cwd ?? process.cwd(),
    env: options?.env ?? process.env,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    const lower = result.error.message.toLowerCase();
    if (
      lower.includes("enoent") ||
      lower.includes("command not found") ||
      lower.includes("not found")
    ) {
      throw new Error("yolobox is not installed or not executable.");
    }
    throw new Error(`Failed to execute yolobox: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const detail =
      result.stderr.trim() || result.stdout.trim() || `yolobox exited with code ${result.status}.`;
    throw new Error(detail);
  }
}

function readDefaultYoloboxBase(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.YOLOBOX_DEFAULT_BASE?.trim();
  if (!value) {
    throw new Error("Set YOLOBOX_DEFAULT_BASE before creating yolobox-backed worktrees.");
  }
  return value;
}

export function createYoloboxThreadSandbox(input: {
  readonly repoUrl: string;
  readonly baseBranch: string;
  readonly newBranch: string;
  readonly env?: NodeJS.ProcessEnv;
}): YoloboxCreateThreadSandboxResult {
  const base = readDefaultYoloboxBase(input.env);
  const launchArgs = [
    "launch",
    "--repo",
    input.repoUrl,
    "--branch",
    input.newBranch,
    "--new-branch",
    "--from",
    input.baseBranch,
    "--base",
    base,
    "--no-enter",
  ];
  if (input.env) {
    runYoloboxCli(launchArgs, { env: input.env });
  } else {
    runYoloboxCli(launchArgs);
  }

  const instanceName = buildYoloboxRepoBranchInstanceName(input.repoUrl, input.newBranch);
  const metadata = input.env
    ? readYoloboxInstanceMetadata({ instanceName, env: input.env })
    : readYoloboxInstanceMetadata({ instanceName });
  return {
    instanceName: metadata.instanceId,
    worktree: {
      branch: input.newBranch,
      path: metadata.checkoutDir,
    },
  };
}

export function destroyYoloboxSandboxForPath(
  sandboxPath: string,
  env: NodeJS.ProcessEnv = process.env,
): YoloboxDestroySandboxResult {
  const metadata = readYoloboxInstanceMetadataForHostPath(sandboxPath, env);
  if (!metadata) {
    return { removed: false };
  }

  runYoloboxCli(["destroy", "--name", metadata.instanceId, "--yes"], { env });
  return {
    removed: true,
    instanceName: metadata.instanceId,
  };
}
