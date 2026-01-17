import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const requests = pgTable("requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tier: text("tier").notNull().$type<'basic' | 'middle' | 'custom'>(),
  status: text("status").notNull().$type<'pending' | 'processing' | 'completed' | 'rejected'>().default('pending'),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  description: text("description").notNull(),
  response: text("response"),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Admin schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
});
export const selectAdminSchema = createSelectSchema(admins);

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Request schemas
export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  status: true,
  response: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRequestSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'rejected']).optional(),
  response: z.string().optional(),
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type UpdateRequest = z.infer<typeof updateRequestSchema>;
export type Request = typeof requests.$inferSelect;
