import { Logger } from "./logger";
import buildings from "../assets/buildings.json";
import { Room, IRoom } from "../models/room";
import fetch from "node-fetch";

interface EDTRoom {
  id: string;
  text: string;
  dept: string;
}

export class RoomsService {
  constructor(private logger: Logger) {}

  async updateRooms() {
    this.logger.log(`Updating rooms list...`, "RoomsService");
    try {
      const allRooms = await this.getAllRooms();
      const rooms = allRooms
        .map((r) => this.recognizeRoom(r))
        .filter((r) => r.building);
      // Update the db
      await Room.deleteMany({});
      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        try {
          await new Room({
            name: room.text,
            slug: room.id,
            department: room.dept,
            building: room.building,
          }).save();
        } catch (e) {
          this.logger.log("Failed to create db object for : ", room.text);
        }
      }
      this.logger.log(`Rooms update is done`, "RoomsService");
    } catch (e) {
      this.logger.error(`Failed to update rooms list: ${e}`, "RoomsService");
    }
  }

  private recognizeRoom(room: EDTRoom) {
    const guesses = buildings.filter((b) => {
      if (b.match(new RegExp(`salles\\s.*`, "gi"))) {
        b = b.replace(new RegExp(`salles\\s`, "gi"), "");
        return room.text.match(new RegExp(`FSI\\s/\\s${b}`, "gi"));
      }
      return room.text.match(new RegExp(`(${b}\\s*-|\\(${b}\\))`, "gi"));
    });
    return {
      ...room,
      text: room.text.replace(/\(.*\)\s*$/gi, "").trim(),
      building: guesses[0],
    };
  }

  private async getAllRooms(): Promise<EDTRoom[]> {
    const rooms = [];
    const globalQuery = "fsi ";
    let rep = await this.getRooms(globalQuery, 1);
    rooms.push(...rep.results);
    let i = 2;
    while (rep.total && rep.total > 100 && rep.results && rep.results.length) {
      // There is more
      rep = await this.getRooms(globalQuery, i);
      rooms.push(...rep.results);
      ++i;
    }
    return rooms;
  }

  private async getRooms(query: string, pageNumber: number) {
    try {
      const room = await (
        await fetch(
          `https://edt.univ-tlse3.fr/calendar2/Home/ReadResourceListItems?myResources=false&searchTerm=${query}&pageSize=100&pageNumber=${pageNumber}&resType=102`
        )
      ).json();
      return room;
    } catch (e) {
      return null;
    }
  }

  async searchRooms(query: string) {
    let rooms = await Room.find({
      // (FSI / )(Amphi) query (...etc)
      name: {
        $regex: new RegExp(`(${query}|^(.+\\/)\\s*(Amphi)?\\s*${query}.*)`),
        $options: "i",
      },
    });
    if (!rooms.length) {
      rooms = await Room.find({ slug: query });
    }
    if (!rooms.length) {
      rooms = await Room.find({ name: query });
    }
    return rooms;
  }

  async getRoomsByBuilding(building: string) {
    try {
      return (
        await Room.find({
          building: { $regex: new RegExp(`^${building}$`, "gi") },
        })
      ).map((e: IRoom) => ({
        name: e.name,
        building: e.building,
      }));
    } catch (e) {
      return [];
    }
  }
}
