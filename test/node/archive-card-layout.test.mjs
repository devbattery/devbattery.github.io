import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const SCSS_PATH = "/Users/ibm/Blog/devbattery.github.io/_sass/minimal-mistakes/_stitch-overrides.scss";

test("archive cards reserve consistent height for wrapped text", async () => {
  const scss = await readFile(SCSS_PATH, "utf8");
  const collectBlocks = (pattern) => [...scss.matchAll(pattern)].map((match) => match[0]);
  const contentBlock = scss.match(/\.db-archive-item__content\s*\{[\s\S]*?\}/)?.[0] || "";
  const titleBlock = scss.match(/\.archive__item-title\s*\{[\s\S]*?\}/)?.[0] || "";
  const titleLinkBlock = scss.match(/\.archive__item-title\s+a\s*\{[\s\S]*?\}/)?.[0] || "";
  const excerptBlock = collectBlocks(/\.archive__item-excerpt\s*\{[\s\S]*?\}/g).find((block) =>
    block.includes("-webkit-line-clamp"),
  ) || "";
  const tagsBlock = scss.match(/\.db-archive-item__tags\s*\{[\s\S]*?\}/)?.[0] || "";

  assert.match(contentBlock, /flex:\s*1 1 auto;/);

  assert.match(titleBlock, /(?:^|\n)\s*height:\s*calc\(2 \* 1\.1em\);/);

  assert.match(titleLinkBlock, /display:\s*-webkit-box;/);
  assert.match(titleLinkBlock, /-webkit-line-clamp:\s*2;/);
  assert.match(titleLinkBlock, /overflow:\s*hidden;/);

  assert.match(excerptBlock, /display:\s*-webkit-box;/);
  assert.match(excerptBlock, /-webkit-line-clamp:\s*3;/);
  assert.match(excerptBlock, /overflow:\s*hidden;/);
  assert.match(excerptBlock, /(?:^|\n)\s*height:\s*calc\(3 \* 1\.72em\);/);

  assert.match(tagsBlock, /margin-top:\s*auto;/);
});
