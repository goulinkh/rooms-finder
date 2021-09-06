import schedule from "node-schedule";
import { Server } from "./server";
import { CacheManager } from "./services/cache";
import { DatabaseManager } from "./services/db";
import { Logger } from "./services/logger";
import { PlanningService } from "./services/planning";
import { RoomsService } from "./services/rooms";

async function scheduledUpdateTask(
  logger: Logger,
  cacheManager: CacheManager,
  roomsService: RoomsService,
  planningService: PlanningService
) {
  try {
    logger.log(`rooms and plannings update started`, "Cron");
    await roomsService.updateRooms();
    await planningService.updateAllPlannings();
    await cacheManager.flush();
  } catch (e) {
    logger.error(`Failed to update all plannings ${e}`, "Cron");
  }
}

async function bootstrap() {
  const logger = new Logger();
  const databaseManager = new DatabaseManager(logger);
  await databaseManager.connect();

  const cacheManager = new CacheManager(logger);
  await cacheManager.connect();

  let roomsService: RoomsService;
  let planningService: PlanningService;
  roomsService = new RoomsService(logger);
  planningService = new PlanningService(logger);

  await scheduledUpdateTask(
    logger,
    cacheManager,
    roomsService,
    planningService
  );

  // update plannings cron (every 2 hours)
  schedule.scheduleJob("0 */2 * * *", () =>
    scheduledUpdateTask(logger, cacheManager, roomsService, planningService)
  );

  const server = new Server(
    logger,
    cacheManager,
    roomsService!,
    planningService!
  );
  await server.start();
}

bootstrap();
