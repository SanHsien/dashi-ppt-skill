from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))

import check_links  # noqa: E402
import validate_skills  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def test_every_skill_directory_has_valid_frontmatter() -> None:
    skill_dirs = validate_skills.iter_skill_dirs()
    assert [path.name for path in skill_dirs] == ["dashi-ppt"]
    failures = []
    for skill_dir in skill_dirs:
        errors, _warnings = validate_skills.audit_skill(skill_dir)
        if errors:
            failures.append(f"{skill_dir.name}: {errors}")
    assert failures == []


def test_plugin_manifest_still_points_at_the_product_skill() -> None:
    marketplace = ROOT / ".claude-plugin" / "marketplace.json"
    assert marketplace.is_file()
    manifest = json.loads(marketplace.read_text(encoding="utf-8"))
    plugins = manifest["plugins"]
    assert [plugin["name"] for plugin in plugins] == ["dashi-ppt"]
    assert plugins[0]["skills"] == ["./skills/dashi-ppt"]


def test_product_generator_entry_points_exist() -> None:
    """The public install path and the export scripts are compatibility contracts."""
    assert (ROOT / "npm-dist" / "install.mjs").is_file()
    package = json.loads(
        (ROOT / "skills" / "dashi-ppt" / "project" / "package.json").read_text(
            encoding="utf-8"
        )
    )
    for script in ("export:pptx", "export:pdf", "preview:start"):
        assert script in package["scripts"], script


def test_proprietary_export_engine_keeps_its_own_license() -> None:
    """Deleting or relicensing this file would misstate what the fork may ship."""
    engine_license = (
        ROOT
        / "skills"
        / "dashi-ppt"
        / "project"
        / "packages"
        / "html-deck-to-pptx"
        / "LICENSE"
    )
    assert engine_license.is_file()
    assert "roprietary" in engine_license.read_text(encoding="utf-8")

    notice = (ROOT / "NOTICE.md").read_text(encoding="utf-8")
    assert "html-deck-to-pptx" in notice
    assert "AGPL-3.0" in notice
    assert "MIT" not in notice.split("## Proprietary component")[0]


def test_security_exception_floor_still_holds() -> None:
    """The one product-tree change this fork owns: esbuild >= 0.28.1.

    GHSA-g7r4-m6w7-qqqr lets the esbuild dev server read arbitrary files on
    Windows, and this is a Windows-first fork whose preview server is reachable
    from the LAN by default. An upstream sync that restores the old lockfile
    would silently undo the fix, so the floor is asserted rather than trusted.
    """
    lock = json.loads(
        (ROOT / "skills" / "dashi-ppt" / "project" / "package-lock.json").read_text(
            encoding="utf-8"
        )
    )
    version = lock["packages"]["node_modules/esbuild"]["version"]
    parts = tuple(int(part) for part in version.split(".")[:3])
    assert parts >= (0, 28, 1), f"esbuild {version} is below the security floor"


def test_maintainer_markdown_links_resolve() -> None:
    failures = 0
    for path in check_links.iter_documents():
        problems = check_links.check_document(path)
        failures += len(problems)
        for problem in problems:
            print(f"{path}: {problem}")
    assert failures == 0


def test_ci_covers_python_314() -> None:
    workflow = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    assert '"3.14"' in workflow
    assert "windows / py3.14" in workflow


def test_issue_contact_links_point_at_this_fork() -> None:
    text = (ROOT / ".github" / "ISSUE_TEMPLATE" / "config.yml").read_text(
        encoding="utf-8"
    )
    assert "SanHsien/dashi-ppt-skill/blob/main/CONTRIBUTING.md" in text
    assert "chuspeeism/dashi-ppt-skill/issues" in text


def test_public_readmes_are_a_three_way_set() -> None:
    """繁中主檔、英文鏡像、上游簡中原檔，三者互相連結。"""
    zh_tw = (ROOT / "README.md").read_text(encoding="utf-8")
    en = (ROOT / "README.en.md").read_text(encoding="utf-8")
    zh_cn = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")

    assert "README.en.md" in zh_tw and "README.zh-CN.md" in zh_tw
    assert "README.md" in en and "README.zh-CN.md" in en
    assert "README.md" in zh_cn and "README.en.md" in zh_cn


def test_readme_keeps_credit_without_author_promotion() -> None:
    zh_tw = (ROOT / "README.md").read_text(encoding="utf-8")
    banned = ("star-history.com", "Star History")
    for needle in banned:
        assert needle not in zh_tw, f"README.md still carries {needle}"
    assert "chuspeeism/dashi-ppt-skill" in zh_tw
    assert "NOTICE.md" in zh_tw
    assert "AGPL-3.0" in zh_tw
    assert "SanHsien/dashi-ppt-skill" in zh_tw
    assert "npx dashi-ppt-skill@latest" in zh_tw


def test_bilingual_pairs_cross_link_each_other() -> None:
    for zh_name, en_name in (
        ("README.md", "README.en.md"),
        ("CHANGELOG.md", "CHANGELOG.en.md"),
    ):
        zh = ROOT / zh_name
        en = ROOT / en_name
        assert zh.is_file(), f"missing {zh_name}"
        assert en.is_file(), f"missing {en_name}"
        assert en_name in zh.read_text(encoding="utf-8"), f"{zh_name} does not link {en_name}"
        assert zh_name in en.read_text(encoding="utf-8"), f"{en_name} does not link {zh_name}"


def test_changelog_records_fork_history_not_upstream_product_history() -> None:
    text = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    assert "docs/UPSTREAM.md" in text
    assert "docs/DECISIONS.md" in text
    assert "chuspeeism/dashi-ppt-skill" in text


def test_tool_config_matches_ci_flags() -> None:
    pyproject = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    ci = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    assert 'target-version = "py39"' in pyproject
    assert "--target-version py39" in ci
    assert 'select = ["E9", "F"]' in pyproject
    assert "--select E9,F" in ci
    assert not re.search(r"^\[project\]", pyproject, re.M)
    assert not re.search(r"^\[build-system\]", pyproject, re.M)


def test_line_endings_are_pinned_to_lf() -> None:
    attrs = (ROOT / ".gitattributes").read_text(encoding="utf-8")
    assert "* text=auto eol=lf" in attrs
    for suffix in ("*.md", "*.py", "*.ps1", "*.js", "*.mjs"):
        assert suffix in attrs


def test_gitignore_covers_secrets_reports_and_generated_decks() -> None:
    text = (ROOT / ".gitignore").read_text(encoding="utf-8")
    for needle in (".env", ".venv/", "upstream-review-report.md", "node_modules/", "output/"):
        assert needle in text, needle


def test_review_md_is_a_risk_snapshot() -> None:
    review = (ROOT / "REVIEW.md").read_text(encoding="utf-8")
    agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
    assert "Windows-first" in review
    assert "R-01" in review
    assert "風險快照" in agents
    assert "`REVIEW.md`" in agents


def test_fork_pr_boundary_is_machine_readable() -> None:
    rule = (ROOT / ".cursor" / "rules" / "no-upstream-pr.mdc").read_text(encoding="utf-8")
    assert "alwaysApply: true" in rule
    assert "SanHsien/dashi-ppt-skill" in rule


def test_tracked_files_are_not_git_symlinks() -> None:
    result = subprocess.run(
        ["git", "ls-files", "-s"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    symlinks = [
        line.split("\t", 1)[-1]
        for line in result.stdout.splitlines()
        if line.startswith("120000 ")
    ]
    assert symlinks == [], f"git symlink 會讓 Windows checkout 失敗: {symlinks}"


def test_check_links_rejects_path_outside_repo(tmp_path: Path) -> None:
    doc = tmp_path / "note.md"
    doc.write_text("[here](.)\n", encoding="utf-8")
    problems = check_links.check_document(doc)
    assert any("逃出" in item for item in problems)
