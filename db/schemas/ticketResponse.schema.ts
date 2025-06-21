import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { tickets } from "./ticket.schema";
import { users } from "./user.schema";

export const ticketResponses = pgTable("ticket_responses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => tickets.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Define relationships
export const ticketResponsesRelations = relations(
  ticketResponses,
  ({ one }) => ({
    ticket: one(tickets, {
      fields: [ticketResponses.ticketId],
      references: [tickets.id],
    }),
    user: one(users, {
      fields: [ticketResponses.userId],
      references: [users.id],
    }),
  }),
);

// Zod schemas for validation
export const insertTicketResponseSchema = createInsertSchema(
  ticketResponses,
).extend({
  content: z.string().min(1, "Response content cannot be empty"),
  attachments: z.array(z.string()).optional(),
}).omit({
  userId: true,
  ticketId: true,
  createdAt: true,
  updatedAt: true,
  id: true,
});

export const selectTicketResponseSchema = createSelectSchema(ticketResponses);

export type TicketResponse = z.infer<typeof selectTicketResponseSchema>;
export type NewTicketResponse = z.infer<typeof insertTicketResponseSchema>;
