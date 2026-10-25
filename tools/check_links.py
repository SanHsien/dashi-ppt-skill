#!/usr/bin/env python3
"""檢查維護文件之間的相對連結。

本 fork 的公開入口互相連來連去：README、FORK、NOTICE、AGENTS 與 docs。
文件被重新定位或改名時，這些連結會靜靜斷掉。只驗相對連結；外部網址交給人看。
不掃 skills/ 與 npm-dist/：那些是上游產品，每次同步都會變。

    python tools/check_links.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
LINK_PATTERN = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
IMAGE_PATTERN = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
HTML_SRC_PATTERN = re.compile(r"""(?is)<img[^>]+src=["']([^"']+)["']""")
INLINE_CODE_PATTERN = re.compile(r"`[^`\n]*`")
SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:", "#")

SKIP_NAMES = {
    "upstream-review-report.md",
    "dependency-freshness-report.md",
}


def iter_documents() -> list[Path]:
    documents = []
    documents.extend(ROOT.glob("*.md"))
    documents.extend((ROOT / "docs").glob("*.md"))
    github = ROOT / ".github"
    if github.is_dir():
        documents.extend(github.rglob("*.md"))
    return sorted(
        path
        for path in documents
        if path.is_file() and path.name not in SKIP_NAMES
    )


def _strip_code(text: str) -> str:
    """Drop fenced blocks and inline code spans: links shown as examples are not links."""
    kept: list[str] = []
    fence = ""
    for line in text.splitlines():
        marker = line.lstrip()[:3]
        if fence:
            if marker == fence:
                fence = ""
            continue
        if marker in ("```", "~~~"):
            fence = marker
            continue
        kept.append(INLINE_CODE_PATTERN.sub("", line))
    return "\n".join(kept)


def _link_destination(target: str) -> str:
    """`path "title"` -> `path`; `<a path> "title"` -> `a path`."""
    target = target.strip()
    if target.startswith("<") and ">" in target:
        return target[1:target.index(">")]
    return target.split(None, 1)[0] if target else target


def _missing_relative(path: Path, target: str) -> str | None:
    target = _link_destination(target)
    if not target or target.startswith(SKIP_PREFIXES):
        return None
    file_part = unquote(target.split("#", 1)[0])
    if not file_part:
        return None
    resolved = (path.parent / file_part).resolve()
    if not resolved.is_relative_to(ROOT):
        return f"{target} → 連結逃出 repo 根目錄"
    if resolved.exists():
        return None
    try:
        shown = resolved.relative_to(ROOT)
    except ValueError:
        shown = resolved
    return f"{target} → 找不到 {shown}"


def check_document(path: Path) -> list[str]:
    problems: list[str] = []
    text = _strip_code(path.read_text(encoding="utf-8"))
    for pattern in (LINK_PATTERN, IMAGE_PATTERN, HTML_SRC_PATTERN):
        for match in pattern.finditer(text):
            missing = _missing_relative(path, match.group(1))
            if missing:
                problems.append(missing)
    return problems


def main() -> int:
    documents = iter_documents()
    if not documents:
        print("找不到任何維護用 Markdown 檔")
        return 1

    failures = 0
    for path in documents:
        problems = check_document(path)
        rel = path.relative_to(ROOT)
        if problems:
            failures += 1
            for problem in problems:
                print(f"FAIL {rel}: {problem}")
        else:
            print(f"OK   {rel}")

    print(f"\n共 {len(documents)} 份維護文件，{failures} 份有缺檔。")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
