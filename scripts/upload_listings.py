#!/usr/bin/env python3
"""
Push a JSONL listings snapshot to Supabase using the same RPC that the refresh
button triggers. The script reads each line from the provided JSONL file,
parses it as JSON, and submits the full array to the `sync_job_listings`
function.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Iterable, List
from dotenv import load_dotenv
load_dotenv()
import requests


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Upload flat Mercor listings JSONL to Supabase."
    )
    parser.add_argument(
        "--file",
        default="scripts/listings.jsonl",
        help="Path to the listings JSONL file (default: scripts/listings.jsonl)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate the file without writing to Supabase.",
    )
    return parser.parse_args()


def read_jsonl(path: Path) -> List[Any]:
    records: List[Any] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            line = raw_line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ValueError(
                    f"Line {line_number} in {path} is not valid JSON."
                ) from error
    return records


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}."
            " Set this to your Supabase environment value before running."
        )
    return value


def call_sync_job_listings(
    supabase_url: str, service_role_key: str, records: Iterable[Any]
) -> None:
    rpc_url = f"{supabase_url.rstrip('/')}/rest/v1/rpc/sync_job_listings"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"records": list(records)}

    response = requests.post(rpc_url, json=payload, headers=headers, timeout=30)
    if response.status_code >= 400:
        try:
            error_body = response.json()
        except ValueError:
            error_body = response.text
        raise RuntimeError(
            f"Supabase sync_job_listings RPC failed with status "
            f"{response.status_code}: {error_body}"
        )


def main() -> None:
    args = parse_args()
    source = Path(args.file)

    if not source.exists():
        print(f"JSONL file not found: {source}", file=sys.stderr)
        sys.exit(1)

    try:
        records = read_jsonl(source)
    except ValueError as error:
        print(f"Failed to parse JSONL: {error}", file=sys.stderr)
        sys.exit(1)

    if not records:
        print("No listings found in JSONL; aborting.", file=sys.stderr)
        sys.exit(1)

    print(f"Loaded {len(records)} listings from {source}")

    if args.dry_run:
        print("Dry run enabled; skipping Supabase upload.")
        return

    try:
        supabase_url = require_env("SUPABASE_URL")
        service_role_key = require_env("SUPABASE_SERVICE_ROLE_KEY")
    except RuntimeError as error:
        print(error, file=sys.stderr)
        sys.exit(1)

    try:
        call_sync_job_listings(supabase_url, service_role_key, records)
    except RuntimeError as error:
        print(error, file=sys.stderr)
        sys.exit(1)

    print("Listings uploaded successfully.")


if __name__ == "__main__":
    main()
