import path from "node:path";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const POSTS_ROOT = ["_posts", "algorithms", "neetcode"];
const ATTEMPTS_START = "<!-- neetcode-attempts:start -->";
const ATTEMPTS_END = "<!-- neetcode-attempts:end -->";

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatSeoulDate(input) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(input));
}

function titleizeSlug(slug) {
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function languageLabel(language) {
  const raw = String(language || "").trim().toLowerCase();
  if (!raw) {
    return "Text";
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function quoteYaml(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function listMarkdownFiles(rootDir) {
  const files = [];
  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function findExistingPost(postsDir, problemSlug) {
  try {
    const files = await listMarkdownFiles(postsDir);
    const slugRegex = new RegExp(
      `^neetcode_problem_slug:\\s*['"]?${escapeRegex(problemSlug)}['"]?\\s*$`,
      "m",
    );

    for (const filePath of files) {
      const content = await readFile(filePath, "utf8");
      const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
      if (match && slugRegex.test(match[1])) {
        return filePath;
      }
    }
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }
  }

  return "";
}

function splitFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontMatter: "", body: content };
  }

  return {
    frontMatter: match[1],
    body: match[2],
  };
}

function frontMatterValue(frontMatter, key) {
  const match = frontMatter.match(new RegExp(`^${escapeRegex(key)}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function upsertFrontMatter(frontMatter, key, value) {
  const line = `${key}: ${value}`;
  const regex = new RegExp(`^${escapeRegex(key)}:.*$`, "m");

  if (regex.test(frontMatter)) {
    return frontMatter.replace(regex, line);
  }

  return frontMatter ? `${frontMatter}\n${line}` : line;
}

function encodeGitHubPath(input) {
  return input
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildAttemptBlock({ attemptNumber, attemptDate, language, submissionPath, sourceRepo, sourceSha, code }) {
  const attemptKey = `<!-- neetcode-attempt:${sourceSha}:${submissionPath} -->`;
  const commitUrl = `https://github.com/${sourceRepo}/commit/${sourceSha}`;
  const fileUrl = `https://github.com/${sourceRepo}/blob/${sourceSha}/${encodeGitHubPath(submissionPath)}`;

  return [
    attemptKey,
    `### Attempt ${attemptNumber} · ${attemptDate} · ${languageLabel(language)}`,
    "",
    `- Commit: [\`${sourceSha.slice(0, 7)}\`](${commitUrl})`,
    `- Source: [\`${submissionPath}\`](${fileUrl})`,
    "",
    `\`\`\`${String(language || "text").toLowerCase() || "text"}`,
    code.replace(/\n+$/, ""),
    "```",
    "",
  ].join("\n");
}

function ensureAttemptsSection(body) {
  if (body.includes(ATTEMPTS_START) && body.includes(ATTEMPTS_END)) {
    return body;
  }

  const normalizedBody = body.replace(/\s*$/, "");

  return [
    normalizedBody,
    "",
    "## Attempts",
    "",
    ATTEMPTS_START,
    ATTEMPTS_END,
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

function appendAttempt(body, block, sourceSha, submissionPath) {
  const attemptMarker = `<!-- neetcode-attempt:${sourceSha}:${submissionPath} -->`;
  if (body.includes(attemptMarker)) {
    return { body, changed: false };
  }

  const preparedBody = ensureAttemptsSection(body);
  const attemptCount = (preparedBody.match(/<!-- neetcode-attempt:/g) || []).length;
  const finalizedBlock = block(attemptCount + 1);

  const updatedBody = preparedBody.replace(
    ATTEMPTS_END,
    `${finalizedBlock}${ATTEMPTS_END}`,
  );

  return { body: updatedBody, changed: true };
}

function buildNewPost({
  title,
  excerpt,
  createdDate,
  modifiedDate,
  problemSlug,
  sourceRepo,
  attemptBlock,
  language,
}) {
  return [
    "---",
    `title: ${quoteYaml(`[NeetCode] ${title}`)}`,
    `excerpt: ${quoteYaml(excerpt)}`,
    "",
    "categories:",
    "  - NeetCode",
    "tags:",
    "  - algorithms",
    "  - neetcode",
    `  - ${quoteYaml(String(language).toLowerCase())}`,
    "",
    "toc: true",
    "toc_sticky: true",
    "",
    "sidebar:",
    '  nav: "categories"',
    "",
    `date: ${createdDate}`,
    `last_modified_at: ${modifiedDate}`,
    `neetcode_problem_slug: ${quoteYaml(problemSlug)}`,
    `neetcode_source_repo: ${quoteYaml(sourceRepo)}`,
    "---",
    "",
    `- [Problem](https://neetcode.io/problems/${problemSlug}/question)`,
    `- Synced automatically from \`${sourceRepo}\``,
    "",
    "## Notes",
    "",
    "Write your own notes here. This section is preserved across syncs.",
    "",
    "## Attempts",
    "",
    ATTEMPTS_START,
    attemptBlock,
    ATTEMPTS_END,
    "",
  ].join("\n");
}

async function fetchProblemTitle(problemSlug) {
  try {
    const response = await fetch(`https://neetcode.io/solutions/${problemSlug}`);
    if (!response.ok) {
      return "";
    }

    const html = await response.text();
    const headingMatch = html.match(/<title>\s*(.+?)\s*-\s*Solution\s*&amp;\s*Explanation\s*<\/title>/i);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    const h1Match = html.match(/<h1[^>]*>\s*(.+?)\s*<\/h1>/i);
    if (h1Match) {
      return h1Match[1].replace(/<[^>]+>/g, "").trim();
    }
  } catch {
    return "";
  }

  return "";
}

export async function syncNeetCodePost({
  blogRoot,
  sourceRoot,
  sourceRepo,
  problemSlug,
  language,
  submissionPath,
  sourceSha,
  syncedAt,
  titleResolver = async (slug) => titleizeSlug(slug),
}) {
  const postsDir = path.join(blogRoot, ...POSTS_ROOT);
  await mkdir(postsDir, { recursive: true });

  const createdDate = formatSeoulDate(syncedAt);
  const existingPath = await findExistingPost(path.join(blogRoot, "_posts"), problemSlug);
  const filePath = existingPath || path.join(postsDir, `${createdDate}-${problemSlug}.md`);
  const title = (await titleResolver(problemSlug)) || titleizeSlug(problemSlug);
  const code = await readFile(path.join(sourceRoot, submissionPath), "utf8");
  const excerpt = `NeetCode synced attempts for ${title}.`;
  const attemptDate = createdDate;

  const attemptFactory = (attemptNumber) =>
    buildAttemptBlock({
      attemptNumber,
      attemptDate,
      language,
      submissionPath,
      sourceRepo,
      sourceSha,
      code,
    });

  if (!existingPath) {
    const content = buildNewPost({
      title,
      excerpt,
      createdDate,
      modifiedDate: createdDate,
      problemSlug,
      sourceRepo,
      attemptBlock: attemptFactory(1),
      language,
    });

    await writeFile(filePath, content, "utf8");
    return { filePath, changed: true, created: true };
  }

  const existing = await readFile(filePath, "utf8");
  const { frontMatter, body } = splitFrontMatter(existing);
  const { body: updatedBody, changed } = appendAttempt(body, attemptFactory, sourceSha, submissionPath);

  if (!changed) {
    return { filePath, changed: false, created: false };
  }

  let updatedFrontMatter = frontMatter;
  updatedFrontMatter = upsertFrontMatter(updatedFrontMatter, "last_modified_at", createdDate);
  updatedFrontMatter = upsertFrontMatter(updatedFrontMatter, "neetcode_problem_slug", quoteYaml(problemSlug));
  updatedFrontMatter = upsertFrontMatter(updatedFrontMatter, "neetcode_source_repo", quoteYaml(sourceRepo));

  if (!frontMatterValue(updatedFrontMatter, "title")) {
    updatedFrontMatter = upsertFrontMatter(
      updatedFrontMatter,
      "title",
      quoteYaml(`[NeetCode] ${title}`),
    );
  }
  if (!frontMatterValue(updatedFrontMatter, "date")) {
    updatedFrontMatter = upsertFrontMatter(updatedFrontMatter, "date", createdDate);
  }

  const rebuilt = `---\n${updatedFrontMatter}\n---\n${updatedBody.startsWith("\n") ? "" : "\n"}${updatedBody}`;
  await writeFile(filePath, rebuilt, "utf8");

  return { filePath, changed: true, created: false };
}

export async function runFromEnv(env = process.env) {
  const problemTitle = env.PROBLEM_TITLE || (await fetchProblemTitle(env.PROBLEM_SLUG));

  return syncNeetCodePost({
    blogRoot: env.BLOG_ROOT,
    sourceRoot: env.SOURCE_ROOT,
    sourceRepo: env.SOURCE_REPO,
    problemSlug: env.PROBLEM_SLUG,
    language: env.LANGUAGE,
    submissionPath: env.SUBMISSION_PATH,
    sourceSha: env.SOURCE_SHA,
    syncedAt: env.SYNCED_AT,
    titleResolver: async () => problemTitle || titleizeSlug(env.PROBLEM_SLUG),
  });
}

async function main() {
  const result = await runFromEnv(process.env);
  if (result.filePath) {
    console.log(result.filePath);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
