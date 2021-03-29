import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import config from "./config";
import { Controller } from "./controllers/controller.interface";
import { PingsController } from "./controllers/pings";
import { PlanningsController } from "./controllers/plannings";
import requestTracker from "./middlewares/request-tracker";
import { Logger } from "./services/logger";
import { PlanningService } from "./services/planning";
import { RoomsService } from "./services/rooms";

const PORT = config.server.port;

export class Server {
  app: express.Application;
  init: Promise<any>;
  middlewares: express.Handler[];
  constructor(
    private logger: Logger,
    private roomsService: RoomsService,
    private planningService: PlanningService
  ) {
    this.app = express();
    this.init = this.initialize();
  }

  async initialize() {
    this.middlewares = [helmet(), cors(), requestTracker(this.logger)];

    const pingsController = new PingsController();
    const planningsController = new PlanningsController(
      this.roomsService,
      this.planningService
    );
    this.app.use(...this.middlewares);
    this.applyController({
      controller: pingsController,
      baseRoute: "/",
      name: "PingsController",
    });
    this.applyController({
      controller: planningsController,
      baseRoute: "/",
      name: "PlanningsController",
    });
    this.app.use(this.errorsHandler);
  }
  private errorsHandler(
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: Function
  ) {
    if (err && !res.headersSent) {
      if (err.message && err.message.match(/^\[custom\]/gi)) {
        res
          .status(404)
          .json({ message: err.message.replace(/^\[custom\]/gi, "") });
      } else {
        res.status(404).send({ message: "Requête invalide" });
      }
    }
  }
  private applyController({
    baseRoute = "",
    controller,
    name = "",
  }: {
    baseRoute?: string;
    name?: string;
    controller: Controller;
  }) {
    controller.routes.forEach((route) => {
      this.app[route.method](
        path.join(baseRoute, route.path),

        route.handler
      );
      this.logger.log(
        `${route.method.toUpperCase()} ${route.path} -> ${name}`,
        "Server"
      );
    });
  }

  async start() {
    await this.init;
    this.app.listen(PORT, "0.0.0.0", () =>
      this.logger.log(`HTTP server listening on 0.0.0.0:${PORT}`, "Server")
    );
  }
}
