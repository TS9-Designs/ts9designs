#!/usr/bin/env python3
"""
Inline the homepage's critical CSS.

index.html carries copies of a few small stylesheets inside marked <style>
blocks so the first paint doesn't wait on separate CSS requests:

    <style data-inline="/assets/css/tokens.css">...</style>

The source files stay the single place to edit. After changing any of them,
run from the repo root:

    python3 tools/inline-css.py          # refresh the copies
    python3 tools/inline-css.py --check  # exit 1 if a copy is out of date

Comments and extra whitespace are removed from the copies; nothing else is
changed, so the CSS behaves exactly as the linked file would.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["index.html"]
BLOCK = re.compile(r'(<style data-inline="(?P<src>[^"]+)">)(?P<css>.*?)(</style>)', re.S)


def compact(css: str) -> str:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)        # comments
    lines = (line.strip() for line in css.splitlines())    # indentation
    return "\n".join(line for line in lines if line)       # blank lines


def refresh(page: pathlib.Path) -> tuple[str, list[str]]:
    html = page.read_text(encoding="utf-8")
    stale = []

    def fill(m):
        src = ROOT / m.group("src").lstrip("/")
        css = "\n" + compact(src.read_text(encoding="utf-8")) + "\n"
        if css != m.group("css"):
            stale.append(m.group("src"))
        return m.group(1) + css + m.group(4)

    return BLOCK.sub(fill, html), stale


def main() -> int:
    check = "--check" in sys.argv
    out_of_date = False
    for name in PAGES:
        page = ROOT / name
        html, stale = refresh(page)
        if stale:
            out_of_date = True
            if check:
                print(f"{name}: out of date: {', '.join(stale)}")
            else:
                page.write_text(html, encoding="utf-8")
                print(f"{name}: refreshed {', '.join(stale)}")
        else:
            print(f"{name}: up to date")
    return 1 if (check and out_of_date) else 0


if __name__ == "__main__":
    sys.exit(main())
