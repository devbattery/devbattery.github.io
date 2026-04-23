import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const WORKFLOW_PATH = "/Users/ibm/Blog/devbattery.github.io/.github/workflows/publish-post-from-issue.yml";

async function extractIssueBuilderScript() {
  const workflow = await readFile(WORKFLOW_PATH, "utf8");
  const lines = workflow.split("\n");
  const startIndex = lines.findIndex((line) => line.includes("script: |"));

  if (startIndex === -1) {
    throw new Error("Could not find github-script block in publish-post-from-issue workflow.");
  }

  const scriptLines = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("            ")) {
      scriptLines.push(line.slice(12));
      continue;
    }
    if (line.trim() === "") {
      scriptLines.push("");
      continue;
    }
    break;
  }

  return scriptLines.join("\n");
}

async function runIssueBuilder(issue) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "issue-post-builder-"));
  const previousCwd = process.cwd();
  const outputs = new Map();
  const warnings = [];
  let failedMessage = "";

  await mkdir(path.join(tempRoot, "_posts"), { recursive: true });

  try {
    process.chdir(tempRoot);
    const script = await extractIssueBuilderScript();
    const wrappedScript = `(function () {\n${script}\n})()`;
    vm.runInNewContext(wrappedScript, {
      require,
      console,
      process,
      context: {
        payload: { issue },
      },
      core: {
        setOutput(name, value) {
          outputs.set(name, value);
        },
        warning(message) {
          warnings.push(String(message));
        },
        setFailed(message) {
          failedMessage = String(message);
        },
      },
    });
  } finally {
    process.chdir(previousCwd);
  }

  if (failedMessage) {
    throw new Error(failedMessage);
  }

  return { tempRoot, outputs, warnings };
}

test("issue post publishing preserves created and modified time in front matter", async () => {
  const issue = {
    number: 101,
    title: "[POST] Timestamped Issue Post",
    body: [
      "### 요약",
      "",
      "Issue-driven post",
      "",
      "### 카테고리",
      "",
      "react",
      "",
      "### 파일 슬러그",
      "",
      "timestamped-issue-post",
      "",
      "### 저장 폴더",
      "",
      "_No response_",
      "",
      "### 태그",
      "",
      "blog, issue",
      "",
      "### 작성일",
      "",
      "_No response_",
      "",
      "### 수정일",
      "",
      "_No response_",
      "",
      "### 본문",
      "",
      "본문입니다.",
    ].join("\n"),
    created_at: "2026-04-23T12:15:42Z",
    updated_at: "2026-04-23T14:05:11Z",
  };

  const { tempRoot, outputs } = await runIssueBuilder(issue);
  const postPath = outputs.get("path");

  assert.equal(postPath, "_posts/programming/react/2026-04-23-timestamped-issue-post.md");

  const content = await readFile(path.join(tempRoot, postPath), "utf8");
  assert.match(content, /date: 2026-04-23T21:15:42\+09:00/);
  assert.match(content, /last_modified_at: 2026-04-23T23:05:11\+09:00/);
});

test("issue post publishing keeps date-only overrides compatible", async () => {
  const issue = {
    number: 102,
    title: "[POST] Manual Date Override",
    body: [
      "### 요약",
      "",
      "Manual date field",
      "",
      "### 카테고리",
      "",
      "til",
      "",
      "### 파일 슬러그",
      "",
      "manual-date-override",
      "",
      "### 저장 폴더",
      "",
      "_No response_",
      "",
      "### 태그",
      "",
      "_No response_",
      "",
      "### 작성일",
      "",
      "2026-04-20",
      "",
      "### 수정일",
      "",
      "2026-04-22",
      "",
      "### 본문",
      "",
      "본문입니다.",
    ].join("\n"),
    created_at: "2026-04-23T00:00:00Z",
    updated_at: "2026-04-23T01:00:00Z",
  };

  const { tempRoot, outputs, warnings } = await runIssueBuilder(issue);
  const postPath = outputs.get("path");

  assert.equal(postPath, "_posts/diary/til/2026-04-20-manual-date-override.md");

  const content = await readFile(path.join(tempRoot, postPath), "utf8");
  assert.match(content, /date: 2026-04-20T00:00:00\+09:00/);
  assert.match(content, /last_modified_at: 2026-04-22T00:00:00\+09:00/);
  assert.equal(warnings.length, 0);
});
