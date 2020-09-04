import { XmlEntities } from "html-entities";
import moment from "moment-timezone";
import config from "../config";
import { IPlanning, Planning } from "../models/planning";
import { IRoom, Room } from "../models/room";
import { Logger } from "./logger";
import fetch from "node-fetch";

const entities = new XmlEntities();

export class PlanningService {
  constructor(private logger: Logger) {}

  async updateAllPlannings() {
    this.logger.log(`Update all plannings started...`, "PlanningsService");
    await Planning.deleteMany({});
    const plannings = await this.getAllPlannings();
    for (let planning of plannings) {
      const plannings = this.parsePlanning(planning);
      if (plannings && plannings.length) {
        await Promise.all(
          plannings.map((planning: IPlanning) => {
            return new Planning(planning).save();
          })
        );
      }
    }
    this.logger.log(
      `Update all plannings is done successfully`,
      "PlanningsService"
    );
  }

  /**
   * Retrouver la liste compléte des cours.
   * @param {string} building  Le nom du bâtiment reconnue par CELCAT
   */
  private async getAllPlannings() {
    const rooms = await Room.find({});
    this.logger.log(
      `Started plannings fetching for ${rooms.length} Rooms`,
      "PlanningsService"
    );
    const plannings = [];
    const months = this.getMonths(config.planning.start, config.planning.end);
    for (let i = 0; i < months.length - 1; i++) {
      const start = months[i];
      const end = months[i + 1];
      try {
        plannings.push(
          ...(await this.getPlannings(
            rooms.map((r: IRoom) => r.slug),
            start,
            end
          ))
        );
      } catch (e) {
        console.log("e", e);
        this.logger.error(
          `failed to fetch data from ${start} to ${end}`,
          "PlanningsService"
        );
      }
    }

    return plannings;
  }

  private async getPlannings(rooms: string[], start: string, end: string) {
    if (!(this.checkDateFormat(start) || this.checkDateFormat(end))) {
      throw new Error(
        "[custom]Format de date invalide: Annee-mois-jour (ex: 2019-09-01)"
      );
    }
    this.logger.log(
      `Starting plannings fetch from ${start} to ${end}`,
      "PlanningsService"
    );
    try {
      const req = new URLSearchParams();
      const params: any = {
        start,
        end,
        resType: "102",
        calView: "agendaDay",
        "federationIds[]": rooms,
        colourScheme: "3",
      };

      Object.keys(params).forEach((p) => {
        if (Array.isArray(params[p])) {
          params[p].forEach((e: any) => req.append(p, e));
        } else {
          req.append(p, params[p]);
        }
      });

      let plannings = await (
        await fetch(
          "https://edt.univ-tlse3.fr/calendar2/Home/GetCalendarData",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: req.toString(),
          }
        )
      ).json();
      this.logger.log(
        `Got ${plannings.length} plannings from ${start} to ${end}`,
        "PlanningsService"
      );

      return plannings;
    } catch (e) {
      return null;
    }
  }

  /**
   * Transforme les données d'un cours de CELCAT à un objet accepté par le modèle de bdd.
   * @param {Object} data Les données non parsées reçues
   */
  private parsePlanning({
    start,
    end,
    description,
  }: {
    start: Date;
    end: Date;
    description: string;
  }) {
    if (!(start && end && description)) return null;
    start = new Date(moment.tz(start, "Europe/Paris").format());
    end = new Date(moment.tz(end, "Europe/Paris").format());
    description = (description.match(/.+/gi) || [])[0];

    if (!(description && description.length)) return null;
    const rooms = description.split(",").map((e) => entities.decode(e.trim()));
    return rooms.map((roomSlug) => ({ start, end, roomSlug }));
  }

  private checkDateFormat(date: string) {
    const match = date.toString().match(/20\d\d-\d\d-\d\d/gi);
    return match && match.length;
  }

  // TODO: doc start & end date(format)
  private getMonths(start: string, end: string) {
    const months = [];
    for (var m = moment(start); m.isBefore(end); m.add(1, "months")) {
      months.push(m.format("YYYY-MM-DD"));
    }
    return months;
  }

  /**
   * La liste des horraires vide pour chaque salle donnée
   */
  async getFreePlannings(rooms: IRoom[], date: string) {
    return Promise.all(
      rooms.map(async (room) => this.getFreePlanningsOneRoom(room.slug, date))
    );
  }
  /**
   * Trouver les horraires libre pour chaque salle donnée
   * @param {String} room
   * @param {Date} start
   * @param {Date} end
   */
  private async getFreePlanningsOneRoom(room: string, date: string) {
    // date == undefined => now
    const dateStr = moment(date).format("YYYY-MM-DD");
    let start = moment
      .tz(dateStr + " 07:45:00", "Europe/Paris")
      .utc()
      .toDate();
    let end = moment
      .tz(dateStr + " 20:00:00", "Europe/Paris")
      .utc()
      .toDate();
    const day = moment.utc(dateStr).toDate();
    let plannings = await Planning.find({
      roomSlug: room,
      start: { $gte: day },
      end: {
        $lte: new Date(day.getTime() + 24 * 3600 * 1000),
      },
    });

    if (!(plannings && plannings.length)) {
      return [{ start, end }];
    }
    plannings = plannings.sort(
      (e1, e2) => e1.start.getTime() - e2.start.getTime()
    );
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
}
