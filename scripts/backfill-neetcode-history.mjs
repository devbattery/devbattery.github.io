import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { fetchProblemTitle, syncNeetCodePost } from "./sync-neetcode-post.mjs";

const execFileAsync = promisify(execFile);

function normalizeRepoName(remoteUrl) {
  const trimmed = String(remoteUrl || "").trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("git@github.com:")) {
    return trimmed.replace("git@github.com:", "").replace(/\.git$/, "");
  }

  if (trimmed.startsWith("https://github.com/")) {
    return trimmed.replace("https://github.com/", "").replace(/\.git$/, "");
  }

  return trimmed.replace(/\.git$/, "");
}

async function git(repoPath, args) {
  const { stdout } = await execFileAsync("git", ["-C", repoPath, ...args]);
  return stdout.trimEnd();
}

function parseLanguageFromPath(filePath) {
  const extension = path.extname(filePath).replace(/^\./, "").toLowerCase();
  const languageMap = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    java: "java",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    kt: "kotlin",
    swift: "swift",
    sql: "sql",
  };

  return languageMap[extension] || extension || "text";
}

function parseProblemSlug(filePath) {
  return path.basename(path.dirname(filePath));
}

export async function collectSubmissionEvents(sourceRepoPath) {
  const commitsRaw = await git(sourceRepoPath, [
    "log",
    "--reverse",
    "--format=%H",
    "--",
    "Data Structures & Algorithms",
  ]);

  const commits = commitsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const events = [];

  for (const commit of commits) {
    const commitDate = await git(sourceRepoPath, ["show", "-s", "--format=%cI", commit]);
    const changedFilesRaw = await git(sourceRepoPath, [
      "diff-tree",
      "--root",
      "--no-commit-id",
      "--name-only",
      "-r",
      "--diff-filter=AM",
      commit,
      "--",
      "Data Structures & Algorithms",
    ]);

    const changedFiles = changedFilesRaw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /\/submission-.*\.[^/]+$/.test(line))
      .sort();

    for (const filePath of changedFiles) {
      const sourceCode = await git(sourceRepoPath, ["show", `${commit}:${filePath}`]);
      events.push({
        sourceSha: commit,
        syncedAt: commitDate,
        submissionPath: filePath,
        problemSlug: parseProblemSlug(filePath),
        language: parseLanguageFromPath(filePath),
        sourceCode,
      });
    }
  }

  return events;
}

export async function backfillNeetCodeHistory({
  blogRoot,
  sourceRepoPath,
  sourceRepoName,
  titleResolver,
}) {
  const resolvedRepoName =
    sourceRepoName ||
    normalizeRepoName(await git(sourceRepoPath, ["remote", "get-url", "origin"]));

  const events = await collectSubmissionEvents(sourceRepoPath);
  const titleCache = new Map();
  let createdCount = 0;
  let changedCount = 0;

  for (const event of events) {
    const result = await syncNeetCodePost({
      blogRoot,
      sourceRepo: resolvedRepoName,
      sourceRoot: sourceRepoPath,
      problemSlug: event.problemSlug,
      language: event.language,
      submissionPath: event.submissionPath,
      sourceSha: event.sourceSha,
      syncedAt: event.syncedAt,
      sourceCode: event.sourceCode,
      titleResolver: async (slug) => {
        if (!titleCache.has(slug)) {
          titleCache.set(
            slug,
            titleResolver
              ? await titleResolver(slug)
              : await fetchProblemTitle(slug),
          );
        }

        return titleCache.get(slug);
      },
    });

    if (result.created) {
      createdCount += 1;
    }
    if (result.changed) {
      changedCount += 1;
    }
  }

  return {
    eventsProcessed: events.length,
    changedCount,
    createdCount,
  };
}

async function main() {
  const sourceRepoPath = process.argv[2];
  const blogRoot = process.argv[3] || process.cwd();

  if (!sourceRepoPath) {
    throw new Error("Usage: node scripts/backfill-neetcode-history.mjs <source-repo-path> [blog-root]");
  }

  const result = await backfillNeetCodeHistory({
    blogRoot,
    sourceRepoPath,
  });

  console.log(JSON.stringify(result));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
