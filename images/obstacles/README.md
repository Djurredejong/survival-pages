# Foto's van hindernissen

Per hindernis kunnen er 0–3 foto's worden toegevoegd. Plaats ze in een submap met het hindernis-id (zie `data/data.json`, veld `id`).

Voorbeeld voor hindernis 12 (Daknet):

```
images/obstacles/12/1.jpg
images/obstacles/12/2.jpg
```

Toegestane formaten: `.jpg`, `.jpeg`, `.png`, `.webp`.

Na het toevoegen van foto's: voer `python scripts/import_excel.py` opnieuw uit om de paden in `data.json` te vernieuwen, of voeg ze handmatig toe aan het `fotos`-veld van die hindernis.

Aanbevolen formaat: liggend, ongeveer 1200×800 px en kleiner dan 300 KB voor snelle laadtijden op mobiel.
