"""Markdown link forms the link checker must not misread."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import check_links  # noqa: E402


def _check(tmp_path: Path, monkeypatch, text: str) -> list[str]:
    (tmp_path / "other.md").write_text("x", encoding="utf-8")
    doc = tmp_path / "doc.md"
    doc.write_text(text, encoding="utf-8")
    monkeypatch.setattr(check_links, "ROOT", tmp_path.resolve())
    return check_links.check_document(doc)


def test_markdown_link_title_is_not_part_of_the_path(tmp_path: Path, monkeypatch) -> None:
    assert _check(tmp_path, monkeypatch, '[see](other.md "Other doc")\n') == []


def test_links_inside_code_fences_and_spans_are_not_checked(tmp_path: Path, monkeypatch) -> None:
    text = "```md\n[example](gone.md)\n```\nuse `[x](gone.md)` syntax\n"
    assert _check(tmp_path, monkeypatch, text) == []


def test_a_real_broken_link_is_still_reported(tmp_path: Path, monkeypatch) -> None:
    problems = _check(tmp_path, monkeypatch, "[x](gone.md) and [y](other.md)\n")
    assert len(problems) == 1 and "gone.md" in problems[0]
