const fetch = require("node-fetch");
const yn = require("yn");
const moment = require("moment-timezone");
const { writeFileSync } = require("fs");
const path = require("path");
const { Room, Planning } = require("../models");

// TODO: Doc start format
async function getPlannings(rooms, start, end, building = null) {
  if (!(checkDateFormat(start) || checkDateFormat(end))) {
    throw new Error(
      "[custom]Format de date invalide: Annee-mois-jour (ex: 2019-09-01)"
    );
  }
  if (yn(process.env.LOG)) {
    console.log(
      `[${new Date().toISOString()}] Starting plannings fetch ${
        building ? "for " + building : ""
      }from ${start} to ${end}`
    );
  }
  try {
    const req = new URLSearchParams();
    const params = {
      start,
      end,
      resType: "102",
      calView: "agendaDay",
      "federationIds[]": rooms,
      colourScheme: "3"
    };
    for (let i = 0; i < Object.keys(params).length; i++) {
      const p = Object.keys(params)[i];
      if (Array.isArray(params[p])) {
        params[p].forEach(e => req.append(p, e));
      } else {
        req.append(p, params[p]);
      }
    }
    let plannings = await (await fetch(
      "https://edt.univ-tlse3.fr/calendar2/Home/GetCalendarData",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: req.toString()
      }
    )).json();
    if (yn(process.env.LOG)) {
      console.log(
        `[${new Date().toISOString()}] Plannings fetching is done ${
          building ? "for " + building : ""
        }`
      );
    }
    writeFileSync(
      path.join(__dirname, "..", "temp.json"),
      JSON.stringify(plannings)
    );
    return plannings;
  } catch (e) {
    if (yn(process.env.DEBUG)) {
      console.error(e);
    }
    return null;
  }
}
/**
 * Retrouver la liste compléte des cours.
 * @param {string} building  Le nom du bâtiment reconnue par CELCAT
 */
async function getAllPlannings() {
  const rooms = await Room.find({});
  const plannings = [];
  const months = getMonths(process.env.START, process.env.END);
  for (let i = 0; i < months.length - 1; i++) {
    const start = months[i];
    const end = months[i + 1];
    plannings.push(...(await getPlannings(rooms.map(r => r.slug), start, end)));
  }

  return plannings;
}
/**
 * Transforme les données d'un cours de CELCAT à un objet accepté par le modèle de bdd.
 * @param {Object} data Les données non parsées reçues
 */
function parsePlanning({ start, end, description }) {
  if (!(start && end && description)) return null;
  start = new Date(moment.tz(start, "Europe/Paris").format());
  end = new Date(moment.tz(end, "Europe/Paris").format());
  description = description.match(/^.+(\r|\n|\t)/gi);
  if (!(description && description.length)) return null;
  description = description[0].replace(/(\r|\n|\t)$/, "");
  return { start, end, roomSlug: description };
}

async function updateAllplannings() {
  if (yn(process.env.LOG)) {
    console.log(`[${new Date().toISOString()}] Update all plannings started`);
  }
  await Planning.deleteMany({});
  const plannings = await getAllPlannings();
  for (let planning of plannings) {
    planning = parsePlanning(planning);
    if (planning) {
      new Planning(planning).save();
    }
  }
  if (yn(process.env.LOG)) {
    console.log(
      `[${new Date().toISOString()}] Update all plannings is done succesfully`
    );
  }
}
function checkDateFormat(date) {
  const match = date.toString().match(/20\d\d-\d\d-\d\d/gi);
  return match && match.length;
}

// TODO: doc start & end date(format)
function getMonths(start, end) {
  const months = [];
  for (var m = moment(start); m.isBefore(end); m.add(1, "months")) {
    months.push(m.format("YYYY-MM-DD"));
  }
  return months;
}
/**
 * Trouver les horraires libre pour chaque salle donnée
 * @param {String} room
 * @param {Date} start
 * @param {Date} end
 */
async function getFreePlanningsOneRoom(room, date) {
  // date == undefined => now
  date = moment(date).format("YYYY-MM-DD");
  let start = new Date(moment.tz(date + " 07:45:00", "Europe/Paris").format());
  let end = new Date(moment.tz(date + " 20:00:00", "Europe/Paris").format());
  let plannings = await Planning.find({
    roomSlug: room,
    start: { $gte: start },
    end: {
      $lte: new Date(moment.tz(date + " 24:00:00", "Europe/Paris").format())
    }
  });
  if (!(plannings && plannings.length)) {
    return [{ start, end }];
  }
  plannings = plannings.sort((e1, e2) => e1.start > e2.start);
  console.log("plannings", plannings);
  const freePlannings = [];
  for (const planning of plannings) {
    if (planning.start <= start) {
      start = planning.end;
    } else {
      freePlannings.push({ start, end: planning.start });
      start = planning.end;
    }
  }
  if (start < end) {
    freePlannings.push({ start, end });
  }

  return freePlannings;
}
/**
 * La liste des horraires vide pour chaque salle donnée
 * @param {Room} rooms
 * @param {string} date
 */
async function getFreePlannings(rooms, date) {
  return Promise.all(
    rooms.map(async room => getFreePlanningsOneRoom(room.slug, date))
  );
}
module.exports = { updateAllplannings, getFreePlannings };