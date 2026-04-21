# NeetCode Blog Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically append NeetCode submission attempts into one persistent blog post per problem whenever the NeetCode submissions repository receives a synced commit.

**Architecture:** Add one dispatch workflow in `neetcode-submissions` and one sync workflow in the blog repository. Put the post-generation logic in a standalone Node script so it can be tested with `node --test` and reused by GitHub Actions.

**Tech Stack:** GitHub Actions, Node.js 20, built-in `node:test`, Jekyll markdown posts

---

## File Map

- Create: `scripts/sync-neetcode-post.mjs`
- Create: `test/sync-neetcode-post.test.mjs`
- Create: `.github/workflows/sync-neetcode-post.yml`
- Create in NeetCode repo: `.github/workflows/dispatch-blog-sync.yml`
- Create: `docs/superpowers/specs/2026-04-21-neetcode-blog-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-21-neetcode-blog-sync.md`

### Task 1: Cover Post Identity And Append Rules

**Files:**
- Create: `test/sync-neetcode-post.test.mjs`
- Create: `scripts/sync-neetcode-post.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('creates a new post and appends later attempts to the same slug', async () => {
  // Arrange temporary blog and source directories.
  // Run the sync once with submission-0.py.
  // Run the sync again with submission-1.py for the same slug.
  // Assert one markdown file exists.
  // Assert both attempt keys exist.
  // Assert last_modified_at changed on second run.
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/sync-neetcode-post.test.mjs`
Expected: FAIL because `scripts/sync-neetcode-post.mjs` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
// Export a syncNeetCodePost function that:
// - finds/creates one post file by neetcode_problem_slug
// - appends an attempt block between marker comments
// - skips duplicate attempt keys
// - preserves manual notes outside the managed markers
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/sync-neetcode-post.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add test/sync-neetcode-post.test.mjs scripts/sync-neetcode-post.mjs
git commit -m "feat: add neetcode post sync engine"
```

### Task 2: Cover Duplicate Prevention And Marker Recovery

**Files:**
- Modify: `test/sync-neetcode-post.test.mjs`
- Modify: `scripts/sync-neetcode-post.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('does not append the same attempt twice and recreates missing attempt markers', async () => {
  // Seed a markdown file without attempt markers.
  // Sync one attempt twice.
  // Assert exactly one attempt block exists.
  // Assert markers are present after sync.
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/sync-neetcode-post.test.mjs`
Expected: FAIL because duplicate prevention or marker recovery is incomplete.

- [ ] **Step 3: Write minimal implementation**

```js
// Extend the sync function to:
// - detect existing attempt keys
// - restore the managed attempts section when missing
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/sync-neetcode-post.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add test/sync-neetcode-post.test.mjs scripts/sync-neetcode-post.mjs
git commit -m "feat: harden neetcode attempt syncing"
```

### Task 3: Add Blog Workflow Integration

**Files:**
- Create: `.github/workflows/sync-neetcode-post.yml`
- Modify: `scripts/sync-neetcode-post.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('supports environment-driven execution for github actions payloads', async () => {
  // Call the CLI entrypoint with temp directories and env vars.
  // Assert it writes the expected markdown file.
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/sync-neetcode-post.test.mjs`
Expected: FAIL because the CLI entrypoint cannot parse env vars yet.

- [ ] **Step 3: Write minimal implementation**

```yaml
on:
  repository_dispatch:
    types: [neetcode_submission_synced]
```

```js
// Add a CLI main() that reads payload env vars, fetches title metadata,
// and writes the updated post file.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/sync-neetcode-post.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/sync-neetcode-post.yml scripts/sync-neetcode-post.mjs test/sync-neetcode-post.test.mjs
git commit -m "feat: wire neetcode sync workflow"
```

### Task 4: Add NeetCode Repo Dispatch Workflow

**Files:**
- Create in NeetCode repo: `.github/workflows/dispatch-blog-sync.yml`

- [ ] **Step 1: Write the failing check**

```bash
git -C /tmp/neetcode-submissions-codex diff --name-only HEAD~1 HEAD
```

Expected: shows changed `submission-*` files but no dispatch automation exists yet.

- [ ] **Step 2: Add minimal workflow**

```yaml
on:
  push:
    branches: [main]
```

```bash
# Detect changed submission files and dispatch one event per file.
```

- [ ] **Step 3: Validate workflow shape**

Run: `sed -n '1,220p' /tmp/neetcode-submissions-codex/.github/workflows/dispatch-blog-sync.yml`
Expected: workflow declares required secret, diff logic, and dispatch loop.

- [ ] **Step 4: Commit**

```bash
git -C /tmp/neetcode-submissions-codex add .github/workflows/dispatch-blog-sync.yml
git -C /tmp/neetcode-submissions-codex commit -m "feat: dispatch neetcode blog sync events"
```

### Task 5: Verify End-To-End Locally

**Files:**
- Modify as needed: `scripts/sync-neetcode-post.mjs`
- Modify as needed: `test/sync-neetcode-post.test.mjs`

- [ ] **Step 1: Run automated tests**

Run: `node --test test/sync-neetcode-post.test.mjs`
Expected: PASS

- [ ] **Step 2: Run Jekyll build**

Run: `PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH" bundle exec jekyll build`
Expected: successful build with no fatal errors

- [ ] **Step 3: Summarize required secret setup**

```text
In devbattery/neetcode-submissions:
- BLOG_REPO_DISPATCH_TOKEN
```

## Self-Review

- Spec coverage: the plan covers cross-repo dispatch, single-post identity, append-only attempts, duplicate prevention, and local verification.
- Placeholder scan: no `TODO` or unspecified paths remain.
- Type consistency: the plan consistently uses `neetcode_problem_slug`, `attempt key`, and `repository_dispatch` with `neetcode_submission_synced`.
