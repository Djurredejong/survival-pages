// Gedeelde helpers - geladen op elke pagina.

const DATA_URL = "data/data.json";
let _dataPromise = null;

export function loadData() {
  if (!_dataPromise) {
    _dataPromise = fetch(DATA_URL, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(`Kan ${DATA_URL} niet laden (${r.status})`);
      return r.json();
    });
  }
  return _dataPromise;
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "dataset") {
      for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv;
    } else if (k === "on") {
      for (const [ek, ev] of Object.entries(v)) node.addEventListener(ek, ev);
    } else if (k === "html") node.innerHTML = v;
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  }
  return node;
}

export function formatQty(value, unit) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    const str = Number.isInteger(value) ? String(value) : value.toString();
    return unit ? `${str}${unit}` : str;
  }
  return String(value);
}

export function checkmark(b) {
  return b
    ? el("span", { class: "check", title: "Ja" }, "✓")
    : el("span", { class: "dash", title: "Nee" }, "–");
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function setActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  for (const a of document.querySelectorAll(".site-nav a")) {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("is-active");
    }
  }
}

document.addEventListener("DOMContentLoaded", setActiveNav);

export function errorBox(err) {
  console.error(err);
  return el("div", { class: "card" }, [
    el("strong", {}, "Er ging iets mis bij het laden van de gegevens."),
    el("p", { class: "muted small" }, String(err && err.message ? err.message : err)),
  ]);
}

// Aggregeert materialen per (naam, eenheid) over alle hindernissen.
export function aggregateMaterials(obstacles) {
  const map = new Map();
  for (const obs of obstacles) {
    for (const m of obs.materialen || []) {
      const key = (m.naam || "").trim().toLowerCase() + "|" + (m.eenheid || "");
      if (!map.has(key)) {
        map.set(key, {
          naam: m.naam,
          eenheid: m.eenheid || "",
          totaalNumeric: 0,
          hasNumeric: false,
          nonNumeric: [],
          leveranciers: new Set(),
          gebruiktBij: [],
        });
      }
      const entry = map.get(key);
      if (typeof m.aantal === "number") {
        entry.totaalNumeric += m.aantal;
        entry.hasNumeric = true;
      } else if (m.aantal) {
        entry.nonNumeric.push(String(m.aantal));
      }
      if (m.leverancier) entry.leveranciers.add(m.leverancier);
      entry.gebruiktBij.push({
        id: obs.id,
        nr: obs.nr,
        naam: obs.naam,
        aantal: m.aantal,
        eenheid: m.eenheid,
        leverancier: m.leverancier,
        opmerking: m.opmerking,
      });
    }
  }
  return [...map.values()].sort((a, b) =>
    a.naam.localeCompare(b.naam, "nl", { sensitivity: "base" })
  );
}
