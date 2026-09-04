from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import check_dependency_freshness as checker  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def test_declared_dependencies_are_readable() -> None:
    packages = checker.load_direct_dependencies()
    names = {package["name"].lower() for package in packages}
    assert {"pytest", "ruff"} <= names


def test_comparison_happens_at_the_declared_precision() -> None:
    """`>=10` says nothing about the minor, so 10.4.0 is not a finding."""
    assert not checker.is_newer_version("10.4.0", "10")
    assert checker.is_newer_version("11.0.0", "10")
    assert checker.is_newer_version("0.17.1", "0.16")
    assert not checker.is_newer_version("0.16.4", "0.16")


def test_hold_marker_is_parsed_off_the_declaring_line() -> None:
    packages = checker.parse_requirements(
        "pytest>=8.3.0  # freshness-hold: CI still tests 3.9\nruff>=0.16\n",
        "requirements-dev.txt",
    )
    holds = {package["name"]: package["hold"] for package in packages}
    assert holds["pytest"]
    assert holds["ruff"] == ""


def test_a_held_floor_is_not_reported_as_work() -> None:
    row = {"outdated": True, "hold": "CI still tests 3.9", "deferred_reason": ""}
    assert not checker.needs_review(row)
    assert checker.needs_review({"outdated": True, "hold": "", "deferred_reason": ""})


def test_deferral_without_reviewed_release_is_ignored(tmp_path: Path) -> None:
    """A deferral must expire by itself, so `deferredLatest` is mandatory."""
    path = tmp_path / "deferrals.json"
    path.write_text(
        '{"deferrals": {"ruff": {"reason": "later"}, '
        '"pytest": {"deferredLatest": "9.0.0", "reason": "needs py3.10"}}}',
        encoding="utf-8",
    )
    deferrals = checker.load_deferrals(path)
    assert "ruff" not in deferrals
    assert deferrals["pytest"][0] == "9.0.0"


def test_report_renders_a_check_failure() -> None:
    report = checker.render_markdown([], error="missing requirements file")
    assert "Check failed" in report
    assert "missing requirements file" in report


def test_workflow_is_scheduled_and_fails_when_maintenance_is_due() -> None:
    workflow = (
        ROOT / ".github" / "workflows" / "dependency-freshness.yml"
    ).read_text(encoding="utf-8")
    assert "schedule:" in workflow
    assert "workflow_dispatch:" in workflow
    assert "tools/check_dependency_freshness.py" in workflow
    assert "exit 1" in workflow


def test_dependabot_watches_pip_and_actions() -> None:
    config = (ROOT / ".github" / "dependabot.yml").read_text(encoding="utf-8")
    assert 'package-ecosystem: "pip"' in config
    assert 'package-ecosystem: "github-actions"' in config
    assert 'package-ecosystem: "npm"' in config
