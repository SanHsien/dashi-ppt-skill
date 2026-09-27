from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import check_upstream_updates as checker  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def test_baseline_file_is_valid_and_complete() -> None:
    baseline = checker.load_baseline()

    assert baseline["repo"].endswith("dashi-ppt-skill.git")
    assert "chuspeeism" in baseline["repo"]
    assert baseline["branch"] == "main"
    assert len(baseline["reviewed_through"]) == 40
    assert baseline["reviewed_date"]


def test_baseline_tracks_all_three_axes() -> None:
    """Commits are not the only place upstream work shows up."""
    baseline = json.loads(
        (ROOT / "tools" / "upstream_baseline.json").read_text(encoding="utf-8")
    )
    assert "reviewed_pr_through" in baseline
    assert "reviewed_issue_through" in baseline


def test_workflow_is_scheduled_and_fails_on_unreviewed_commits() -> None:
    workflow = (
        ROOT / ".github" / "workflows" / "upstream-check.yml"
    ).read_text(encoding="utf-8")

    assert "schedule:" in workflow
    assert "cron:" in workflow
    assert "workflow_dispatch:" in workflow
    assert "tools/check_upstream_updates.py" in workflow
    assert "fetch-depth: 0" in workflow
    assert "GH_TOKEN" in workflow
    assert "exit 1" in workflow


def test_render_markdown_reports_no_new_commits() -> None:
    baseline = {
        "repo": "https://example.invalid/upstream.git",
        "branch": "main",
        "reviewed_through": "a" * 40,
        "reviewed_date": "2026-09-04",
    }

    report = checker.render_markdown(baseline, [])

    assert "No new upstream commits" in report


def test_render_markdown_distinguishes_unchecked_from_clean() -> None:
    """`None` means gh could not answer; it must not read as "nothing to review"."""
    baseline = {
        "repo": "https://example.invalid/upstream.git",
        "branch": "main",
        "reviewed_through": "a" * 40,
        "reviewed_date": "2026-09-04",
    }

    report = checker.render_markdown(baseline, [], prs=None, issues=[])

    assert "Not checked" in report
    assert "No new items above that number." in report


def test_render_markdown_surfaces_check_failure() -> None:
    baseline = {
        "repo": "https://example.invalid/upstream.git",
        "branch": "main",
        "reviewed_through": "a" * 40,
        "reviewed_date": "2026-09-04",
    }

    report = checker.render_markdown(baseline, [], error="git fetch failed")

    assert "Check failed" in report
    assert "git fetch failed" in report


def test_upstream_slug_extracts_owner_and_name() -> None:
    assert (
        checker.upstream_slug("https://github.com/chuspeeism/dashi-ppt-skill.git")
        == "chuspeeism/dashi-ppt-skill"
    )
    assert checker.upstream_slug("https://example.invalid/thing.git") is None


def test_load_baseline_rejects_missing_file(tmp_path: Path) -> None:
    with pytest.raises(checker.UpstreamCheckError):
        checker.load_baseline(tmp_path / "nope.json")


def test_baseline_matches_decisions_record() -> None:
    baseline = json.loads(
        (ROOT / "tools" / "upstream_baseline.json").read_text(encoding="utf-8")
    )
    decisions = (ROOT / "docs" / "DECISIONS.md").read_text(encoding="utf-8")
    upstream_doc = (ROOT / "docs" / "UPSTREAM.md").read_text(encoding="utf-8")

    assert baseline["reviewed_date"] in decisions
    assert baseline["reviewed_through"][:7] in upstream_doc
