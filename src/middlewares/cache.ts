import express from "express";
import { CacheManager } from "src/services/cache";
import { Logger } from "src/services/logger";

const cache: (logger: Logger, cacheManager: CacheManager) => express.Handler =
  function (logger, cacheManager) {
    return async (req, res, next) => {
      const value = await cacheManager.get(req.url);
      console.log(`req.url`, req.url);
      if (value) {
        logger.log(`${req.id} using cache...`);
        res.json(JSON.parse(value));
      } else {
        res.jsonc = (reply: any) => {
          cacheManager.set(req.url, JSON.stringify(reply));
          res.json(reply);
        };
        next();
      }
    };
  };

export default cache;
