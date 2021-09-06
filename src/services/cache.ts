import { createClient } from "redis";
import { RedisClientType } from "redis/dist/lib/client";
import { RedisModules } from "redis/dist/lib/commands";
import { RedisLuaScripts } from "redis/dist/lib/lua-script";
import config from "../config";
import { Logger } from "./logger";

export class CacheManager {
  private client: RedisClientType<RedisModules, RedisLuaScripts>;

  constructor(private logger: Logger) {}

  async connect() {
    try {
      this.client = createClient({
        socket: { host: "cache", password: config.server.redisPassword },
      });
      await this.client.connect();
      this.logger.log("Connected to the cache server", "CacheManager");
      return;
    } catch (e) {
      this.logger.error(`Redis connection problem, ${e}`, "CacheManager");
      throw new Error("failed to connect to the Cache server");
    }
  }

  getClient() {
    return this.client;
  }

  get(url: string) {
    return this.client.get(url);
  }

  set(url: string, value: string) {
    return this.client.set(url, value);
  }

  flush() {
    return this.client.flushAll();
  }
}
