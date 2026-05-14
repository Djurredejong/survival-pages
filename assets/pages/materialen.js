import { loadData, el, aggregateMaterials, formatQty, errorBox } from "../app.js";

const state = {
  data: null,
  expanded: new Set(),
};

function totalLabel(m) {
  const parts = [];
  if (m.hasNumeric) parts.push(formatQty(m.totaalNumeric, m.eenheid));
  if (m.nonNumeric.length) parts.push(...m.nonNumeric);
  return parts.length ? parts.join(" + ") : "—";
}

function renderDetailRow(m) {
  const rows = m.gebruiktBij
    .slice()
    .sort((a, b) => a.nr - b.nr)
    .map((g) =>
      el("tr", {}, [
        el("td", { class: "col-nr", dataset: { label: "Nr." } }, String(g.nr)),
        el(
          "td",
          { dataset: { label: "Hindernis" } },
          el("a", { href: `hindernis.html?id=${g.id}` }, g.naam)
        ),
        el(
          "td",
          { class: "col-num", dataset: { label: "Aantal" } },
          formatQty(g.aantal, g.eenheid) || "—"
        ),
        el(
          "td",
          { dataset: { label: "Leverancier" } },
          g.leverancier || el("span", { class: "muted" }, "—")
        ),
      ])
    );

  return el("tr", { class: "detail-row" }, [
    el(
      "td",
      { colSpan: 4 },
      el(
        "div",
        { class: "table-wrap detail-inner" },
        el("table", { class: "data data--compact data--tabular-mobile" }, [
          el(
            "thead",
            {},
            el("tr", {}, [
              el("th", { class: "col-nr" }, "Nr."),
              el("th", {}, "Hindernis"),
              el("th", { class: "col-num" }, "Aantal"),
              el("th", {}, "Leverancier"),
            ])
          ),
          el("tbody", {}, rows),
        ])
      )
    ),
  ]);
}

function render() {
  const root = document.getElementById("content");
  root.innerHTML = "";

  const all = aggregateMaterials(state.data.obstacles);

  if (all.length === 0) {
    root.appendChild(el("div", { class: "panel muted" }, "Geen materialen gevonden."));
    return;
  }

  const thead = el(
    "thead",
    {},
    el("tr", {}, [
      el("th", {}, "Materiaal"),
      el("th", { class: "col-num" }, "Totaal"),
      el("th", {}, "Leverancier(s)"),
      el("th", { class: "col-num col-count" }, "Gebr."),
    ])
  );

  const tbody = el("tbody", {});
  for (const m of all) {
    const key = m.naam.toLowerCase() + "|" + m.eenheid;
    const isOpen = state.expanded.has(key);
    const row = el(
      "tr",
      {
        class: "link-row",
        on: {
          click: () => {
            if (state.expanded.has(key)) state.expanded.delete(key);
            else state.expanded.add(key);
            render();
          },
        },
      },
      [
        el("td", { dataset: { label: "Materiaal" } }, [
          el("span", { class: "muted small", style: "margin-right:.35em" }, isOpen ? "▾" : "▸"),
          el("strong", {}, m.naam),
        ]),
        el("td", { class: "col-num", dataset: { label: "Totaal" } }, totalLabel(m)),
        el(
          "td",
          { dataset: { label: "Leverancier(s)" } },
          m.leveranciers.size
            ? [...m.leveranciers].sort().join(", ")
            : el("span", { class: "muted" }, "—")
        ),
        el(
          "td",
          { class: "col-num col-count", dataset: { label: "Gebruikt bij" } },
          String(m.gebruiktBij.length)
        ),
      ]
    );
    tbody.appendChild(row);
    if (isOpen) tbody.appendChild(renderDetailRow(m));
  }

  root.appendChild(
    el(
      "div",
      { class: "table-wrap" },
      el("table", { class: "data data--compact data--tabular-mobile" }, [thead, tbody])
    )
  );
  root.appendChild(
    el("p", { class: "muted small", style: "margin-top:.5rem" }, `${all.length} materialen`)
  );
}

async function init() {
  try {
    state.data = await loadData();
  } catch (err) {
    document.getElementById("content").appendChild(errorBox(err));
    return;
  }
  render();
}

init();
