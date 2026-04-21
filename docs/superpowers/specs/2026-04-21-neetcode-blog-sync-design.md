# NeetCode Blog Sync Design

## Goal

When `devbattery/neetcode-submissions` receives a new synced submission commit, the blog repository should automatically create or update exactly one post per problem and append the latest solution as a new attempt entry.

## Constraints

- The blog already publishes issue-authored posts through GitHub Actions on the `release` branch.
- The NeetCode repository is a separate repository and only exposes synced submission files such as `Data Structures & Algorithms/is-anagram/submission-0.py`.
- Repeated submissions for the same problem must not create new posts.
- Repeated submissions for the same problem must append a new solution block instead of replacing the existing content.
- Manually written notes in the blog post must remain intact across automated updates.

## Proposed Design

### Event flow

1. A new workflow in `devbattery/neetcode-submissions` runs on `push` to `main`.
2. The workflow detects added or modified `submission-*` files in the pushed commit range.
3. For each changed submission file, the workflow sends a `repository_dispatch` event to `devbattery/devbattery.github.io`.
4. A new workflow in the blog repository handles that dispatch, checks out the `release` branch, reads the submission file from the NeetCode repository at the pushed SHA, and updates the corresponding post.

### Post identity

- A post is identified by `neetcode_problem_slug` in front matter.
- The generated file path lives under `_posts/algorithms/neetcode/<created-date>-<slug>.md`.
- The first sync creates the file.
- Later syncs search by `neetcode_problem_slug` and update the same file.

### Post structure

The generated post contains:

- Front matter with `title`, `excerpt`, `categories`, `tags`, `date`, `last_modified_at`, `toc`, `toc_sticky`, `sidebar`, `neetcode_problem_slug`, and `neetcode_source_repo`.
- A preserved `## Notes` section for manual writing.
- An auto-managed `## Attempts` section delimited by HTML comments.

Each appended attempt block includes:

- A stable attempt key based on source commit SHA and submission path.
- Sync date in Asia/Seoul.
- Language.
- Source repository path.
- Source commit SHA with GitHub link.
- The exact solution code in a fenced code block.

### Metadata strategy

- The blog workflow derives the problem slug and language from the dispatch payload.
- The workflow fetches a human-readable problem title from NeetCode when possible and falls back to a titleized slug.
- The post title format is `[NeetCode] <Problem Title>`.
- Tags always include `algorithms` and `neetcode`, plus the normalized language tag.

### Update rules

- `date` is set only when the post is first created.
- `last_modified_at` is updated on every successful append.
- If the same attempt key already exists, the workflow makes no change.
- If the attempt markers are missing in an older file, the workflow recreates the `## Attempts` section at the end of the document.

## Risks And Mitigations

- Cross-repository auth is required. Use a dedicated secret in `neetcode-submissions` with permission to dispatch to the blog repo.
- Parallel dispatches can race on `release`. Use workflow concurrency in the blog repo so post updates run serially.
- NeetCode titles may not always match LeetCode titles. Prefer NeetCode page metadata and fall back cleanly to a slug-derived title.
