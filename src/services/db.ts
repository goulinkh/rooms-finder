import mongoose from "mongoose";
import config from "../config";
import { Logger } from "./logger";

export class DatabaseManager {
  constructor(private logger: Logger) {}

  async connect() {
    try {
      await mongoose.connect(config.server.db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      this.logger.log("Connected to the db", "DatabaseManager");
      return;
    } catch (e) {
      this.logger.error(`DB connection problem, ${e}`, "DatabaseManager");
      throw new Error("failed to connect to the DB");
    }
  }
}
