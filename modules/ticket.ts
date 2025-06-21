import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../db/db";
import {
  tickets,
} from "../db/schemas/ticket.schema";
import { users } from "../db/schemas/user.schema";
import { courses } from "../db/schemas/course.schema";
import { NewTicketEmail, TicketStatusEmail } from "../components/ticket-email";


const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const resend = new Resend(process.env.RESEND_API_KEY);

// Define Elysia schema for query parameters using the enum values
const ticketQuerySchema = {
  userId: t.Optional(t.String()),
  status: t.Optional(t.Enum({
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
  })),
  type: t.Optional(t.Enum({
    TECHNICAL_ISSUE: "TECHNICAL_ISSUE",
    CONTENT_INQUIRY: "CONTENT_INQUIRY",
    BILLING_SUPPORT: "BILLING_SUPPORT",
    ENROLLMENT_SUPPORT: "ENROLLMENT_SUPPORT",
    GENERAL_INQUIRY: "GENERAL_INQUIRY",
  })),
};

export const ticket = new Elysia({ prefix: "/tickets" })
  .use(clerkPlugin())
  // Get all tickets (with filters)
  .get("/", async ({ query, set, auth: getAuth }) => {
    try {
      const { userId, status, type } = query;
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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

      return { data };
    } catch (error) {
      const err = error as Error;
      set.status = 500;
      return { error: err.message || "Failed to fetch tickets" };
    }
  }, { query: ticketQuerySchema })
  
  // Get user's tickets
  .get("/me", async ({ set, auth: getAuth }) => {
    try {
      const auth = getAuth();
      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
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

      return { data };
    } catch (error) {
      const err = error as Error;
      set.status = 500;
      return { error: err.message || "Failed to fetch user tickets" };
    }
  })
  
  // Get a ticket by ID
  .get("/:id", async ({ params: { id }, set, auth: getAuth }) => {
    try {
      const auth = getAuth();
      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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
        set.status = 404;
        return { error: "Ticket not found" };
      }

      return { data };
    } catch (error) {
      const err = error as Error;
      set.status = 500;
      return { error: err.message || "Failed to fetch ticket" };
    }
  }, {
    params: t.Object({
      id: t.String(),
    }),
  })
  
  // Create a new ticket
  .post("/", async ({ body, set, auth: getAuth }) => {
    try {
      const auth = getAuth();
      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const [user] = await db
        .select({
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, auth.userId));

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      let courseName;
      if (body.courseId) {
        const [course] = await db
          .select({
            title: courses.title,
          })
          .from(courses)
          .where(eq(courses.id, body.courseId));
        courseName = course?.title;
      }

      const [ticket] = await db
        .insert(tickets)
        .values({
          ...body,
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

      set.status = 201;
      return { data: ticket };
    } catch (error) {
      const err = error as Error;
      set.status = 500;
      return { error: err.message || "Failed to create ticket" };
    }
  }, {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      priority: t.Enum({
        LOW: "LOW",
        MEDIUM: "MEDIUM",
        HIGH: "HIGH",
        URGENT: "URGENT",
      }),
      type: t.Enum({
        TECHNICAL_ISSUE: "TECHNICAL_ISSUE",
        CONTENT_INQUIRY: "CONTENT_INQUIRY",
        BILLING_SUPPORT: "BILLING_SUPPORT",
        ENROLLMENT_SUPPORT: "ENROLLMENT_SUPPORT",
        GENERAL_INQUIRY: "GENERAL_INQUIRY",
      }),
      courseId: t.Optional(t.String()),
      assignedToId: t.Optional(t.String()),
    }),
  })
  
  // Update a ticket
  .patch("/:id", async ({ params: { id }, body, set, auth: getAuth }) => {
    try {
      const auth = getAuth();
      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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
        set.status = 404;
        return { error: "Ticket not found" };
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

      return { data: updatedTicket };
    } catch (error) {
      const err = error as Error;
      set.status = 500;
      return { error: err.message || "Failed to update ticket" };
    }
  }, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      status: t.Enum({
        OPEN: "OPEN",
        IN_PROGRESS: "IN_PROGRESS",
        RESOLVED: "RESOLVED",
        CLOSED: "CLOSED",
      }),
    }),
  });
