import { Context, Hono } from "hono";
import { db } from "../db/db";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import {
  insertTicketSchema,
  tickets,
  ticketStatusEnum,
  ticketTypeEnum,
} from "../db/schemas/ticket.schema";
import { config } from "dotenv";
import { Resend } from "resend";
import { NewTicketEmail, TicketStatusEmail } from "../components/ticket-email";
import { users } from "../db/schemas/user.schema";
import { courses } from "../db/schemas/course.schema";

config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const resend = new Resend(process.env.RESEND_API_KEY);

const ticketQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.enum(ticketStatusEnum.enumValues).optional(),
  type: z.enum(ticketTypeEnum.enumValues).optional(),
});

// Function to get all tickets (with filters)
async function getAllTicketsHandler(c: Context) {
  try {
    const rawQuery = c.req.query();
    const validatedQuery = ticketQuerySchema.safeParse(rawQuery);

    if (!validatedQuery.success) {
      return c.json({ error: "Invalid query parameters" }, 400);
    }

    const { userId, status, type } = validatedQuery.data;
    const conditions = [];

    if (userId) conditions.push(eq(tickets.userId, userId));
    if (status) conditions.push(eq(tickets.status, status));
    if (type) conditions.push(eq(tickets.type, type));

    const data = await db.query.tickets.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        user: {
          columns: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return c.json({ data });
  } catch (error) {
    const err = error as Error;
    return c.json({ error: err.message || "Failed to fetch tickets" }, 500);
  }
}

// Function to get a ticket by ID
async function getTicketByIdHandler(c: Context) {
  try {
    const { id } = c.req.param();
    const data = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      with: {
        user: {
          columns: {
            name: true,
            avatarUrl: true,
          },
        },
        course: true,
        assignedTo: true,
      },
    });

    if (!data) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    return c.json({ data });
  } catch (error) {
    const err = error as Error;
    return c.json({ error: err.message || "Failed to fetch ticket" }, 500);
  }
}

// Function to create a new ticket
async function createTicketHandler(c: Context) {
  try {
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const validatedData = insertTicketSchema.safeParse(body);

    if (!validatedData.success) {
      return c.json({ error: validatedData.error.issues }, 400);
    }

    const [user] = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, auth.userId));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    let courseName;
    if (validatedData.data.courseId) {
      const [course] = await db
        .select({
          title: courses.title,
        })
        .from(courses)
        .where(eq(courses.id, validatedData.data.courseId));
      courseName = course?.title;
    }

    const [ticket] = await db
      .insert(tickets)
      .values({
        ...validatedData.data,
        userId: auth.userId,
      })
      .returning();

    // Send email to admin
    try {
      const adminEmailContent = NewTicketEmail({
        ticketId: ticket.id,
        title: ticket.title,
        description: ticket.description,
        type: ticket.type,
        priority: ticket.priority,
        userName: user.name,
        courseName,
        isAdmin: true,
      });

      await resend.emails.send({
        from: "Law Tech University <noreply@trainings.lawyershub.org>",
        to: ADMIN_EMAIL,
        subject: `New Ticket: ${ticket.title}`,
        html: adminEmailContent,
      });

      // Send confirmation email to user
      const userEmailContent = NewTicketEmail({
        ticketId: ticket.id,
        title: ticket.title,
        description: ticket.description,
        type: ticket.type,
        priority: ticket.priority,
        userName: user.name,
        courseName,
      });

      await resend.emails.send({
        from: "Law Tech University <noreply@trainings.lawyershub.org>",
        to: user.email,
        subject: "Your Support Ticket Has Been Created",
        html: userEmailContent,
      });
    } catch (emailError) {
      console.error("Failed to send ticket notification email:", emailError);
      // Don't return error to client, just log it
    }

    return c.json({ data: ticket }, 201);
  } catch (error) {
    const err = error as Error;
    return c.json({ error: err.message || "Failed to create ticket" }, 500);
  }
}

// Function to update a ticket
async function updateTicketHandler(c: Context) {
  try {
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { id } = c.req.param();
    const body = await c.req.json();
    const { status } = body;

    const [ticket] = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        userId: tickets.userId,
      })
      .from(tickets)
      .where(eq(tickets.id, id));

    if (!ticket) {
      return c.json({ error: "Ticket not found" }, 404);
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();

    // Get user and admin info for email
    const [user] = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, ticket.userId));

    if (user) {
      try {
        // Send status update email to user
        const userEmailContent = TicketStatusEmail({
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          newStatus: status,
          recipientName: user.name,
          updatedBy: "Support Team",
        });

        await resend.emails.send({
          from: "Law Tech University <noreply@trainings.lawyershub.org>",
          to: user.email,
          subject: `Ticket Status Updated: ${ticket.title}`,
          html: userEmailContent,
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't return error to client, just log it
      }
    }

    return c.json({ data: updatedTicket });
  } catch (error) {
    const err = error as Error;
    return c.json({ error: err.message || "Failed to update ticket" }, 500);
  }
}

// Function to get user's tickets
async function getUserTicketsHandler(c: Context) {
  try {
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const data = await db.query.tickets.findMany({
      where: eq(tickets.userId, auth.userId),
      with: {
        user: {
          columns: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return c.json({ data });
  } catch (error) {
    const err = error as Error;
    return c.json(
      { error: err.message || "Failed to fetch user tickets" },
      500,
    );
  }
}

// Create app with routes
const app = new Hono()
  .use("/*", clerkMiddleware())
  .get("/", getAllTicketsHandler)
  .get("/me", getUserTicketsHandler)
  .get("/:id", getTicketByIdHandler)
  .post("/", zValidator("json", insertTicketSchema), createTicketHandler)
  .patch("/:id", updateTicketHandler);

export default app;
