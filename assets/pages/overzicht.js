import { loadData, el, checkmark, errorBox } from "../app.js";

const state = {
  data: null,
  search: "",
  filter: "all",
  sort: { key: "nr", dir: 1 },
};

function applyFilters(obstacles) {
  const q = state.search.trim().toLowerCase();
  let list = obstacles.slice();
  if (state.filter === "kort") list = list.filter((o) => o.kort);
  if (state.filter === "lang") list = list.filter((o) => o.lang);
  if (q) {
    list = list.filter((o) => {
      const hay = [
        o.naam,
        o.bouwteam,
        o.vrijwilliger1,
        o.vrijwilliger2,
        o.uitlegger,
        o.toelichting,
        String(o.nr),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  const { key, dir } = state.sort;
  list.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av || "").localeCompare(String(bv || ""), "nl", {
      sensitivity: "base",
    }) * dir;
  });
  return list;
}

function buildTable() {
  const obstacles = applyFilters(state.data.obstacles);

  const headers = [
    { key: "nr", label: "Nr.", class: "col-nr" },
    { key: "naam", label: "Naam" },
    { key: "kort", label: "Kort", class: "col-bool" },
    { key: "lang", label: "Lang", class: "col-bool" },
    { key: "bouwteam", label: "Bouwteam" },
    { key: "uitlegger", label: "Uitleg" },
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
          el("td", { class: "col-nr", dataset: { label: "Nr." } }, String(o.nr)),
          el(
            "td",
            { dataset: { label: "Naam" } },
            el("a", { href, on: { click: (e) => e.stopPropagation() } }, o.naam)
          ),
          el("td", { class: "col-bool", dataset: { label: "Kort" } }, checkmark(o.kort)),
          el("td", { class: "col-bool", dataset: { label: "Lang" } }, checkmark(o.lang)),
          el("td", { dataset: { label: "Bouwteam" } }, o.bouwteam || el("span", { class: "muted" }, "—")),
          el(
            "td",
            { dataset: { label: "Uitleg" } },
            o.uitlegger || el("span", { class: "muted" }, "—")
          ),
        ]
      );
    })
  );

  if (obstacles.length === 0) {
    return el("div", { class: "card muted" }, "Geen hindernissen gevonden.");
  }

  return el("div", { class: "table-wrap" }, el("table", { class: "data" }, [thead, tbody]));
}

function render() {
  const root = document.getElementById("content");
  root.innerHTML = "";
  root.appendChild(buildTable());
  root.appendChild(
    el(
      "p",
      { class: "muted small", style: "margin-top:.75rem" },
      `${applyFilters(state.data.obstacles).length} van ${state.data.obstacles.length} hindernissen`
    )
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

  for (const btn of document.querySelectorAll(".chips .chip")) {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chips .chip").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.filter = btn.dataset.filter;
      render();
    });
  }

  render();
}

init();
