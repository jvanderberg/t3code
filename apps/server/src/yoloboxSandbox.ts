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

function runYoloboxCliAndReadStdout(
  args: string[],
  options?: {
    readonly cwd?: string;
    readonly env?: NodeJS.ProcessEnv;
  },
): string {
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

  return result.stdout ?? "";
}

function runYoloboxCli(
  args: string[],
  options?: {
    readonly cwd?: string;
    readonly env?: NodeJS.ProcessEnv;
  },
): void {
  void runYoloboxCliAndReadStdout(args, options);
}

function listYoloboxBaseNames(env: NodeJS.ProcessEnv = process.env): string[] {
  const stdout = runYoloboxCliAndReadStdout(["base", "list"], { env });
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.toLowerCase() !== "no base images")
    .map((line) => line.split(/\s+/)[0] ?? "")
    .filter((name) => name.length > 0);
}

function readDefaultYoloboxBase(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.YOLOBOX_DEFAULT_BASE?.trim();
  const baseNames = listYoloboxBaseNames(env);
  if (value) {
    if (baseNames.length === 0 || baseNames.includes(value)) {
      return value;
    }
    throw new Error(
      `YOLOBOX_DEFAULT_BASE is set to '${value}', but that base image was not found. Available bases: ${baseNames.join(", ")}.`,
    );
  }

  const preferred =
    baseNames.find((name) => name === "ubuntu-dev") ??
    baseNames.find((name) => name === "ubuntu") ??
    baseNames[0];
  if (preferred) {
    return preferred;
  }

  throw new Error(
    "No yolobox base images are available. Import one with `yolobox base import` or set YOLOBOX_DEFAULT_BASE.",
  );
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
