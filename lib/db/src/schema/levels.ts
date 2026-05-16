import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const levelsTable = pgTable("levels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description").notNull().default(""),
  gradeRange: text("grade_range").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  order: integer("order").notNull(),
});

export const insertLevelSchema = createInsertSchema(levelsTable).omit({ id: true });
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type Level = typeof levelsTable.$inferSelect;
