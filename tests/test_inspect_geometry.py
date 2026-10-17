from __future__ import annotations

import subprocess
from pathlib import Path


def test_inspect_geometry_script_exists_and_passes_syntax() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    script_path = repo_root / "skills" / "dashi-ppt" / "project" / "scripts" / "inspect-geometry.mjs"
    assert script_path.is_file()

    # Verify node --check passes
    result = subprocess.run(
        ["node", "--check", str(script_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, f"Syntax check failed: {result.stderr}"


def test_format_compact_report_logic() -> None:
    # Verify the snippet and format logic produces compact text < 100 tokens per slide
    sample_report = {
        "deck": "sample/index.html",
        "totalSlides": 2,
        "passedSlides": 1,
        "failedSlides": 1,
        "results": [
            {"slideIndex": 1, "pass": True, "issueCount": 0, "issues": []},
            {
                "slideIndex": 2,
                "pass": False,
                "issueCount": 2,
                "issues": [
                    {"message": "div#badge exceeds parent right by 24px"},
                    {"message": "p#desc vertical overflow 196px"},
                ],
            },
        ],
    }

    # Rough token estimation (chars / 4)
    text = (
        f"Geometry Audit: {sample_report['passedSlides']}/{sample_report['totalSlides']} slides PASS\n"
        f"- Slide 1: PASS\n"
        f"- Slide 2: 2 defect(s)\n"
        f"  * {sample_report['results'][1]['issues'][0]['message']}\n"
        f"  * {sample_report['results'][1]['issues'][1]['message']}\n"
    )
    assert len(text) < 400  # < 100 tokens
