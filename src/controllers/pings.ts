import express from "express";
import { Controller, Route } from "./controller.interface";

export class PingsController implements Controller {
  routes: Route[];
  constructor() {
    this.routes = [{ handler: this.getPing, method: "get", path: "/ping" }];
  }

  getPing(_req: express.Request, res: express.Response) {
    res.json({
      message: "pong",
      serverTime: new Date(),
    });
  }
}
