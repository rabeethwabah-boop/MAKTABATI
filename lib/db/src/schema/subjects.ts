import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { gradesTable } from "./grades";

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  gradeId: integer("grade_id").notNull().references(() => gradesTable.id),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;
