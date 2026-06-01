import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp, { type Options as PinoHttpOptions, type SerializedRequest, type SerializedResponse } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const pinoOptions: PinoHttpOptions = {
  logger,
  serializers: {
    req(req: Request): SerializedRequest {
      return {
        id: (req as any).id, // id may not exist on Express.Request by default
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res: Response): SerializedResponse {
      return {
        statusCode: res.statusCode,
      };
    },
  },
};

app.use(pinoHttp(pinoOptions));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
