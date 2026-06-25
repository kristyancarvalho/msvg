# Contributing to MSVG

Thank you for contributing to MSVG. This project uses a strict issue-first workflow, local stage branches, and conventional commit messages adapted to the repository's current history.

MSVG is developed as an npm workspace project. All development commands must run inside Docker. Do not run project commands directly on the host machine.

## Core Rules

1. Start every change from a GitHub issue.
2. Classify every issue as `task`, `enhancement`, or `bug`.
3. Create one local stage branch for each implementation.
4. Run validation inside Docker before merging.
5. Merge validated work into `dev`.
6. Push only the integration branch or release branch to GitHub unless a pull request branch is explicitly required.
7. Use the commit format `<type>/<area>: <summary>; <issue action> issue_<id>`.
8. Keep the final source code free of comments.
9. Keep development-only documentation in `/specs` and do not version that directory.
10. Keep public documentation clear, beginner-friendly, and written in English.

## Docker-Only Development

All commands must run inside Docker. The host machine is only used to edit files and run Docker itself.

Do not run these directly on the host:

```bash
npm install
npm run build
npm run test
npm run check
npm run verify
node
npx
vitest
tsc
astro
```

Use the Docker workflow defined by the repository instead. Preferred commands:

```bash
docker compose build
docker compose run --rm app npm install
docker compose run --rm app npm run check
docker compose run --rm app npm run test
docker compose run --rm app npm run build
docker compose run --rm app npm run verify
```

If a new command is required, add it to the project scripts first and run it through Docker.

## Issue Workflow

Every implementation starts with an issue created with the GitHub CLI or GitHub UI.

Accepted issue types:

| Type | Use when |
|---|---|
| `task` | The work is operational, structural, testing, documentation, release, or maintenance work. |
| `enhancement` | The work adds or improves product behavior, public API, CLI behavior, integrations, or rendering capability. |
| `bug` | The work fixes incorrect behavior, broken tests, regressions, invalid output, or developer workflow failures. |

Issue titles should follow this pattern:

```text
<type>/<area>: <imperative summary>
```

Examples:

```text
chore/repo: add setup for workspace
feat/core: add parser normalization
fix/svg: escape unsafe text in labels
test/cli: cover render command failures
docs/readme: add Astro usage example
```

Issue bodies must include:

- Problem or goal
- Scope
- Out of scope
- Acceptance criteria
- Validation commands to run inside Docker
- Related release milestone

## Milestones

Release work must be grouped under a milestone.

For release `0.1.0`, use:

```text
Release 0.1.0
```

Every issue planned for that release must be attached to the milestone before implementation starts.

## Branch Workflow

The canonical integration branch is:

```text
dev
```

For each issue, create a local stage branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b stage/<issue-id>-<short-slug>
```

Examples:

```bash
git checkout -b stage/450865505-core
git checkout -b stage/510740867-workspace-setup
```

Stage branches are local implementation branches. They should not be pushed unless a remote branch is explicitly needed for review or collaboration.

After implementation and validation:

```bash
git checkout dev
git merge --no-ff stage/<issue-id>-<short-slug>
git branch -d stage/<issue-id>-<short-slug>
git push origin dev
```

## Commit Messages

Commit messages must follow the pattern already present in the repository history:

```text
<type>/<area>: <summary>; <issue action> issue_<id>
```

Use lowercase English messages.

Valid commit types:

| Type | Use when |
|---|---|
| `feat` | Adds or changes product functionality. |
| `fix` | Fixes broken behavior. |
| `chore` | Changes repository setup, build tooling, dependencies, release plumbing, or maintenance files. |
| `test` | Adds or changes tests. |
| `docs` | Changes documentation only. |
| `refactor` | Changes implementation structure without changing behavior. |
| `perf` | Improves performance without changing public behavior. |
| `ci` | Changes CI or automation. |
| `build` | Changes build packaging, outputs, or bundling. |
| `revert` | Reverts a previous commit. |

Areas should be short and specific:

```text
repo
core
svg
layout
remark
markdown-it
astro
cli
docker
test
docs
release
structure
```

Good examples:

```text
feat/core: add core parser; implements issue_450865505
chore/repo: add setup for workspace; close issue_510740867
feat/structure: add file structure
fix/svg: escape label text; close issue_510741220
test/core: cover invalid edge references; implements issue_510741301
```

Do not use typos in commit types. If history contains `eat/core`, treat it as a typo and use `feat/core` going forward.

For work that completes an issue, prefer:

```text
<type>/<area>: <summary>; close issue_<id>
```

For partial work that contributes to an issue, use:

```text
<type>/<area>: <summary>; implements issue_<id>
```

If the repository also needs GitHub auto-closing behavior, include the GitHub issue number in the commit body or pull request body using:

```text
Closes #<number>
```

## Development Sequence

Follow this sequence for every change:

1. Confirm or create the issue.
2. Attach the issue to the release milestone.
3. Create a local stage branch from `dev`.
4. Implement only the issue scope.
5. Keep final source code free of comments.
6. Run formatting, checks, tests, build, and verification inside Docker.
7. Commit using the required format.
8. Merge the stage branch into `dev`.
9. Push `dev`.
10. Close the issue when all acceptance criteria are satisfied.

## Testing Requirements

Every behavior change must include tests. A change is not complete until the relevant test layer passes inside Docker.

Required test layers:

| Layer | Required coverage |
|---|---|
| Unit | Parser, AST normalization, validation, text escaping, layout helpers, theme resolution. |
| Snapshot | Deterministic SVG output for each supported diagram type. |
| Integration | Remark plugin, markdown-it plugin, Astro integration, asset mode, inline mode. |
| CLI | Success paths, failure paths, invalid inputs, output paths, exit codes. |
| Security | Unsafe text, HTML injection, script injection, external resource prevention. |
| Accessibility | SVG title, description, role, readable structure, non-color-only semantics. |
| Example builds | Repository examples must build successfully through Docker. |

Minimum validation before merge:

```bash
docker compose run --rm app npm run check
docker compose run --rm app npm run test
docker compose run --rm app npm run build
docker compose run --rm app npm run verify
```

If any command fails, do not merge.

## Source Code Comments Policy

Final source code must not contain comments.

This applies to:

- TypeScript files
- JavaScript files
- Astro files
- CSS files
- Shell scripts
- Configuration files where comments are optional
- Test files
- Example source files

Avoid:

```text
// line comments
/* block comments */
# shell comments
<!-- HTML comments -->
```

Documentation files may use prose, headings, lists, and examples. Source code should be self-explanatory through names, structure, types, and tests.

## Documentation Policy

Public documentation must be written in English and be understandable by developers who are new to the project.

The root `README.md` should explain:

- What MSVG is
- Why it exists
- How to install it
- How to use it in Markdown
- How to use it with Astro
- How to use the CLI
- How to run the Docker workflow
- How to read common errors

### Where documentation lives

MSVG keeps documentation in two separate homes. Knowing which one to use keeps public docs clean and private notes out of the published packages.

| Home | Audience | What goes here | Versioned? | Published? |
|---|---|---|---|---|
| `README.md` and package `README.md` files | Users of MSVG | What the project is, installation, usage, examples, supported diagrams, accessibility, security | Yes | Yes, on npm and GitHub |
| `/specs` | Maintainers and agents working on MSVG | Implementation plans, architecture drafts, local agent prompts, session handoffs, internal planning, temporary notes | No | No |

### The `/specs` rule

`/specs` is for local development notes only. It is intentionally ignored by Git and is never published.

- `/specs` is listed in `.gitignore`, so its files are not tracked.
- Do not commit anything under `/specs`. If you run `git status` and see `/specs` files, leave them untracked.
- Do not move private or internal notes from `/specs` into public documentation. Internal planning, drafts, and agent prompts stay local.
- When you want users to read something, write it in `README.md` or a package `README.md`, not in `/specs`.

You can confirm that `/specs` is ignored at any time:

```bash
git check-ignore -v specs
```

If that command prints a `.gitignore` rule, the directory is correctly ignored and safe to use for private notes.

## Pull Requests

If pull requests are used, each pull request must:

- Target `dev`
- Reference the issue
- Reference the release milestone
- Include a summary of changes
- Include Docker validation output
- Avoid unrelated changes
- Avoid final source code comments

Pull request title format:

```text
<type>/<area>: <summary>
```

Pull request body template:

```md
## Summary

- 

## Issue

Implements issue_<id>

## Validation

- [ ] `docker compose run --rm app npm run check`
- [ ] `docker compose run --rm app npm run test`
- [ ] `docker compose run --rm app npm run build`
- [ ] `docker compose run --rm app npm run verify`

## Checklist

- [ ] Scope matches the issue
- [ ] Tests were added or updated
- [ ] Documentation was updated when needed
- [ ] Final source code contains no comments
- [ ] No project command was run directly on the host
```

## Release Workflow

A release can be prepared only when every issue in the milestone is closed and the Docker verification gate passes.

Release steps:

1. Confirm all milestone issues are closed.
2. Confirm `dev` contains all release changes.
3. Run the full verification suite inside Docker.
4. Update versions and changelog.
5. Create the release commit.
6. Merge `dev` into the release target branch.
7. Tag the release.
8. Publish packages through the approved npm release process.

Release commit example:

```text
chore/release: prepare 0.1.0; close issue_<id>
```

Tag format:

```text
v0.1.0
```

## Review Checklist

Before closing an issue or merging a branch, verify:

- [ ] The issue exists and has the correct type.
- [ ] The issue belongs to the correct milestone.
- [ ] The branch was created from `dev`.
- [ ] The implementation only covers the issue scope.
- [ ] The commit message follows `<type>/<area>: <summary>; <issue action> issue_<id>`.
- [ ] All commands were run inside Docker.
- [ ] Tests were added or updated.
- [ ] `npm run verify` passes inside Docker.
- [ ] Final source code contains no comments.
- [ ] Public docs are in English.
- [ ] Development-only docs are kept out of version control.

## Maintainer Notes

Prefer small, traceable changes over large unreviewable commits. The issue, branch, commit, tests, and release milestone should tell the same story from planning to delivery.
