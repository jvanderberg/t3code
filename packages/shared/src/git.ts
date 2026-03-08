/**
 * Sanitize an arbitrary string into a valid, lowercase git branch fragment.
 * Strips quotes, collapses separators, limits to 64 chars.
 */
export function sanitizeBranchFragment(raw: string): string {
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/^[./\s_-]+|[./\s_-]+$/g, "");

  const branchFragment = normalized
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/-+/g, "-")
    .replace(/^[./_-]+|[./_-]+$/g, "")
    .slice(0, 64)
    .replace(/[./_-]+$/g, "");

  return branchFragment.length > 0 ? branchFragment : "update";
}

/**
 * Sanitize a string into a `feature/…` branch name.
 * Preserves an existing `feature/` prefix or slash-separated namespace.
 */
export function sanitizeFeatureBranchName(raw: string): string {
  const sanitized = sanitizeBranchFragment(raw);
  if (sanitized.includes("/")) {
    return sanitized.startsWith("feature/") ? sanitized : `feature/${sanitized}`;
  }
  return `feature/${sanitized}`;
}

const AUTO_FEATURE_BRANCH_FALLBACK = "feature/update";

/**
 * Resolve a unique `feature/…` branch name that doesn't collide with
 * any existing branch. Appends a numeric suffix when needed.
 */
export function resolveAutoFeatureBranchName(
  existingBranchNames: readonly string[],
  preferredBranch?: string,
): string {
  const preferred = preferredBranch?.trim();
  const resolvedBase = sanitizeFeatureBranchName(
    preferred && preferred.length > 0 ? preferred : AUTO_FEATURE_BRANCH_FALLBACK,
  );
  const existingNames = new Set(existingBranchNames.map((branch) => branch.toLowerCase()));

  if (!existingNames.has(resolvedBase)) {
    return resolvedBase;
  }

  let suffix = 2;
  while (existingNames.has(`${resolvedBase}-${suffix}`)) {
    suffix += 1;
  }

  return `${resolvedBase}-${suffix}`;
}

const TEMP_WORKTREE_BRANCH_TOKEN_REGEX = /^[0-9a-f]{8}$/;
const TEMP_WORKTREE_BRANCH_FALLBACK_PREFIX = "sandbox";

export function sanitizeTemporaryWorktreeBranchPrefix(raw: string): string {
  const sanitized = sanitizeBranchFragment(raw);
  const firstSegment = sanitized.split("/")[0]?.trim();
  return firstSegment && firstSegment.length > 0
    ? firstSegment
    : TEMP_WORKTREE_BRANCH_FALLBACK_PREFIX;
}

export function buildTemporaryWorktreeBranchName(input: {
  readonly prefix: string;
  readonly token: string;
}): string {
  const normalizedToken = input.token.trim().toLowerCase();
  if (!TEMP_WORKTREE_BRANCH_TOKEN_REGEX.test(normalizedToken)) {
    throw new Error("Temporary worktree branch tokens must be 8 lowercase hex characters.");
  }
  return `${sanitizeTemporaryWorktreeBranchPrefix(input.prefix)}/${normalizedToken}`;
}

export function parseTemporaryWorktreeBranchName(
  branch: string,
): { readonly prefix: string; readonly token: string } | null {
  const normalized = branch.trim().toLowerCase().replace(/^refs\/heads\//, "");
  const [prefix = "", token = "", ...rest] = normalized.split("/");
  if (rest.length > 0 || prefix.length === 0 || !TEMP_WORKTREE_BRANCH_TOKEN_REGEX.test(token)) {
    return null;
  }
  return { prefix, token };
}

export function buildGeneratedWorktreeBranchName(input: {
  readonly prefix: string;
  readonly rawBranchName: string;
}): string {
  const normalized = input.rawBranchName.trim().toLowerCase().replace(/^refs\/heads\//, "");
  const prefix = sanitizeTemporaryWorktreeBranchPrefix(input.prefix);
  const withoutPrefix = normalized.startsWith(`${prefix}/`)
    ? normalized.slice(`${prefix}/`.length)
    : normalized;
  return `${prefix}/${sanitizeBranchFragment(withoutPrefix)}`;
}
