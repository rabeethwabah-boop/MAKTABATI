import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, gradesTable, subjectsTable } from "@workspace/db";
import {
  GetGradeParams,
  GetGradeResponse,
  GetGradesResponse,
  GetSubjectsByGradeParams,
  GetSubjectsByGradeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/grades", async (_req, res): Promise<void> => {
  const grades = await db
    .select()
    .from(gradesTable)
    .orderBy(gradesTable.order);
  res.json(GetGradesResponse.parse(grades.map((g) => ({
    ...g,
    nameAr: g.nameAr,
    levelId: g.levelId,
  }))));
});

router.get("/grades/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetGradeParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [grade] = await db
    .select()
    .from(gradesTable)
    .where(eq(gradesTable.id, parsed.data.id));
  if (!grade) {
    res.status(404).json({ error: "Grade not found" });
    return;
  }
  res.json(GetGradeResponse.parse({ ...grade, nameAr: grade.nameAr, levelId: grade.levelId }));
});

router.get("/grades/:id/subjects", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetSubjectsByGradeParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const subjects = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.gradeId, parsed.data.id));
  res.json(GetSubjectsByGradeResponse.parse(subjects.map((s) => ({
    ...s,
    nameAr: s.nameAr,
    gradeId: s.gradeId,
  }))));
});

export default router;
