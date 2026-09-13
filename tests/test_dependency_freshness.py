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


def test_pinned_actions_are_parsed_with_their_declared_version() -> None:
    """A SHA pin carries its version in the trailing `# vX.Y.Z` comment."""
    text = (
        "jobs:\n"
        "  test:\n"
        "    steps:\n"
        "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1\n"
        "      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0\n"
    )

    by_name = {p["name"]: p for p in checker.parse_workflow_actions(text, "ci.yml")}

    assert by_name["actions/checkout"]["minimum"] == "7.0.1"
    assert by_name["actions/checkout"]["source"] == "ci.yml"
    assert by_name["actions/checkout"]["kind"] == "github-action"
    assert by_name["actions/setup-node"]["minimum"] == "7.0.0"


def test_subdirectory_actions_are_tracked_and_resolved_to_their_repository() -> None:
    """`github/codeql-action/init` is an action; its releases live on the repo."""
    text = (
        "      - uses: github/codeql-action/init@f205ea1c3313d32999d8d6a48b4f6530d4437b38"
        " # v4.37.4\n"
    )

    packages = checker.parse_workflow_actions(text, "codeql.yml")

    assert packages[0]["name"] == "github/codeql-action/init"
    assert packages[0]["minimum"] == "4.37.4"
    assert checker.action_repository(packages[0]["name"]) == "github/codeql-action"
    assert checker.action_repository("actions/checkout") == "actions/checkout"


def test_codeql_pins_are_in_the_real_report() -> None:
    """Regression guard: the owner/repo-only pattern skipped every CodeQL pin."""
    names = {action["name"] for action in checker.load_workflow_actions()}

    assert any(name.startswith("github/codeql-action/") for name in names)


def test_an_uncomparable_latest_is_a_failed_check_not_an_ok() -> None:
    """`codeql-bundle-v2.26.4` shares no numbering with the pinned `v4.37.4`."""
    packages = checker.parse_workflow_actions(
        "      - uses: github/codeql-action/init@f205ea1c # v4.37.4\n", "codeql.yml"
    )

    rows = checker.collect_status(
        packages, lambda _name: "codeql-bundle-v2.26.4", deferrals={}
    )

    assert rows[0]["check_failed"] is True
    assert "CHECK FAILED" in checker.render_markdown([], rows)


def test_action_hold_marker_is_read_off_the_uses_line() -> None:
    text = (
        "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1"
        " # freshness-hold: pinned for a documented reason\n"
    )

    packages = checker.parse_workflow_actions(text, "ci.yml")

    assert packages[0]["hold"] == "pinned for a documented reason"
    assert packages[0]["minimum"] == ""


def test_leading_v_is_stripped_when_comparing_action_tags() -> None:
    assert checker.is_newer_version("v7.1.0", "7.0.1")
    assert not checker.is_newer_version("v7.0.1", "7.0.1")


def test_this_repo_pins_every_action_it_uses() -> None:
    """Real workflows, not a fixture: an unpinned action would leave `minimum` empty."""
    actions = checker.load_workflow_actions()

    assert len(actions) >= 3
    assert all(action["minimum"] or action["hold"] for action in actions)
    assert any(action["name"] == "actions/checkout" for action in actions)


def test_report_has_a_section_for_each_declaration_source() -> None:
    """Actions drift was invisible while the report only had a PyPI table."""
    report = checker.render_markdown([], [])

    assert "## Python dev dependencies (PyPI)" in report
    assert "## GitHub Actions (pinned in .github/workflows/)" in report


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


def test_a_token_is_sent_when_the_environment_has_one(monkeypatch) -> None:
    """Anonymous api.github.com is 60/hour and hosted runners share it."""
    seen: dict[str, str] = {}

    class _Response:
        def __enter__(self):
            return self

        def __exit__(self, *_exc) -> None:
            return None

        def read(self) -> bytes:
            return b'{"tag_name": "v7.0.1"}'

    def fake_urlopen(request, timeout=None):  # noqa: ARG001
        seen.update(request.headers)
        return _Response()

    monkeypatch.setattr(checker.urllib.request, "urlopen", fake_urlopen)

    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    monkeypatch.delenv("GH_TOKEN", raising=False)
    assert checker.fetch_github_release("actions/checkout") == "7.0.1"
    assert not any(key.lower() == "authorization" for key in seen)

    seen.clear()
    monkeypatch.setenv("GITHUB_TOKEN", "secret-token")
    checker.fetch_github_release("actions/checkout")
    authorization = next(value for key, value in seen.items() if key.lower() == "authorization")
    assert authorization == "Bearer secret-token"
