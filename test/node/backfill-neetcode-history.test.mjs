import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { backfillNeetCodeHistory } from "../../scripts/backfill-neetcode-history.mjs";

const execFileAsync = promisify(execFile);

async function run(cmd, args, options = {}) {
  return execFileAsync(cmd, args, {
    ...options,
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

async function git(repoDir, args, options = {}) {
  return run("git", ["-C", repoDir, ...args], options);
}

test("replays submission history into one post per problem with ordered attempts", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "neetcode-backfill-"));
  const sourceRepo = path.join(tempRoot, "source-repo");
  const blogRoot = path.join(tempRoot, "blog");

  await mkdir(sourceRepo, { recursive: true });
  await mkdir(path.join(blogRoot, "_posts", "algorithms", "neetcode"), {
    recursive: true,
  });

  await git(sourceRepo, ["init", "-b", "main"]);
  await git(sourceRepo, ["config", "user.name", "Codex"]);
  await git(sourceRepo, ["config", "user.email", "codex@example.com"]);

  const alphaDir = path.join(sourceRepo, "Data Structures & Algorithms", "alpha-problem");
  const betaDir = path.join(sourceRepo, "Data Structures & Algorithms", "beta-problem");

  await mkdir(alphaDir, { recursive: true });
  await mkdir(betaDir, { recursive: true });

  await writeFile(path.join(alphaDir, "submission-0.py"), "print('alpha-0')\n", "utf8");
  await writeFile(path.join(betaDir, "submission-0.py"), "print('beta-0')\n", "utf8");
  await git(sourceRepo, ["add", "."]);
  await git(
    sourceRepo,
    ["commit", "-m", "bulk sync"],
    {
      env: {
        GIT_AUTHOR_DATE: "2026-04-01T09:00:00+09:00",
        GIT_COMMITTER_DATE: "2026-04-01T09:00:00+09:00",
      },
    },
  );

  await writeFile(path.join(alphaDir, "submission-1.py"), "print('alpha-1')\n", "utf8");
  await git(sourceRepo, ["add", "."]);
  await git(
    sourceRepo,
    ["commit", "-m", "alpha retry"],
    {
      env: {
        GIT_AUTHOR_DATE: "2026-04-02T10:30:00+09:00",
        GIT_COMMITTER_DATE: "2026-04-02T10:30:00+09:00",
      },
    },
  );

  const result = await backfillNeetCodeHistory({
    blogRoot,
    sourceRepoPath: sourceRepo,
    sourceRepoName: "devbattery/neetcode-submissions",
    titleResolver: async (slug) =>
      slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
  });

  assert.equal(result.eventsProcessed, 3);

  const files = await readdir(path.join(blogRoot, "_posts", "algorithms", "neetcode"));
  assert.equal(files.length, 2);

  const alphaPost = files.find((file) => file.endsWith("-alpha-problem.md"));
  assert.ok(alphaPost);

  const alphaContent = await readFile(
    path.join(blogRoot, "_posts", "algorithms", "neetcode", alphaPost),
    "utf8",
  );

  assert.match(alphaContent, /### Attempt 1 · 2026-04-01 · Python/);
  assert.match(alphaContent, /### Attempt 2 · 2026-04-02 · Python/);
  assert.match(alphaContent, /print\('alpha-0'\)/);
  assert.match(alphaContent, /print\('alpha-1'\)/);
  assert.match(alphaContent, /date: 2026-04-01T09:00:00\+09:00/);
  assert.match(alphaContent, /last_modified_at: 2026-04-02T10:30:00\+09:00/);
  assert.match(alphaContent, /neetcode_problem_slug: 'alpha-problem'/);
});
