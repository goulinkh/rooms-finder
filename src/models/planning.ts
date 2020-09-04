import mongoose from "mongoose";

const planningSchema = new mongoose.Schema({
  roomSlug: String,
  start: Date,
  end: Date,
});

export interface IPlanning {
  roomSlug: string;
  start: Date;
  end: Date;
}

export const Planning = mongoose.model<mongoose.Document & IPlanning>(
  "Plannings",
  planningSchema
);
