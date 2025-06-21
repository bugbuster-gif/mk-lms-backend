import { Context, Hono } from "hono";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { z } from "zod";
import {
  insertTicketResponseSchema,
  ticketResponses,
} from "../db/schemas/ticketResponse.schema";
import { tickets } from "../db/schemas/ticket.schema";
import { users } from "../db/schemas/user.schema";
import logger from "../utils/logger";
import { config } from "dotenv";
import { Resend } from "resend";
import { TicketResponseEmail } from "../components/ticket-email";

config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to get all responses for a ticket
async function getTicketResponsesHandler(c: Context) {
  try {
    const ticketId = c.req.param("ticketId");

    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const responses = await db
      .select()
      .from(ticketResponses)
      .where(eq(ticketResponses.ticketId, ticketId))
      .orderBy(ticketResponses.createdAt);

    return c.json({ data: responses });
  } catch (error) {
    logger.error("Error fetching ticket responses:", error);
    return c.json({ error: "Failed to fetch ticket responses" }, 500);
  }
}

// Function to create a new response
async function createTicketResponseHandler(c: Context) {
  try {
    const ticketId = c.req.param("ticketId");

    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Verify ticket exists and get ticket info
    const [ticket] = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        userId: tickets.userId,
      })
      .from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    const body = await c.req.json();
    const validatedData = insertTicketResponseSchema.safeParse(body);

    if (!validatedData.success) {
      return c.json({ error: validatedData.error.issues }, 400);
    }

    // Get responder info
    const [responder] = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, auth.userId));

    // Get ticket owner info
    const [ticketOwner] = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, ticket.userId));

    const newResponse = await db
      .insert(ticketResponses)
      .values({
        ...validatedData.data,
        ticketId,
        userId: auth.userId,
      })
      .returning();

    try {
      // Send email to ticket owner if the response is from someone else
      if (ticket.userId !== auth.userId) {
        const userEmailContent = TicketResponseEmail({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          responseContent: validatedData.data.content,
          responderName: "Support Team",
          recipientName: ticketOwner.name,
        });

        await resend.emails.send({
          from: "Law Tech University <noreply@trainings.lawyershub.org>",
          to: ticketOwner.email,
          subject: `New Response to Your Ticket: ${ticket.title}`,
          html: userEmailContent,
        });
      }

      // Always send email to admin if the response is from the ticket owner
      if (ticket.userId === auth.userId) {
        const adminEmailContent = TicketResponseEmail({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          responseContent: validatedData.data.content,
          responderName: responder.name,
          recipientName: "Admin",
        });

        await resend.emails.send({
          from: "Law Tech University <noreply@trainings.lawyershub.org>",
          to: ADMIN_EMAIL,
          subject: `New Response to Ticket: ${ticket.title}`,
          html: adminEmailContent,
        });
      }
    } catch (emailError) {
      console.error("Error sending ticket response email:", emailError);
      // Don't return error to client, just log it
    }

    return c.json({ response: newResponse[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    logger.error("Error creating ticket response:", error);
    const err = error as Error;
    return c.json(
      { error: err.message || "Failed to create ticket response" },
      500,
    );
  }
}

// Create app with routes
const app = new Hono()
  .use("/*", clerkMiddleware())
  .get("/:ticketId/responses", getTicketResponsesHandler)
  .post("/:ticketId/responses", createTicketResponseHandler);

export default app;
