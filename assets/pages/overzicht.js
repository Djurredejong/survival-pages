import { loadData, el, errorBox } from "../app.js";

const state = {
  data: null,
  sort: { key: "nr", dir: 1 },
};

function routeLabel(o) {
  if (o.kort && o.lang) return "1,5 / 4 km";
  if (o.kort) return "1,5 km";
  if (o.lang) return "4 km";
  return "";
}

function sortObstacles(obstacles) {
  const { key, dir } = state.sort;
  return obstacles.slice().sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av || "").localeCompare(String(bv || ""), "nl", {
      sensitivity: "base",
    }) * dir;
  });
}

function buildTable() {
  const obstacles = sortObstacles(state.data.obstacles);

  const headers = [
    { key: "nr", label: "Nr.", class: "col-nr" },
    { key: "naam", label: "Naam" },
    { key: "bouwteam", label: "Bouwteam" },
  ];

  const thead = el(
    "thead",
    {},
    el(
      "tr",
      {},
      headers.map((h) =>
        el(
          "th",
          {
            class: h.class,
            dataset: { key: h.key },
            on: {
              click: () => {
                if (state.sort.key === h.key) state.sort.dir *= -1;
                else state.sort = { key: h.key, dir: 1 };
                render();
              },
            },
          },
          [
            h.label,
            state.sort.key === h.key
              ? el("span", { class: "sort-ind" }, state.sort.dir === 1 ? "▲" : "▼")
              : null,
          ]
        )
      )
    )
  );

  const tbody = el(
    "tbody",
    {},
    obstacles.map((o) => {
      const href = `hindernis.html?id=${o.id}`;
      const route = routeLabel(o);
      const nameCell = el("td", { dataset: { label: "" } }, [
        el("a", { href, on: { click: (e) => e.stopPropagation() } }, o.naam),
        route ? el("span", { class: "route-tag" }, ` (${route})`) : null,
      ]);
      return el(
        "tr",
        {
          class: "link-row",
          on: {
            click: () => {
              window.location.href = href;
            },
          },
        },
        [
          el("td", { class: "col-nr", dataset: { label: "" } }, String(o.nr)),
          nameCell,
          el(
            "td",
            { dataset: { label: "" }, class: "muted-cell" },
            o.bouwteam || el("span", { class: "muted" }, "—")
          ),
        ]
      );
    })
  );

  return el("div", { class: "table-wrap" }, el("table", { class: "data data--compact" }, [thead, tbody]));
}

function render() {
  const root = document.getElementById("content");
  root.innerHTML = "";
  root.appendChild(buildTable());
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
