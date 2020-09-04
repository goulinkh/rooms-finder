import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: String,
  slug: String,
  department: String,
  building: String,
});
export interface IRoom {
  name: string;
  slug: string;
  department: string;
  building: string;
}
export const Room = mongoose.model<mongoose.Document & IRoom>(
  "Rooms",
  roomSchema
);
