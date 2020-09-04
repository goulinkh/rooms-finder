import { Server } from "./server";
import { DatabaseManager } from "./services/db";
import { Logger } from "./services/logger";
import { RoomsService } from "./services/rooms";
import schedule from "node-schedule";
import { PlanningService } from "./services/planning";

async function bootstrap() {
  const logger = new Logger();
  const databaseManager = new DatabaseManager(logger);
  await databaseManager.connect();
  let roomsService: RoomsService;
  let planningService: PlanningService;

  try {
    roomsService = new RoomsService(logger);
    planningService = new PlanningService(logger);
    await roomsService.updateRooms();
    await planningService.updateAllPlannings();
  } catch (e) {
    logger.error(`Failed to update all plannings ${e}`, "Bootstrap");
  }

  // update plannings cron
  schedule.scheduleJob("0 */2 * * *", async () => {
    try {
      logger.log(`plannings update started`, "Cron");
      await planningService.updateAllPlannings();
    } catch (e) {
      logger.error(`Failed to update all plannings ${e}`, "Cron");
    }
  });

  const server = new Server(logger, roomsService!, planningService!);
  await server.start();
}

bootstrap();
