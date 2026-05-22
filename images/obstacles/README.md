# Foto's van hindernissen

Per hindernis staan de foto's in een submap met het hindernis-id (zie `data/data.json`, veld `id`).

Voorbeeld voor hindernis 12 (Daknet):

```
images/obstacles/12/eigen-foto.jpg
images/obstacles/12/xlsx-1.jpg
```

Toegestane formaten: `.jpg`, `.jpeg`, `.png`, `.webp`.

## Twee soorten foto's

1. **Uit het Excel-bestand** — als een hindernis in de xlsx een eigen tabblad heeft met een afbeelding, plaatst `scripts/import_excel.py` die automatisch hier als `xlsx-1.<ext>`, `xlsx-2.<ext>`, … Alle bestaande `xlsx-*` bestanden in de map worden bij elke import overschreven, andere bestanden blijven staan.
2. **Handmatig toegevoegd** — eigen foto's mag je hier los neerzetten (kies een andere naam dan `xlsx-*`, bijvoorbeeld `eigen-1.jpg`). Deze blijven bewaard bij volgende imports.

Na een handmatige toevoeging: voer `python scripts/import_excel.py` opnieuw uit, dan worden alle foto's in deze map opnieuw in `data.json` gezet.

Aanbevolen formaat: liggend, ongeveer 1200×800 px en kleiner dan 300 KB voor snelle laadtijden op mobiel.

## Wijzigen of verwijderen

- Foto vervangen: vervang het bestand op schijf en draai het import-script opnieuw.
- Foto verwijderen: verwijder het bestand uit deze map én verwijder eventueel het pad uit het `fotos`-veld van de hindernis in `data/data.json`.
