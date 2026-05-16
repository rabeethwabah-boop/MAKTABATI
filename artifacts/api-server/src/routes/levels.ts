import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, levelsTable, gradesTable } from "@workspace/db";
import {
  GetGradesByLevelParams,
  GetLevelsResponse,
  GetGradesByLevelResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/levels", async (_req, res): Promise<void> => {
  const levels = await db
    .select()
    .from(levelsTable)
    .orderBy(levelsTable.order);
  res.json(GetLevelsResponse.parse(levels.map((l) => ({
    ...l,
    nameAr: l.nameAr,
    gradeRange: l.gradeRange,
  }))));
});

router.get("/levels/:id/grades", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetGradesByLevelParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const grades = await db
    .select()
    .from(gradesTable)
    .where(eq(gradesTable.levelId, parsed.data.id))
    .orderBy(gradesTable.order);
  res.json(GetGradesByLevelResponse.parse(grades.map((g) => ({
    ...g,
    nameAr: g.nameAr,
    levelId: g.levelId,
  }))));
});

export default router;
