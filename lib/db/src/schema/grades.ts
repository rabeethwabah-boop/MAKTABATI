import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { levelsTable } from "./levels";

export const gradesTable = pgTable("grades", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  levelId: integer("level_id").notNull().references(() => levelsTable.id),
  order: integer("order").notNull(),
});

export const insertGradeSchema = createInsertSchema(gradesTable).omit({ id: true });
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof gradesTable.$inferSelect;
