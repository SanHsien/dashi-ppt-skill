from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import validate_skills  # noqa: E402


def test_audit_flags_missing_skill_file(tmp_path: Path) -> None:
    skill_dir = tmp_path / "dashi-ppt"
    skill_dir.mkdir()
    errors, _warnings = validate_skills.audit_skill(skill_dir)
    assert errors
    assert "Missing SKILL.md" in errors[0]


def test_audit_flags_name_mismatch(tmp_path: Path) -> None:
    skill_dir = tmp_path / "dashi-ppt"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text(
        "---\nname: other-skill\ndescription: Use when building decks.\n---\n\n# Deck\n",
        encoding="utf-8",
    )
    errors, _warnings = validate_skills.audit_skill(skill_dir)
    assert any("Name mismatch" in item for item in errors)


def test_audit_flags_top_level_version(tmp_path: Path) -> None:
    """`version` belongs under `metadata:`; upstream bumps it on every release."""
    skill_dir = tmp_path / "dashi-ppt"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text(
        "---\nname: dashi-ppt\ndescription: Use when building decks.\nversion: 0.4.11\n---\n",
        encoding="utf-8",
    )
    errors, _warnings = validate_skills.audit_skill(skill_dir)
    assert any("version" in item for item in errors)


def test_audit_accepts_the_shipped_skill(tmp_path: Path) -> None:
    skill_dir = tmp_path / "dashi-ppt"
    skill_dir.mkdir()
    (skill_dir / "SKILL.md").write_text(
        '---\nname: dashi-ppt\ndescription: "Use when the user mentions PPT."\n---\n\n# Deck\n',
        encoding="utf-8",
    )
    errors, warnings = validate_skills.audit_skill(skill_dir)
    assert errors == []
    assert warnings == []
