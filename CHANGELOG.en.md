English | [中文版](CHANGELOG.md)

# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), newest first.
This file records **the maintenance history of this fork only** (from 2026-09-04).
Product evolution belongs to upstream
[`chuspeeism/dashi-ppt-skill`](https://github.com/chuspeeism/dashi-ppt-skill);
see its own history and the review ledger in [`docs/UPSTREAM.md`](docs/UPSTREAM.md).
Per-commit adopt/skip reasoning lives in [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## 2026-09-04 (fork overlay established)

Forked at upstream `7cb2334` (`Publish skill v0.4.11`, 2026-07-30). **The product is unchanged**:
`skills/`, `npm-dist/`, and `.claude-plugin/` match upstream.

### Added

- **Traditional Chinese entry point.** `README.md` is now Traditional Chinese; the upstream Simplified Chinese original is preserved verbatim as `README.zh-CN.md`, English stays in `README.en.md`, and the three cross-link.
- **AI maintenance source of truth.** `AGENTS.md` (single source) and `CLAUDE.md` (thin patch).
- **Fork and licensing boundaries.** `FORK.md` and `NOTICE.md` — stating explicitly that upstream is AGPL-3.0 (not MIT) and that `skills/dashi-ppt/project/packages/html-deck-to-pptx` is a proprietary component that must not be extracted.
- **Windows development gate.** `tools/dev_check.ps1`: compileall → ruff (E9+F) → pytest → skill validation → `node --check` over every tracked JS file → relative-link check of maintenance docs.
- **Upstream tracking.** `tools/check_upstream_updates.py` plus `tools/upstream_baseline.json`, with independent watermarks for commits, pull requests, and issues. It fails closed when `gh` cannot answer, so "not checked" never reads as "nothing to review".
- **Dependency freshness.** `tools/check_dependency_freshness.py`: declared ranges compared against PyPI, with `freshness-hold:` and self-expiring `.github/dependency-deferrals.json` entries.
- **CI and automation.** `ci.yml` (Ubuntu 3.9–3.14 plus Windows 3.14 running the canonical gate), `codeql.yml`, `upstream-check.yml` (weekly), `dependency-freshness.yml` (monthly), `dependabot.yml`.
- **Tests.** `tests/`: skill frontmatter, plugin manifest, bilingual cross-links, document links, CI/pyproject flag agreement, git-symlink guard, and behaviour locks for the upstream and dependency checkers.
- **Policy docs.** `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `REVIEW.md`, and `docs/` (DEVELOPMENT / UPSTREAM / DECISIONS / SKILL-SPEC).
- **Version-control hygiene.** Root `.gitignore`, `.gitattributes` (`* text=auto eol=lf`), `.editorconfig`, `.python-version`, `pyproject.toml` (tool configuration only), `requirements-dev.txt`.
- **Fork PR boundary.** `.cursor/rules/no-upstream-pr.mdc`.
