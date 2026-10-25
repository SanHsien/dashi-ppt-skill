"""Frontmatter parsing edge cases: BOM, `---` inside a value, block scalars."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import validate_skills  # noqa: E402


def _skill(tmp_path: Path, body: str) -> Path:
    skill_dir = tmp_path / "dashi-ppt"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_bytes(body.encode("utf-8"))
    return skill_dir


def test_utf8_bom_does_not_hide_the_frontmatter(tmp_path: Path) -> None:
    """Windows editors save a BOM; that is not a missing frontmatter."""
    body = "\ufeff---\nname: dashi-ppt\ndescription: Use when building decks.\n---\n"
    errors, _ = validate_skills.audit_skill(_skill(tmp_path, body))
    assert errors == []


def test_triple_dash_inside_a_value_does_not_end_the_frontmatter(tmp_path: Path) -> None:
    """A top-level version after a `---` inside the description was never seen."""
    body = (
        "---\nname: dashi-ppt\ndescription: Use for decks --- fast ones.\n"
        "version: 1.0\n---\n\n# Deck\n"
    )
    errors, _ = validate_skills.audit_skill(_skill(tmp_path, body))
    assert any("version" in item for item in errors)


def test_block_scalar_description_is_read_as_its_text() -> None:
    """`description: >` followed by text is a real description, not the one char `>`."""
    frontmatter = validate_skills.extract_frontmatter(
        "---\nname: dashi-ppt\ndescription: >\n  Use when building decks and\n"
        "  slides for the user.\nmetadata:\n  x: 1\n---\n"
    )
    assert validate_skills.field_value(frontmatter, "description") == (
        "Use when building decks and slides for the user."
    )
