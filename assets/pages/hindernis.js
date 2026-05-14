import { loadData, el, checkmark, formatQty, getQueryParam, errorBox } from "../app.js";

function renderRoutes(obs) {
  const badges = [];
  if (obs.kort) badges.push(el("span", { class: "badge badge--ok" }, "Kort · 1,5 km"));
  if (obs.lang) badges.push(el("span", { class: "badge badge--ok" }, "Lang · 4 km"));
  if (!obs.kort && !obs.lang) badges.push(el("span", { class: "badge badge--muted" }, "Niet ingedeeld"));
  return el("div", { style: "display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.5rem" }, badges);
}

function kvRow(label, value) {
  if (!value) return null;
  return [el("dt", {}, label), el("dd", {}, value)];
}

function renderInfo(obs) {
  const kv = el("dl", { class: "kv" }, [
    kvRow("Nummer", String(obs.nr)),
    kvRow(
      "Bouwteam",
      obs.bouwteam
        ? el("a", { href: `bouwteams.html#team-${encodeURIComponent(obs.bouwteam)}` }, obs.bouwteam)
        : null
    ),
    kvRow("Vrijwilliger 1", obs.vrijwilliger1),
    kvRow("Vrijwilliger 2", obs.vrijwilliger2),
    kvRow("Uitleg", obs.uitlegger),
    kvRow("Wie bericht", obs.wie_bericht),
    kvRow("Vervangen door", obs.vervangen_door),
    kvRow("Toelichting", obs.toelichting),
    kvRow("Extra", obs.extra),
  ].flat().filter(Boolean));

  return el("section", { class: "card" }, [
    el("h2", {}, "Algemeen"),
    renderRoutes(obs),
    kv,
  ]);
}

function renderMaterialen(obs) {
  const mats = obs.materialen || [];
  if (mats.length === 0) {
    return el("section", { class: "card" }, [
      el("h2", {}, "Materialen"),
      el("p", { class: "muted" }, "Geen materialen geregistreerd."),
    ]);
  }
  const rows = mats.map((m) =>
    el("tr", {}, [
      el("td", { dataset: { label: "Materiaal" } }, m.naam),
      el("td", { dataset: { label: "Aantal" } }, formatQty(m.aantal, m.eenheid) || "—"),
      el(
        "td",
        { dataset: { label: "Leverancier" } },
        m.leverancier || el("span", { class: "muted" }, "—")
      ),
      el(
        "td",
        { dataset: { label: "Opmerking" } },
        m.opmerking || el("span", { class: "muted" }, "—")
      ),
    ])
  );
  return el("section", { class: "card" }, [
    el("h2", {}, "Materialen"),
    el(
      "div",
      { class: "table-wrap" },
      el("table", { class: "data" }, [
        el(
          "thead",
          {},
          el("tr", {}, [
            el("th", {}, "Materiaal"),
            el("th", {}, "Aantal"),
            el("th", {}, "Leverancier"),
            el("th", {}, "Opmerking"),
          ])
        ),
        el("tbody", {}, rows),
      ])
    ),
  ]);
}

function renderFotos(obs) {
  const fotos = obs.fotos || [];
  if (fotos.length === 0) return null;
  return el("section", { class: "card" }, [
    el("h2", {}, "Foto's"),
    el(
      "div",
      { class: "photo-grid" },
      fotos.map((src) =>
        el("a", { href: src, target: "_blank", rel: "noopener" },
          el("img", { src, alt: `${obs.naam} foto`, loading: "lazy" }))
      )
    ),
  ]);
}

async function init() {
  const id = parseInt(getQueryParam("id"), 10);
  const root = document.getElementById("content");

  let data;
  try {
    data = await loadData();
  } catch (err) {
    root.appendChild(errorBox(err));
    return;
  }

  const obs = data.obstacles.find((o) => o.id === id);
  if (!obs) {
    root.appendChild(
      el("div", { class: "card" }, [
        el("strong", {}, "Hindernis niet gevonden."),
        el("p", { class: "muted small" }, `Geen hindernis met id ${id}.`),
        el("p", {}, el("a", { href: "index.html" }, "← Terug naar overzicht")),
      ])
    );
    document.title = "Hindernis niet gevonden · Survival";
    return;
  }

  document.title = `${obs.nr}. ${obs.naam} · Survival`;

  root.appendChild(el("h1", {}, `${obs.nr}. ${obs.naam}`));
  root.appendChild(renderInfo(obs));
  root.appendChild(renderMaterialen(obs));
  const foto = renderFotos(obs);
  if (foto) root.appendChild(foto);
}

init();
