import mongoose from "mongoose";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: Promise<typeof mongoose> | undefined;
}

export function dbConnect(): Promise<typeof mongoose> {
  if (!global.__mongooseConn) {
    global.__mongooseConn = mongoose.connect(env.mongodbUri(), {
      maxPoolSize: 10,
    });
  }
  return global.__mongooseConn;
}
