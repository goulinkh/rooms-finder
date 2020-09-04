import express from "express";

export type Handler = express.RequestHandler;

export interface Route {
  handler: Handler;
  method: "get" | "post" | "put" | "delete" | "head";
  path: string;
}

export interface Controller {
  routes: Route[];
}
