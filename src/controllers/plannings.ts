import { PlanningService } from "src/services/planning";
import { RoomsService } from "src/services/rooms";
import buildings from "../assets/buildings.json";
import { Controller, Handler, Route } from "./controller.interface";

export class PlanningsController implements Controller {
  routes: Route[];
  constructor(
    private roomsService: RoomsService,
    private planningService: PlanningService
  ) {
    this.routes = [
      { handler: this.getFreeRooms, method: "get", path: "/" },
      { handler: this.getAllBuildings, method: "get", path: "/buildings" },
      { handler: this.getRooms, method: "get", path: "/rooms/:building" },
      { handler: this.getRooms, method: "get", path: "/rooms" },
    ];
  }

  private getFreeRooms: Handler = async (req, res, next) => {
    try {
      const place = req.query.place as string;
      const date = req.query.date as string;
      if (!place && !date) {
        throw new Error(
          "[custom]Il faut donner une salle ou un bâtiment (query: place=exp&[date=YYYY-MM-DD])"
        );
      }
      let rooms = await this.roomsService.searchRooms(place);
      const plannings = (
        await this.planningService.getFreePlannings(rooms, date)
      ).map((freeSchedules, i) => ({
        room: rooms[i].name,
        building: rooms[i].building,
        freeSchedules,
      }));
      res.jsonc(plannings);
    } catch (e) {
      next(e);
    }
  };

  private getAllBuildings: Handler = async (_req, res, next) => {
    try {
      res.jsonc(buildings.map((b) => ({ name: b })));
    } catch (e) {
      next(e);
    }
  };

  private getRooms: Handler = async (req, res, next) => {
    try {
      let building = req.params.building as string;
      if (!building) building = req.query.building as string;
      res.jsonc(await this.roomsService.getRoomsByBuilding(building));
    } catch (e) {
      next(e);
    }
  };
}
