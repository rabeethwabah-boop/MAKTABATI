import { Router, type IRouter } from "express";
import healthRouter from "./health";
import levelsRouter from "./levels";
import gradesRouter from "./grades";
import booksRouter from "./books";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(levelsRouter);
router.use(gradesRouter);
router.use(booksRouter);

export default router;
