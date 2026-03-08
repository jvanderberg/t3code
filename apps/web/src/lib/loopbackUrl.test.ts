import { describe, expect, it } from "vitest";

import {
  isLikelyYoloboxCheckoutPath,
  rewriteLoopbackUrlForHostLocalName,
} from "./loopbackUrl";

describe("isLikelyYoloboxCheckoutPath", () => {
  it("detects yolobox checkout paths", () => {
    expect(
      isLikelyYoloboxCheckoutPath("/Users/joshv/.local/state/yolobox/instances/repo-main/checkout"),
    ).toBe(true);
  });

  it("ignores non-yolobox paths", () => {
    expect(isLikelyYoloboxCheckoutPath("/Users/joshv/src/t3code")).toBe(false);
  });
});

describe("rewriteLoopbackUrlForHostLocalName", () => {
  it("rewrites localhost links to the provided .local host", () => {
    expect(
      rewriteLoopbackUrlForHostLocalName("http://localhost:3000/path?q=1#hash", "josh-2.local"),
    ).toBe("http://josh-2.local:3000/path?q=1#hash");
  });

  it("rewrites loopback IP links to the provided .local host", () => {
    expect(
      rewriteLoopbackUrlForHostLocalName("https://127.0.0.1:8080/", "josh-2.local"),
    ).toBe("https://josh-2.local:8080/");
  });

  it("leaves non-loopback links unchanged", () => {
    expect(
      rewriteLoopbackUrlForHostLocalName("https://example.com:8080/", "josh-2.local"),
    ).toBe("https://example.com:8080/");
  });

  it("leaves invalid URLs unchanged", () => {
    expect(rewriteLoopbackUrlForHostLocalName("not-a-url", "josh-2.local")).toBe("not-a-url");
  });
});
