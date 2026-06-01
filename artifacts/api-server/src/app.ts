import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const pinoOptions = {
  logger,
  serializers: {
    req(req: any) {
      return {
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res: any) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
};

// @ts-ignore
app.use(pinoHttp(pinoOptions));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
