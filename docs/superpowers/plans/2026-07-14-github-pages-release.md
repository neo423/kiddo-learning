# GitHub Pages Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove machine-specific paths, publish the initial `main` commit, and deploy Kiddo Learning through GitHub Pages.

**Architecture:** Keep the application unchanged and isolate release behavior in portable launcher commands, Vite base-path configuration, manifest paths, and one GitHub Actions workflow. GitHub Pages serves the uploaded `dist/` artifact from the repository subpath.

**Tech Stack:** React, Vite, npm, Git, GitHub Actions, GitHub Pages

## Global Constraints

- Repository: `https://github.com/neo423/kiddo-learning.git`
- Branch: `main`
- Commit message: `feat: initial release of Kiddo Learning`
- Do not force-push.
- Do not modify game functionality or visual presentation.
- Do not commit dependencies, build output, environment files, credentials, personal paths, or local temporary state.

---

### Task 1: Remove machine-specific paths

**Files:**
- Modify: `start-app.bat:5-17`
- Modify: `docs/superpowers/plans/2026-07-14-rainbow-home-redesign.md:125,143,163`

**Interfaces:**
- Consumes: `node` and `python` commands available through `PATH`
- Produces: portable local commands without machine-specific user-profile paths

- [ ] **Step 1: Verify the current tree fails the portability check**

Run: `rg -n -e '[A-Za-z]:\\Users\\' --glob '!node_modules/**' --glob '!dist/**' --glob '!.git/**' .`

Expected: FAIL for `start-app.bat` and the rainbow-home plan.

- [ ] **Step 2: Apply the minimal portable command changes**

Use `where node` plus `set "NODE=node"` in `start-app.bat`, with no bundled machine path fallback. Replace each absolute Python invocation in the plan with `python`.

- [ ] **Step 3: Verify the portability check passes**

Run the Step 1 command again.

Expected: no matches.

### Task 2: Configure GitHub Pages deployment

**Files:**
- Modify: `vite.config.js`
- Modify: `index.html`
- Modify: `public/manifest.webmanifest`
- Create: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Consumes: GitHub Pages repository path `/kiddo-learning/`
- Produces: a `dist/` artifact whose URLs resolve under that path

- [ ] **Step 1: Verify Pages configuration is currently absent**

Check that `vite.config.js` lacks `base: '/kiddo-learning/'` and `.github/workflows/deploy-pages.yml` does not exist.

- [ ] **Step 2: Add the minimal deployment configuration**

Set Vite `base` to `/kiddo-learning/`, use `%BASE_URL%manifest.webmanifest`, set manifest `start_url` and `scope` to `./`, and add the GitHub Pages build/deploy workflow.

- [ ] **Step 3: Build and inspect the output**

Run: `npm.cmd run build`

Expected: exit 0 and `dist/index.html` references `/kiddo-learning/` assets and manifest.

### Task 3: Audit, commit, push, and verify deployment

**Files:**
- Stage: all non-ignored project release files

**Interfaces:**
- Consumes: authenticated GitHub CLI session and empty `neo423/kiddo-learning` repository
- Produces: tracked `main` branch and deployed GitHub Pages site

- [ ] **Step 1: Restage and run the release audit**

Run staged-path, credential-pattern, local-path, email, and large-file scans. Stop on any risk match.

- [ ] **Step 2: Commit the audited release**

Run: `git commit -m "feat: initial release of Kiddo Learning"`

- [ ] **Step 3: Push without force**

Run: `git push -u origin main`

- [ ] **Step 4: Configure and verify GitHub Pages**

Set Pages build type to `workflow`, wait for the deployment workflow to complete, confirm `origin`, `main`, and clean status, and request `https://neo423.github.io/kiddo-learning/`.
