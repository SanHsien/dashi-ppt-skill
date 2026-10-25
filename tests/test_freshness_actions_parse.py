"""Workflow `uses:` parsing must not read across line breaks."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import check_dependency_freshness as freshness  # noqa: E402


def test_comment_on_the_next_line_is_not_taken_as_the_actions_version() -> None:
    """A regex whitespace class matched the newline and adopted the next line's comment."""
    text = (
        "      - uses: actions/checkout@v4\n"
        "        # 3 retries are configured below\n"
        "        with:\n"
        "          persist-credentials: false\n"
    )
    [package] = freshness.parse_workflow_actions(text, "ci.yml")
    assert package["minimum"] == "4"
    assert package["hold"] == ""


def test_hold_comment_on_the_next_line_does_not_hold_the_action() -> None:
    text = (
        "      - uses: actions/checkout@v4\n"
        "      # freshness-hold: belongs to the step below\n"
        "      - uses: actions/setup-python@v5\n"
    )
    held = {p["name"]: p["hold"] for p in freshness.parse_workflow_actions(text, "ci.yml")}
    assert held == {"actions/checkout": "", "actions/setup-python": ""}


def test_crlf_workflow_still_reads_the_pinned_version_comment() -> None:
    text = "      - uses: actions/checkout@" + "a" * 40 + " # v7.0.1\r\n      - run: x\r\n"
    [package] = freshness.parse_workflow_actions(text, "ci.yml")
    assert package["minimum"] == "7.0.1"
