#!/usr/bin/env python3
"""Eenmalige import-script: leest 'Hindernislijst en materiaallijst.xlsx'
en schrijft data/data.json.

Voer uit met:  python scripts/import_excel.py [pad/naar.xlsx]
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import OrderedDict
from pathlib import Path
from typing import Any

import openpyxl


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_XLSX = ROOT / "Hindernislijst en materiaallijst.xlsx"
OUT_PATH = ROOT / "data" / "data.json"

# Naam-varianten tussen 'materiaallijst' en 'hindernislijst'. Sleutel =
# naam in materiaallijst (genormaliseerd via normalize_name), waarde =
# de naam zoals die in hindernislijst staat. Pas dit gerust aan als er
# ambiguiteit opgelost moet worden.
NAME_ALIASES: dict[str, str] = {
    "brug af - brug op": "Brug op-Brug af",
    "boomslinger": "Touwslinger",
    "slootnet": "Sloot-net",
}


# ---------- helpers ----------

def norm_str(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def is_truthy_x(value: Any) -> bool:
    s = norm_str(value).lower()
    return s in {"x", "ja", "j", "yes", "y", "true", "1"}


def parse_qty(value: Any) -> tuple[float | str | None, str]:
    """Geeft (aantal, eenheid) terug. Aantal is float waar mogelijk,
    anders de originele string (b.v. '70m'); eenheid blijft leeg
    behalve als de cel iets zoals '70m' bevat."""
    if value is None:
        return None, ""
    if isinstance(value, (int, float)):
        return float(value), ""
    s = str(value).strip()
    if not s:
        return None, ""
    m = re.match(r"^\s*([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)?\s*$", s)
    if m:
        num = float(m.group(1).replace(",", "."))
        unit = (m.group(2) or "").lower()
        return num, unit
    return s, ""


def slug_first_name(name: str) -> str:
    """Geeft genormaliseerde voornaam terug voor matching."""
    if not name:
        return ""
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    s = s.strip().split()
    if not s:
        return ""
    return s[0].lower()


# ---------- bouwteams ----------

def read_bouwteams(wb) -> list[dict]:
    ws = wb["Bouwteams"]
    teams: list[dict] = []
    for row in ws.iter_rows(values_only=True):
        cells = [norm_str(c) for c in row]
        if not any(cells):
            continue
        if cells[0].lower() == "bouwhoofd":
            continue
        bouwhoofd = cells[0]
        leden = [c for c in cells[1:] if c]
        if not bouwhoofd:
            continue
        teams.append({"bouwhoofd": bouwhoofd, "leden": leden})
    return teams


def build_team_index(teams: list[dict]) -> dict[str, str]:
    """Mapping: lookup-string (volledige naam of voornaam, lowercase) ->
    volledige naam van bouwhoofd. Bouwhoofden hebben voorrang boven leden.
    """
    idx: dict[str, str] = {}
    # eerst de bouwhoofden (krijgen voorrang)
    for t in teams:
        full = t["bouwhoofd"]
        idx[full.lower()] = full
        first = slug_first_name(full)
        if first and first not in idx:
            idx[first] = full
    # daarna leden -> bouwhoofd, alleen toevoegen als de key nog vrij is
    for t in teams:
        for lid in t["leden"]:
            full_lid = lid.strip()
            if not full_lid:
                continue
            low = full_lid.lower()
            if low not in idx:
                idx[low] = t["bouwhoofd"]
            first = slug_first_name(full_lid)
            if first and first not in idx:
                idx[first] = t["bouwhoofd"]
    return idx


def match_team(raw: str, team_idx: dict[str, str]) -> tuple[str, bool]:
    """Geeft (naam, matched) terug."""
    if not raw:
        return "", False
    raw_clean = raw.strip()
    low = raw_clean.lower()
    if low in team_idx:
        return team_idx[low], True
    first = slug_first_name(raw_clean)
    if first and first in team_idx:
        return team_idx[first], True
    # gedeeltelijke match (b.v. 'Erwin Mol' -> 'Bernd Veldhuis'? nee, gebruikt voornaam)
    for key, full in team_idx.items():
        if key in low or low in key:
            return full, True
    return raw_clean, False


# ---------- hindernissen ----------

def read_hindernissen(wb) -> list[dict]:
    ws = wb["hindernislijst"]
    rows = list(ws.iter_rows(values_only=True))

    # header staat op rij 1 (0-indexed)
    obstacles: list[dict] = []
    for r in rows[2:]:
        nr = r[0]
        if nr is None:
            # Stop bij eerste lege regel - daarna komt 'Overige vrijwilligers'
            break
        try:
            nr_int = int(nr)
        except (TypeError, ValueError):
            continue
        naam = norm_str(r[1])
        if not naam:
            continue
        obstacles.append({
            "id": nr_int,
            "nr": nr_int,
            "naam": naam,
            "kort": is_truthy_x(r[2]),
            "lang": is_truthy_x(r[3]),
            "vrijwilliger1": norm_str(r[4]),
            "vrijwilliger2": norm_str(r[5]),
            "vervangen_door": norm_str(r[6]),
            "wie_bericht": norm_str(r[7]),
            "bouwer_raw": norm_str(r[8]),
            "toelichting": norm_str(r[9]),
            "uitlegger": norm_str(r[10]) if len(r) > 10 else "",
            "extra": norm_str(r[11]) if len(r) > 11 else "",
        })
    return obstacles


# ---------- materialen ----------

def normalize_name(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", s).strip().lower()


def read_materialen_rows(wb) -> list[dict]:
    """Leest alle materiaalregels uit het materiaallijst-blad.
    Geeft een lijst dicts met 'nr_raw', 'hindernis_naam' (uit kolom B), en
    de materiaalgegevens."""
    ws = wb["materiaallijst"]
    out: list[dict] = []
    started = False
    for row in ws.iter_rows(values_only=True):
        if not started:
            cell0 = norm_str(row[0]).lower()
            if cell0 == "nr.":
                started = True
            continue
        cell0 = norm_str(row[0])
        if cell0.lower().startswith("materiaal overig"):
            break
        if cell0.lower().startswith("bouwteams"):
            break

        hindernis_naam = norm_str(row[1])
        materiaal = norm_str(row[2])
        if not materiaal or materiaal.lower() == "niets":
            continue
        if not hindernis_naam:
            continue
        aantal, eenheid = parse_qty(row[3])
        leverancier = norm_str(row[4])
        opmerking = norm_str(row[6]) if len(row) > 6 else ""

        nr_int: int | None = None
        try:
            nr_int = int(row[0]) if row[0] is not None else None
        except (TypeError, ValueError):
            nr_int = None

        out.append({
            "nr": nr_int,
            "hindernis_naam": hindernis_naam,
            "materiaal": {
                "naam": materiaal,
                "aantal": aantal,
                "eenheid": eenheid,
                "leverancier": leverancier,
                "opmerking": opmerking,
            },
        })
    return out


def assign_materials_to_obstacles(
    obstacles: list[dict],
    mat_rows: list[dict],
) -> tuple[dict[int, list[dict]], list[dict]]:
    """Koppelt materiaal-rijen aan hindernissen via naam-match (canonical id =
    obstacle.id uit de hindernislijst). Bij dubbele namen in de hindernislijst
    wordt gedisambigueerd op basis van het dichtstbijzijnde nummer in de
    materiaallijst. Niet-gematchte rijen worden teruggegeven als losse
    'unmatched' lijst.
    """
    # name -> [obstacles with that name, in volgorde van hindernislijst]
    name_buckets: dict[str, list[dict]] = {}
    for o in obstacles:
        key = normalize_name(o["naam"])
        if not key:
            continue
        name_buckets.setdefault(key, []).append(o)

    per_obstacle: dict[int, list[dict]] = {}
    unmatched: list[dict] = []
    for row in mat_rows:
        key = normalize_name(row["hindernis_naam"])
        if key in NAME_ALIASES:
            key = normalize_name(NAME_ALIASES[key])
        bucket = name_buckets.get(key)
        if not bucket:
            unmatched.append(row)
            continue
        if len(bucket) == 1 or row["nr"] is None:
            target = bucket[0]["id"]
        else:
            # disambigueer op nummer-afstand
            target = min(bucket, key=lambda o: abs(o["nr"] - row["nr"]))["id"]
        per_obstacle.setdefault(target, []).append(row["materiaal"])
    return per_obstacle, unmatched


# ---------- main ----------

def main() -> int:
    xlsx_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    if not xlsx_path.exists():
        print(f"Bestand niet gevonden: {xlsx_path}", file=sys.stderr)
        return 1

    wb = openpyxl.load_workbook(xlsx_path, data_only=True)

    teams = read_bouwteams(wb)
    team_idx = build_team_index(teams)

    obstacles = read_hindernissen(wb)
    mat_rows = read_materialen_rows(wb)
    materialen_per_obs, unmatched_materials = assign_materials_to_obstacles(obstacles, mat_rows)

    unmatched: list[tuple[int, str]] = []
    for obs in obstacles:
        raw = obs.pop("bouwer_raw")
        team, ok = match_team(raw, team_idx)
        obs["bouwteam"] = team
        if raw and not ok:
            unmatched.append((obs["nr"], raw))
        obs["materialen"] = materialen_per_obs.get(obs["nr"], [])
        # bekende foto's: scan images/obstacles/<id>/
        photo_dir = ROOT / "images" / "obstacles" / str(obs["id"])
        photos: list[str] = []
        if photo_dir.exists():
            for f in sorted(photo_dir.iterdir()):
                if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                    photos.append(f"images/obstacles/{obs['id']}/{f.name}")
        obs["fotos"] = photos

    data = {
        "obstacles": obstacles,
        "bouwteams": teams,
        "_meta": {
            "source": xlsx_path.name,
            "unmatched_bouwers": [
                {"nr": nr, "raw": raw} for nr, raw in unmatched
            ],
            "unmatched_material_rows": [
                {
                    "hindernis_naam": r["hindernis_naam"],
                    "nr_in_materiaallijst": r["nr"],
                    "materiaal": r["materiaal"]["naam"],
                }
                for r in unmatched_materials
            ],
        },
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Geschreven: {OUT_PATH} ({len(obstacles)} hindernissen, {len(teams)} bouwteams)")
    if unmatched:
        print("LET OP - niet-gematchte BOUWER waarden (handmatig bewerken in data.json):")
        for nr, raw in unmatched:
            print(f"  nr {nr}: {raw!r}")
    if unmatched_materials:
        print(
            "LET OP - materiaalregels zonder bijbehorende hindernis "
            "(niet meegenomen, alleen-obstakels modus):"
        )
        for r in unmatched_materials:
            print(
                f"  hindernis={r['hindernis_naam']!r} "
                f"(nr in materiaallijst={r['nr']}) materiaal={r['materiaal']['naam']!r}"
            )
    return 0


if __name__ == "__main__":
    sys.exit(main())
