import { loadData, el, errorBox } from "../app.js";

const state = {
  open: new Set(),
};

function groupObstaclesByTeam(obstacles) {
  const map = new Map();
  for (const o of obstacles) {
    const k = o.bouwteam || "";
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(o);
  }
  for (const list of map.values()) list.sort((a, b) => a.nr - b.nr);
  return map;
}

function routeLabel(o) {
  if (o.kort && o.lang) return "1,5 / 4 km";
  if (o.kort) return "1,5 km";
  if (o.lang) return "4 km";
  return "";
}

function renderObstacleList(obstacles) {
  if (obstacles.length === 0) {
    return el("p", { class: "muted small team-card__empty" }, "Geen hindernissen toegewezen.");
  }
  return el(
    "ul",
    { class: "obstacle-list" },
    obstacles.map((o) => {
      const route = routeLabel(o);
      return el("li", {}, [
        el("span", { class: "obstacle-list__nr" }, String(o.nr) + "."),
        el("a", { href: `hindernis.html?id=${o.id}` }, o.naam),
        route ? el("span", { class: "route-tag" }, ` (${route})`) : null,
      ]);
    })
  );
}

function renderTeam(team, obstacles, anchorId) {
  const isOpen = state.open.has(anchorId);

  const head = el(
    "button",
    {
      class: "team-card__head",
      type: "button",
      "aria-expanded": String(isOpen),
      on: {
        click: () => {
          if (state.open.has(anchorId)) state.open.delete(anchorId);
          else state.open.add(anchorId);
          render();
        },
      },
    },
    [
      el("span", { class: "team-card__caret" }, isOpen ? "▾" : "▸"),
      el("span", { class: "team-card__name" }, team.bouwhoofd),
      el("span", { class: "team-card__count" }, `${obstacles.length}`),
    ]
  );

  const body = isOpen
    ? el("div", { class: "team-card__body" }, [
        team.leden.length
          ? el("p", { class: "team-card__leden" }, "Team: " + team.leden.join(", "))
          : null,
        renderObstacleList(obstacles),
      ])
    : null;

  return el(
    "section",
    { class: "card team-card" + (isOpen ? " is-open" : ""), id: `team-${team.bouwhoofd}` },
    [head, body]
  );
}

async function init() {
  const root = document.getElementById("content");
  let data;
  try {
    data = await loadData();
  } catch (err) {
    root.appendChild(errorBox(err));
    return;
  }

  // Open de juiste sectie als er een hash is
  if (window.location.hash) {
    const id = decodeURIComponent(window.location.hash.slice(1));
    state.open.add(id);
  }

  state._data = data;
  render();

  if (window.location.hash) {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
  }
}

function render() {
  const root = document.getElementById("content");
  root.innerHTML = "";
  const data = state._data;
  const grouped = groupObstaclesByTeam(data.obstacles);

  for (const team of data.bouwteams) {
    const list = grouped.get(team.bouwhoofd) || [];
    grouped.delete(team.bouwhoofd);
    root.appendChild(renderTeam(team, list, `team-${team.bouwhoofd}`));
  }

  // Bouwteams die wel in obstacles voorkomen maar niet in de bouwteams-lijst
  const orphanTeams = [...grouped.entries()].filter(([k]) => k);
  if (orphanTeams.length) {
    root.appendChild(el("h2", { style: "margin-top:1.25rem" }, "Overige toewijzingen"));
    root.appendChild(
      el(
        "p",
        { class: "muted small" },
        "Deze ‘bouwteam’-waarden staan niet in de Bouwteams-lijst en kunnen handmatig gecorrigeerd worden in data.json."
      )
    );
    for (const [name, list] of orphanTeams) {
      root.appendChild(renderTeam({ bouwhoofd: name, leden: [] }, list, `team-${name}`));
    }
  }

  // Hindernissen zonder bouwteam
  const noTeam = grouped.get("") || [];
  if (noTeam.length) {
    root.appendChild(el("h2", { style: "margin-top:1.25rem" }, "Zonder bouwteam"));
    root.appendChild(
      renderTeam({ bouwhoofd: "(nog niet toegewezen)", leden: [] }, noTeam, "team-_none_")
    );
  }
}

init();
