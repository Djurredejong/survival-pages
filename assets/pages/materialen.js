import { loadData, el, aggregateMaterials, formatQty, errorBox } from "../app.js";

const state = {
  data: null,
  search: "",
  expanded: new Set(),
};

function totalLabel(m) {
  const parts = [];
  if (m.hasNumeric) parts.push(formatQty(m.totaalNumeric, m.eenheid));
  if (m.nonNumeric.length) parts.push(...m.nonNumeric);
  return parts.length ? parts.join(" + ") : "—";
}

function applyFilter(list) {
  const q = state.search.trim().toLowerCase();
  if (!q) return list;
  return list.filter((m) => {
    const leverHay = [...m.leveranciers].join(" ").toLowerCase();
    return (
      m.naam.toLowerCase().includes(q) ||
      leverHay.includes(q) ||
      m.gebruiktBij.some((g) => g.naam.toLowerCase().includes(q))
    );
  });
}

function renderDetail(m) {
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
        el("td", { dataset: { label: "Aantal" } }, formatQty(g.aantal, g.eenheid) || "—"),
        el(
          "td",
          { dataset: { label: "Leverancier" } },
          g.leverancier || el("span", { class: "muted" }, "—")
        ),
        el(
          "td",
          { dataset: { label: "Opmerking" } },
          g.opmerking || el("span", { class: "muted" }, "—")
        ),
      ])
    );

  return el("tr", {}, [
    el(
      "td",
      { colSpan: 4, style: "background:#fafbfc;padding:0.5rem 1rem" },
      el(
        "div",
        { class: "table-wrap", style: "margin:.25rem 0" },
        el("table", { class: "data" }, [
          el(
            "thead",
            {},
            el("tr", {}, [
              el("th", { class: "col-nr" }, "Nr."),
              el("th", {}, "Hindernis"),
              el("th", {}, "Aantal"),
              el("th", {}, "Leverancier"),
              el("th", {}, "Opmerking"),
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
  const list = applyFilter(all);

  if (list.length === 0) {
    root.appendChild(el("div", { class: "card muted" }, "Geen materialen gevonden."));
    return;
  }

  const thead = el(
    "thead",
    {},
    el("tr", {}, [
      el("th", {}, "Materiaal"),
      el("th", {}, "Totaal"),
      el("th", {}, "Leverancier(s)"),
      el("th", {}, "Gebruikt bij"),
    ])
  );

  const tbody = el("tbody", {});
  for (const m of list) {
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
          el("strong", {}, m.naam),
          " ",
          el("span", { class: "muted small" }, isOpen ? "▴" : "▾"),
        ]),
        el("td", { dataset: { label: "Totaal" } }, totalLabel(m)),
        el(
          "td",
          { dataset: { label: "Leverancier(s)" } },
          m.leveranciers.size
            ? [...m.leveranciers].sort().join(", ")
            : el("span", { class: "muted" }, "—")
        ),
        el(
          "td",
          { dataset: { label: "Gebruikt bij" } },
          `${m.gebruiktBij.length} hindernis${m.gebruiktBij.length === 1 ? "" : "sen"}`
        ),
      ]
    );
    tbody.appendChild(row);
    if (isOpen) tbody.appendChild(renderDetail(m));
  }

  root.appendChild(
    el("div", { class: "table-wrap" }, el("table", { class: "data" }, [thead, tbody]))
  );
  root.appendChild(
    el("p", { class: "muted small", style: "margin-top:.75rem" },
      `${list.length} van ${all.length} materialen`)
  );
}

async function init() {
  try {
    state.data = await loadData();
  } catch (err) {
    document.getElementById("content").appendChild(errorBox(err));
    return;
  }
  const search = document.getElementById("search");
  search.addEventListener("input", () => {
    state.search = search.value;
    render();
  });
  render();
}

init();
