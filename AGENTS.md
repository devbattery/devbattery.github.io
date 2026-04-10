# AGENTS.md

This repository is a Jekyll blog that uses Ruby 3.3 and is frequently debugged with Playwright against a local server.

## Environment

- Working directory: repository root
- Ruby: Homebrew Ruby 3.3 at `/opt/homebrew/opt/ruby@3.3/bin`
- Jekyll server: `http://127.0.0.1:4000/`
- `node_modules/` is gitignored, so temporary Playwright installs are acceptable
- `.codex-screens/` is gitignored and should be used for temporary screenshots

## Start The Blog Locally

Use one of these:

```bash
./start.sh
```

or, if you need an explicit host/port:

```bash
PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH" bundle exec jekyll serve --host 127.0.0.1 --port 4000 --trace
```

Before browser work, verify the server is up:

```bash
curl -I -s http://127.0.0.1:4000/ | head -n 1
```

Expected result:

```text
HTTP/1.1 200 OK
```

## Playwright Workflow

If Playwright is not already installed in this repo, install it as a temporary local dependency:

```bash
npm install --no-save playwright @playwright/test
```

Use the real Chrome channel, not generic Chromium, when checking UI regressions:

```js
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: false });
```

Recommended defaults:

- Desktop checks: `viewport: { width: 1440, height: 1200 }`
- Mobile checks: `viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true`
- Save screenshots to `.codex-screens/`

Example one-off script:

```bash
node - <<'NODE'
const { chromium } = require('playwright');
(async() => {
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '.codex-screens/home-check.jpg', quality: 90 });
  await browser.close();
})();
NODE
```

## Pages Worth Checking

When changing theme or layout, check at least:

- `/`
- `/categories/`
- `/tags/`
- one representative post such as `/til/log-76/`
- desktop and mobile
- light and dark mode

## Important Theme Notes

- Theme switching is driven by:
  - `/_includes/head.html`
  - `/assets/js/dark-theme.js`
  - `/_sass/minimal-mistakes/_stitch-overrides.scss`
- `main.css` and `main_dark.css` are both present and switched via `media`, not by rebuilding CSS on the fly.
- If a dark/light toggle change looks broken, inspect both the immediate frame after click and the settled frame ~500ms later.

## Comments / Giscus

- Comments are only rendered in `production` because `/_layouts/single.html` gates them with:

```liquid
{% if jekyll.environment == 'production' and site.comments.provider and page.comments %}
```

- This means local `jekyll serve` in development may not show the comments block even though the production site does.
- Giscus theming is configured in:
  - `/_includes/comments-providers/giscus.html`
  - `/assets/js/dark-theme.js`

## Editing Constraints For This Repo

- Prefer changing visual tokens and overrides in `/_sass/minimal-mistakes/_stitch-overrides.scss`
- Do not delete user content or unrelated local artifacts
- Use `apply_patch` for file edits
- Run a build after changes:

```bash
PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH" bundle exec jekyll build
```

## Common Failure Cases

- If Playwright MCP is unavailable, fall back to local Playwright with the Chrome channel.
- If Playwright screenshots fail because the page is too tall, capture viewport screenshots instead of `fullPage`.
- If Chrome profile locking occurs, close previous Playwright Chrome processes before retrying.
