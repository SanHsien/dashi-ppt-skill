"""A machine without `gh` gets the documented "not checked" answer."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import check_upstream_updates as upstream  # noqa: E402


def test_missing_gh_is_reported_as_unavailable_not_a_crash(monkeypatch) -> None:
    """`collect_new_tickets` promises None when gh cannot answer; no gh raised instead."""

    def no_gh(*_args, **_kwargs):
        raise FileNotFoundError("gh")

    monkeypatch.setattr(subprocess, "run", no_gh)
    baseline = {"repo": "https://github.com/chuspeeism/dashi-ppt-skill.git"}
    assert upstream.collect_new_tickets(baseline, "pr") is None
