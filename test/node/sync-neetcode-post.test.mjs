import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";

import { runFromEnv, syncNeetCodePost } from "../../scripts/sync-neetcode-post.mjs";

test("creates one post per problem and appends later attempts", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "neetcode-blog-sync-"));
  const blogRoot = path.join(tempRoot, "blog");
  const sourceRoot = path.join(tempRoot, "source");

  await mkdir(path.join(blogRoot, "_posts", "algorithms", "neetcode"), { recursive: true });
  await mkdir(path.join(sourceRoot, "Data Structures & Algorithms", "is-anagram"), {
    recursive: true,
  });

  const firstSubmissionPath = path.join(
    sourceRoot,
    "Data Structures & Algorithms",
    "is-anagram",
    "submission-0.py",
  );
  const secondSubmissionPath = path.join(
    sourceRoot,
    "Data Structures & Algorithms",
    "is-anagram",
    "submission-1.py",
  );

  await writeFile(firstSubmissionPath, "class Solution:\n    pass\n", "utf8");
  await writeFile(secondSubmissionPath, "class Solution:\n    def solve(self):\n        return True\n", "utf8");

  const firstResult = await syncNeetCodePost({
    blogRoot,
    sourceRoot,
    sourceRepo: "devbattery/neetcode-submissions",
    problemSlug: "is-anagram",
    language: "python",
    submissionPath: "Data Structures & Algorithms/is-anagram/submission-0.py",
    sourceSha: "abc1234",
    syncedAt: "2026-04-21T09:00:00+09:00",
    titleResolver: async () => "Is Anagram",
  });

  let content = await readFile(firstResult.filePath, "utf8");
  content = content.replace(
    "## Notes\n\nWrite your own notes here. This section is preserved across syncs.\n",
    "## Notes\n\nManual note stays here.\n",
  );
  await writeFile(firstResult.filePath, content, "utf8");

  const secondResult = await syncNeetCodePost({
    blogRoot,
    sourceRoot,
    sourceRepo: "devbattery/neetcode-submissions",
    problemSlug: "is-anagram",
    language: "python",
    submissionPath: "Data Structures & Algorithms/is-anagram/submission-1.py",
    sourceSha: "def5678",
    syncedAt: "2026-04-22T10:30:00+09:00",
    titleResolver: async () => "Is Anagram",
  });

  const postsDir = path.join(blogRoot, "_posts", "algorithms", "neetcode");
  const files = await readdir(postsDir);

  assert.equal(files.length, 1);
  assert.equal(secondResult.filePath, firstResult.filePath);

  const updated = await readFile(secondResult.filePath, "utf8");
  assert.match(secondResult.filePath, /_posts\/algorithms\/neetcode\//);
  assert.match(updated, /categories:\n  - NeetCode/);
  assert.match(updated, /neetcode_problem_slug: 'is-anagram'/);
  assert.match(updated, /last_modified_at: 2026-04-22/);
  assert.match(updated, /Manual note stays here\./);
  assert.match(updated, /<!-- neetcode-attempt:abc1234:Data Structures & Algorithms\/is-anagram\/submission-0\.py -->/);
  assert.match(updated, /<!-- neetcode-attempt:def5678:Data Structures & Algorithms\/is-anagram\/submission-1\.py -->/);
});

test("supports env-driven execution and skips duplicate attempts", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "neetcode-blog-env-"));
  const blogRoot = path.join(tempRoot, "blog");
  const sourceRoot = path.join(tempRoot, "source");

  await mkdir(path.join(blogRoot, "_posts", "algorithms", "neetcode"), { recursive: true });
  await mkdir(path.join(sourceRoot, "Data Structures & Algorithms", "two-integer-sum"), {
    recursive: true,
  });

  await writeFile(
    path.join(sourceRoot, "Data Structures & Algorithms", "two-integer-sum", "submission-1.py"),
    "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]\n",
    "utf8",
  );

  const env = {
    BLOG_ROOT: blogRoot,
    SOURCE_ROOT: sourceRoot,
    SOURCE_REPO: "devbattery/neetcode-submissions",
    PROBLEM_SLUG: "two-integer-sum",
    LANGUAGE: "python",
    SUBMISSION_PATH: "Data Structures & Algorithms/two-integer-sum/submission-1.py",
    SOURCE_SHA: "deadbeef",
    SYNCED_AT: "2026-04-23T08:00:00+09:00",
    PROBLEM_TITLE: "Two Integer Sum",
  };

  const firstRun = await runFromEnv(env);
  const secondRun = await runFromEnv(env);

  assert.equal(firstRun.changed, true);
  assert.equal(secondRun.changed, false);

  const content = await readFile(firstRun.filePath, "utf8");
  const attemptMatches = content.match(/<!-- neetcode-attempt:/g) || [];
  assert.equal(attemptMatches.length, 1);
});
