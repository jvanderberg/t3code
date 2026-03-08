const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"]);

export function isLikelyYoloboxCheckoutPath(cwd: string | undefined): boolean {
  if (!cwd) {
    return false;
  }
  const normalized = cwd.replace(/\\/g, "/").toLowerCase();
  return normalized.includes("/yolobox/instances/") && normalized.includes("/checkout");
}

export function rewriteLoopbackUrlForHostLocalName(
  href: string | undefined,
  hostLocalName: string | null,
): string | undefined {
  if (!href || !hostLocalName) {
    return href;
  }

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }

  if ((url.protocol !== "http:" && url.protocol !== "https:") || !LOOPBACK_HOSTS.has(url.hostname)) {
    return href;
  }

  url.hostname = hostLocalName;
  return url.toString();
}
