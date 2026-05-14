# Survival Hindernissen — pages

Statische website met overzicht van hindernissen, materialen en bouwteams voor de jaarlijkse survival. De pagina's worden via **GitHub Pages** gepubliceerd.

## Structuur

```
index.html              Overzicht hindernissen (startpagina)
hindernis.html          Detail per hindernis (via ?id=N)
materialen.html         Totaal-overzicht materialen
bouwteams.html          Bouwteams + toegewezen hindernissen

assets/
  style.css             Stijlen (mobile-first)
  app.js                Gedeelde helpers
  pages/                JS per pagina

data/
  data.json             Alle gegevens — bewerk deze om iets te wijzigen

images/obstacles/<id>/  Foto's per hindernis (0–3 stuks)

scripts/import_excel.py Eenmalig: vult data.json uit het Excel-bestand
```

## Lokaal bekijken

Omdat de site `fetch()` gebruikt voor `data/data.json`, moet hij via een lokale webserver geopend worden (niet `file://`).

```bash
python3 -m http.server 8000
# open daarna http://localhost:8000 in je browser
```

## Gegevens bewerken

Alle gegevens zitten in **`data/data.json`**. Voor de meeste wijzigingen kun je dit bestand gewoon openen en bewerken — direct in GitHub kan ook via "Edit this file".

### Voorbeelden

**Bouwteam van een hindernis aanpassen:** zoek de hindernis op `id` of `naam` en wijzig het veld `"bouwteam"`. De waarde moet exact gelijk zijn aan het `"bouwhoofd"` van een team in de `bouwteams`-lijst (anders verschijnt de hindernis op de Bouwteams-pagina onder "Overige toewijzingen").

**Materialen toevoegen of wijzigen:** bewerk de array `"materialen"` van een hindernis:

```json
{
  "naam": "Sjorband",
  "aantal": 4,
  "eenheid": "",
  "leverancier": "Erwin",
  "opmerking": ""
}
```

Het `aantal` mag een getal zijn (wordt opgeteld op de materialen-pagina) of een string als er bv. een eenheid bij hoort die niet automatisch optelbaar is (`"70m"`).

**Een nieuwe hindernis toevoegen:** voeg een nieuw object toe aan de `obstacles`-array. Gebruik een uniek `id`. Voorbeeld:

```json
{
  "id": 99,
  "nr": 99,
  "naam": "Nieuwe hindernis",
  "kort": true,
  "lang": false,
  "vrijwilliger1": "",
  "vrijwilliger2": "",
  "vervangen_door": "",
  "wie_bericht": "",
  "toelichting": "",
  "uitlegger": "",
  "extra": "",
  "bouwteam": "Rob Alink",
  "materialen": [],
  "fotos": []
}
```

**Bouwteam toevoegen of leden aanpassen:** bewerk de `bouwteams`-array. Een team heeft een `bouwhoofd` en `leden` (1–5 namen).

**Foto's toevoegen:** zie [`images/obstacles/README.md`](images/obstacles/README.md). Plaats foto's onder `images/obstacles/<id>/`, en zet de paden in het `fotos`-array van de hindernis (of voer het import-script opnieuw uit; het detecteert ze automatisch).

## Excel opnieuw inlezen

Mocht je opnieuw vanaf het Excel-bestand willen beginnen:

```bash
python3 -m venv .venv
.venv/bin/pip install openpyxl
.venv/bin/python scripts/import_excel.py
```

> **Let op:** dit overschrijft `data/data.json`. Eventueel handmatig aangebrachte wijzigingen gaan verloren — pleeg dus liefst wijzigingen via JSON nadat het bestand eenmaal is gevuld.

Bij het importeren wordt de `BOUWER` uit de hindernislijst (vaak alleen een voornaam) gekoppeld aan een bouwhoofd via fuzzy match. Niet-gematchte namen worden geprint op stdout zodat je ze handmatig kunt repareren.

## Deploy via GitHub Pages

Een workflow (`.github/workflows/pages.yml`) publiceert de site automatisch bij elke push naar `main`. Zorg eenmalig dat GitHub Pages aanstaat:

1. Maak een nieuwe GitHub-repo en push:

   ```bash
   git init
   git add .
   git commit -m "Initiële versie"
   git branch -M main
   git remote add origin git@github.com:<gebruiker>/<repo>.git
   git push -u origin main
   ```

2. Op GitHub: **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.

3. De workflow draait automatisch en publiceert op `https://djurredejong.github.io/survival-pages/`.

## Aandachtspunten in de huidige data

### Niet-gematchte bouwhoofden

Het import-script kon een paar `BOUWER`-velden niet automatisch matchen aan een bouwhoofd. Deze staan nu als "los" bouwteam in `data.json` (zichtbaar onder "Overige toewijzingen" op de Bouwteams-pagina):

- hindernis 33 — `Michiel` (geen bouwteam met deze persoon in Excel)
- hindernis 41 — `zondag` (placeholder)
- hindernis 42 — `zondag` (placeholder)

Pas deze waarden in `data/data.json` aan zodra duidelijk is wie verantwoordelijk is.

### Niet-gematchte materialen

De `hindernislijst`- en `materiaallijst`-bladen in het Excel-bestand gebruiken **verschillende nummering** voor dezelfde hindernissen. Het import-script koppelt daarom op **naam**, niet op nummer. Enkele namen verschillen tussen de twee bladen; bekende vertalingen staan in `NAME_ALIASES` in `scripts/import_excel.py`. Onbekend gebleven:

- materiaallijst nr 16, `Lianenbrug`: deze naam komt niet voor in de hindernislijst. Mogelijk een synoniem voor een Indianenbrug (er staan er twee in de hindernislijst). Materialen: Sjorbanden, Touw met lusjes, Tiewraps.
- materiaallijst nr 32, `In de Ton`: mogelijk hetzelfde als hindernislijst nr 32 `Pontons`. Materialen: pittenzakken, kruiwagen.

Zodra duidelijk is wat de correcte koppeling is, voeg een entry toe aan `NAME_ALIASES` en draai het import-script opnieuw — óf voeg de materialen direct toe aan de juiste hindernis in `data/data.json`.
