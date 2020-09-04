import { v1 as uuid } from "uuid";
import express from "express";
import { Logger } from "src/services/logger";

const requestTracker: (logger: Logger) => express.Handler = function (logger) {
  return (req, _res, next) => {
    Object.assign(req, { id: uuid() });
    logger.log(`${(req as any).id} ${req.ip} ${req.url}`, "Request");
    next();
  };
};

export default requestTracker;
