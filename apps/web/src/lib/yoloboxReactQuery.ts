import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { ensureNativeApi } from "../nativeApi";
import { invalidateGitQueries } from "./gitReactQuery";

export function yoloboxCreateThreadSandboxMutationOptions(input: { queryClient: QueryClient }) {
  return mutationOptions({
    mutationFn: async ({
      cwd,
      branch,
      newBranch,
    }: {
      cwd: string;
      branch: string;
      newBranch: string;
    }) => {
      const api = ensureNativeApi();
      return api.yolobox.createThreadSandbox({ cwd, branch, newBranch });
    },
    mutationKey: ["yolobox", "mutation", "create-thread-sandbox"] as const,
    onSettled: async () => {
      await invalidateGitQueries(input.queryClient);
    },
  });
}

export function yoloboxDestroySandboxMutationOptions(input: { queryClient: QueryClient }) {
  return mutationOptions({
    mutationFn: async ({ path }: { path: string }) => {
      const api = ensureNativeApi();
      return api.yolobox.destroySandbox({ path });
    },
    mutationKey: ["yolobox", "mutation", "destroy-sandbox"] as const,
    onSettled: async () => {
      await invalidateGitQueries(input.queryClient);
    },
  });
}
