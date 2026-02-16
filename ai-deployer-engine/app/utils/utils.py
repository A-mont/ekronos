from __future__ import annotations

import os
from typing import List


def load_training_files(dir_path: str, max_files: int = 12, max_chars_total: int = 20000) -> str:
    """
    Loads .txt files from a directory and concatenates them into a single string.
    - max_files: limit how many files are loaded
    - max_chars_total: hard cap to avoid prompt bloat
    """
    if not os.path.isdir(dir_path):
        raise FileNotFoundError(f"Training directory not found: {dir_path}")

    files: List[str] = sorted(
        f for f in os.listdir(dir_path)
        if f.lower().endswith(".txt")
    )[:max_files]

    chunks: List[str] = []
    total = 0

    for fn in files:
        full_path = os.path.join(dir_path, fn)
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().strip()

        header = f"\n\n--- FILE: {fn} ---\n"
        piece = header + content

        if total + len(piece) > max_chars_total:
            remaining = max_chars_total - total
            if remaining > 200:
                chunks.append(piece[:remaining] + "\n\n[...trimmed...]\n")
            break

        chunks.append(piece)
        total += len(piece)

    if not chunks:
        return "(No training .txt files found.)"

    return "".join(chunks)
