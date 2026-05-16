import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { Readable } from "stream";
import { db, booksTable, subjectsTable, gradesTable } from "@workspace/db";
import {
  GetBooksBySubjectParams,
  GetBooksBySubjectResponse,
  GetBooksQueryParams,
  GetBooksResponse,
  GetBookParams,
  GetBookResponse,
  GetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subjects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBooksBySubjectParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.id, parsed.data.id));
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  const { GetSubjectResponse } = await import("@workspace/api-zod");
  res.json(GetSubjectResponse.parse(subject));
});

router.get("/subjects/:id/books", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBooksBySubjectParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.subjectId, parsed.data.id));
  res.json(GetBooksBySubjectResponse.parse(books.map((b) => ({
    ...b,
    coverColor: b.coverColor,
    coverImage: b.coverImage ?? null,
    description: b.description ?? null,
    pages: b.pages ?? null,
    downloadUrl: b.downloadUrl ?? null,
    subjectId: b.subjectId,
    gradeId: b.gradeId,
    levelId: b.levelId,
  }))));
});

router.get("/books", async (req, res): Promise<void> => {
  const parsed = GetBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conditions = [];
  if (parsed.data.gradeId) {
    conditions.push(eq(booksTable.gradeId, Number(parsed.data.gradeId)));
  }
  if (parsed.data.levelId) {
    conditions.push(eq(booksTable.levelId, Number(parsed.data.levelId)));
  }
  if (parsed.data.type) {
    conditions.push(eq(booksTable.type, parsed.data.type));
  }

  const books = conditions.length > 0
    ? await db.select().from(booksTable).where(and(...conditions))
    : await db.select().from(booksTable);

  res.json(GetBooksResponse.parse(books.map((b) => ({
    ...b,
    coverColor: b.coverColor,
    coverImage: b.coverImage ?? null,
    description: b.description ?? null,
    pages: b.pages ?? null,
    downloadUrl: b.downloadUrl ?? null,
    subjectId: b.subjectId,
    gradeId: b.gradeId,
    levelId: b.levelId,
  }))));
});

router.get("/books/:id/view", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
  if (!book || !book.downloadUrl) { res.status(404).json({ error: "Not found" }); return; }

  try {
    const upstream = await fetch(book.downloadUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Maktabati/1.0)" },
    });
    if (!upstream.ok) { res.status(502).json({ error: "Upstream error" }); return; }

    res.setHeader("Content-Type", upstream.headers.get("Content-Type") || "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    if (upstream.headers.get("Content-Length")) {
      res.setHeader("Content-Length", upstream.headers.get("Content-Length")!);
    }
    const nodeStream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
    nodeStream.pipe(res);
    nodeStream.on("error", () => res.end());
  } catch {
    res.status(502).json({ error: "Proxy error" });
  }
});

router.get("/books/:id/download", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number(raw);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
  if (!book || !book.downloadUrl) { res.status(404).json({ error: "Not found" }); return; }

  try {
    const upstream = await fetch(book.downloadUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Maktabati/1.0)" },
    });
    if (!upstream.ok) { res.status(502).json({ error: "Upstream error" }); return; }

    const safeName = book.title.replace(/[^\u0600-\u06FFa-zA-Z0-9 ._-]/g, "_").trim();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(safeName + ".pdf")}`);
    if (upstream.headers.get("Content-Length")) {
      res.setHeader("Content-Length", upstream.headers.get("Content-Length")!);
    }
    const nodeStream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
    nodeStream.pipe(res);
    nodeStream.on("error", () => res.end());
  } catch {
    res.status(502).json({ error: "Proxy error" });
  }
});

router.get("/books/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBookParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [book] = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, parsed.data.id));
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.json(GetBookResponse.parse({
    ...book,
    coverColor: book.coverColor,
    coverImage: book.coverImage ?? null,
    description: book.description ?? null,
    pages: book.pages ?? null,
    downloadUrl: book.downloadUrl ?? null,
    subjectId: book.subjectId,
    gradeId: book.gradeId,
    levelId: book.levelId,
  }));
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [booksCount] = await db
    .select({ count: count() })
    .from(booksTable)
    .where(eq(booksTable.type, "book"));
  const [summariesCount] = await db
    .select({ count: count() })
    .from(booksTable)
    .where(eq(booksTable.type, "summary"));
  const [examsCount] = await db
    .select({ count: count() })
    .from(booksTable)
    .where(eq(booksTable.type, "exam"));
  const [gradesCount] = await db.select({ count: count() }).from(gradesTable);

  res.json(GetStatsResponse.parse({
    totalBooks: Number(booksCount?.count ?? 0),
    totalSummaries: Number(summariesCount?.count ?? 0),
    totalExams: Number(examsCount?.count ?? 0),
    totalGrades: Number(gradesCount?.count ?? 0),
  }));
});

export default router;
