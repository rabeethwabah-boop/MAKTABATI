import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";
import { gradesTable } from "./grades";
import { levelsTable } from "./levels";

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id),
  gradeId: integer("grade_id").notNull().references(() => gradesTable.id),
  levelId: integer("level_id").notNull().references(() => levelsTable.id),
  type: text("type").notNull().default("book"),
  coverColor: text("cover_color").notNull().default("#3b82f6"),
  coverImage: text("cover_image"),
  description: text("description"),
  pages: integer("pages"),
  downloadUrl: text("download_url"),
});

export const insertBookSchema = createInsertSchema(booksTable).omit({ id: true });
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;
