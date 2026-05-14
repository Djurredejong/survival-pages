import { loadData, el, checkmark, errorBox } from "../app.js";

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

function renderTeam(team, obstacles) {
  const list = obstacles.length
    ? el(
        "div",
        { class: "table-wrap" },
        el("table", { class: "data" }, [
          el(
            "thead",
            {},
            el("tr", {}, [
              el("th", { class: "col-nr" }, "Nr."),
              el("th", {}, "Naam"),
              el("th", { class: "col-bool" }, "Kort"),
              el("th", { class: "col-bool" }, "Lang"),
            ])
          ),
          el(
            "tbody",
            {},
            obstacles.map((o) =>
              el(
                "tr",
                {
                  class: "link-row",
                  on: {
                    click: () => {
                      window.location.href = `hindernis.html?id=${o.id}`;
                    },
                  },
                },
                [
                  el("td", { class: "col-nr", dataset: { label: "Nr." } }, String(o.nr)),
                  el(
                    "td",
                    { dataset: { label: "Naam" } },
                    el(
                      "a",
                      { href: `hindernis.html?id=${o.id}`, on: { click: (e) => e.stopPropagation() } },
                      o.naam
                    )
                  ),
                  el("td", { class: "col-bool", dataset: { label: "Kort" } }, checkmark(o.kort)),
                  el("td", { class: "col-bool", dataset: { label: "Lang" } }, checkmark(o.lang)),
                ]
              )
            )
          ),
        ])
      )
    : el("p", { class: "muted" }, "Geen hindernissen toegewezen.");

  return el(
    "section",
    {
      class: "card team-card",
      id: `team-${team.bouwhoofd}`,
    },
    [
      el("div", { class: "team-card__head" }, [
        el("h2", { style: "margin:0" }, team.bouwhoofd),
        el("span", { class: "badge" }, `${obstacles.length} hindernis${obstacles.length === 1 ? "" : "sen"}`),
      ]),
      team.leden.length
        ? el("p", { class: "team-card__leden" }, "Team: " + team.leden.join(", "))
        : null,
      list,
    ]
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

  const grouped = groupObstaclesByTeam(data.obstacles);

  for (const team of data.bouwteams) {
    const list = grouped.get(team.bouwhoofd) || [];
    grouped.delete(team.bouwhoofd);
    root.appendChild(renderTeam(team, list));
  }

  // Hindernissen waarvan het bouwteam niet in de Bouwteams-lijst staat
  const orphanTeams = [...grouped.entries()].filter(([k]) => k);
  if (orphanTeams.length) {
    root.appendChild(el("h2", {}, "Overige toewijzingen"));
    root.appendChild(
      el(
        "p",
        { class: "muted small" },
        "Deze ‘bouwteam’-waarden staan niet in de Bouwteams-lijst en kunnen handmatig gecorrigeerd worden in data.json."
      )
    );
    for (const [name, list] of orphanTeams) {
      root.appendChild(renderTeam({ bouwhoofd: name, leden: [] }, list));
    }
  }

  // Hindernissen zonder bouwteam
  const noTeam = grouped.get("") || [];
  if (noTeam.length) {
    root.appendChild(el("h2", {}, "Zonder bouwteam"));
    root.appendChild(renderTeam({ bouwhoofd: "(nog niet toegewezen)", leden: [] }, noTeam));
  }

  // anchor-scroll als URL een hash heeft
  if (window.location.hash) {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
  }
}

init();
