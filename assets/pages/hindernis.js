import { loadData, el, formatQty, getQueryParam, errorBox } from "../app.js";

function routeLabel(o) {
  if (o.kort && o.lang) return "1,5 km + 4 km";
  if (o.kort) return "1,5 km";
  if (o.lang) return "4 km";
  return "—";
}

function infoRows(obs) {
  return [
    ["Route", routeLabel(obs)],
    ["Bouwteam",
      obs.bouwteam
        ? el("a", { href: `bouwteams.html#team-${encodeURIComponent(obs.bouwteam)}` }, obs.bouwteam)
        : null,
    ],
    ["Vrijwilliger 1", obs.vrijwilliger1],
    ["Vrijwilliger 2", obs.vrijwilliger2],
    ["Uitleg", obs.uitlegger],
    ["Wie bericht", obs.wie_bericht],
    ["Vervangen door", obs.vervangen_door],
    ["Toelichting", obs.toelichting],
    ["Extra", obs.extra],
  ].filter(([, v]) => v);
}

function renderInfo(obs) {
  const rows = infoRows(obs).map(([k, v]) =>
    el("tr", {}, [
      el("th", { scope: "row" }, k),
      el("td", {}, v),
    ])
  );
  return el("section", { class: "panel" }, [
    el("h2", { class: "panel__title" }, "Algemeen"),
    el(
      "div",
      { class: "table-wrap" },
      el("table", { class: "data data--compact data--kv" }, el("tbody", {}, rows))
    ),
  ]);
}

function renderMaterialen(obs) {
  const mats = obs.materialen || [];
  const body = mats.length === 0
    ? el("p", { class: "muted small panel__empty" }, "Geen materialen geregistreerd.")
    : el(
        "div",
        { class: "table-wrap" },
        el("table", { class: "data data--compact data--tabular-mobile" }, [
          el(
            "thead",
            {},
            el("tr", {}, [
              el("th", {}, "Materiaal"),
              el("th", { class: "col-num" }, "Aantal"),
              el("th", {}, "Leverancier"),
            ])
          ),
          el(
            "tbody",
            {},
            mats.map((m) =>
              el("tr", {}, [
                el("td", { dataset: { label: "Materiaal" } }, [
                  m.naam,
                  m.opmerking
                    ? el("div", { class: "muted small" }, m.opmerking)
                    : null,
                ]),
                el(
                  "td",
                  { class: "col-num", dataset: { label: "Aantal" } },
                  formatQty(m.aantal, m.eenheid) || "—"
                ),
                el(
                  "td",
                  { dataset: { label: "Leverancier" } },
                  m.leverancier || el("span", { class: "muted" }, "—")
                ),
              ])
            )
          ),
        ])
      );

  return el("section", { class: "panel" }, [
    el("h2", { class: "panel__title" }, "Materialen"),
    body,
  ]);
}

function renderFotos(obs) {
  const fotos = obs.fotos || [];
  if (fotos.length === 0) return null;
  return el("section", { class: "panel" }, [
    el("h2", { class: "panel__title" }, "Foto's"),
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
      el("section", { class: "panel" }, [
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
