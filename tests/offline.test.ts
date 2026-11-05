import { expect, it } from "vitest";
// @ts-expect-error Node build check intentionally stays a standalone .mjs script.
import { checkOffline } from "../scripts/check-offline.mjs";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
it("rejects script, stylesheet, image, font and audio external fixtures", () => {
  for (const tag of [
    '<script src="https://example.test/a.js"></script>',
    '<link href="/local.css" rel="stylesheet">',
    '<img src="https://example.test/a.png">',
    "<style>@font-face{src:url(https://example.test/font.woff2)}</style>",
    '<audio src="./sound.wav"></audio>',
  ])
    expect(checkOffline(tag, { assets: [] }, () => Buffer.alloc(0)).length).toBeGreaterThan(0);
  expect(
    checkOffline(
      '<style>body{color:red}</style><script>let x=1;</script><img src="data:image/png;base64,eA==">',
      { assets: [{ id: "x", path: "x" }] },
      () => Buffer.from("x"),
    ),
  ).toEqual([]);
  expect(checkOffline("<p>no asset</p>", { assets: [{ id: "x", path: "x" }] }, () => Buffer.from("x")).length).toBe(1);
});
it("CLI returns code 1 for an external fixture", () => {
  writeFileSync("/tmp/slots-external-fixture.html", '<script src="https://example.test/test.js"></script>');
  expect(() =>
    execFileSync(process.execPath, ["scripts/check-offline.mjs", "/tmp/slots-external-fixture.html"], {
      stdio: "pipe",
    }),
  ).toThrow();
});
it("does not confuse JavaScript url methods with stylesheet URLs", () => {
  expect(
    checkOffline("<script>function url(value){return value;}url(payload);</script>", { assets: [] }, () =>
      Buffer.alloc(0),
    ),
  ).toEqual([]);
});
