import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { json, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courses } from "./course.schema";
import { users } from "./user.schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { ticketResponses } from "./ticketResponse.schema";

export const ticketTypeEnum = pgEnum("ticket_type", [
  "TECHNICAL_ISSUE",
  "CONTENT_INQUIRY",
  "BILLING_SUPPORT",
  "ENROLLMENT_SUPPORT",
  "GENERAL_INQUIRY",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const tickets = pgTable("tickets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseId: text("course_id").references(() => courses.id),
  type: ticketTypeEnum("type").notNull(),
  status: ticketStatusEnum("status").notNull().default("OPEN"),
  priority: ticketPriorityEnum("priority").notNull().default("MEDIUM"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  attachments: json("attachments").$type<string[]>().default([]),
  assignedToId: text("assigned_to_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Define relationships
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [tickets.courseId],
    references: [courses.id],
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
  }),
  responses: many(ticketResponses),
}));

// Create Zod schemas for validation
export const insertTicketSchema = createInsertSchema(tickets)
  .extend({
    attachments: z.array(z.string()).optional(),
    type: z.enum(ticketTypeEnum.enumValues, {
      required_error: "Ticket type is required",
    }),
    title: z.string({
      required_error: "Title is required",
    }),
    description: z.string({
      required_error: "Description is required",
    }),
  })
  .omit({
    userId: true,
    assignedToId: true,
    priority: true,
    status: true,
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const selectTicketSchema = createSelectSchema(tickets);

export type Ticket = z.infer<typeof selectTicketSchema>;
export type NewTicket = z.infer<typeof insertTicketSchema>;
