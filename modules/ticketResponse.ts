import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { db } from "../db/db";
import { ticketResponses } from "../db/schemas/ticketResponse.schema";
import { tickets } from "../db/schemas/ticket.schema";
import { users } from "../db/schemas/user.schema";
import { TicketResponseEmail } from "../components/ticket-email";
import logger from "../utils/logger";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const resend = new Resend(process.env.RESEND_API_KEY);

export const ticketResponse = new Elysia({ prefix: "/tickets" })
  .use(clerkPlugin())
  // Get all responses for a ticket
  .get(
    "/:id/responses",
    async ({ params: { id }, set, auth: getAuth }) => {
      try {
        const auth = getAuth();
        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const responses = await db
          .select()
          .from(ticketResponses)
          .where(eq(ticketResponses.ticketId, id))
          .orderBy(ticketResponses.createdAt);

        return { data: responses };
      } catch (error) {
        logger.error("Error fetching ticket responses:", error);
        set.status = 500;
        return { error: "Failed to fetch ticket responses" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  // Create a new response
  .post(
    "/:id/responses",
    async ({ params: { id }, body, set, auth: getAuth }) => {
      try {
        const auth = getAuth();
        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        // Verify ticket exists and get ticket info
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
            ...body,
            ticketId: id,
            userId: auth.userId,
          })
          .returning();

        try {
          // Send email to ticket owner if the response is from someone else
          if (ticket.userId !== auth.userId) {
            const userEmailContent = TicketResponseEmail({
              ticketId: ticket.id,
              ticketTitle: ticket.title,
              responseContent: body.content,
              responderName: "Support Team",
              recipientName: ticketOwner.name,
            });

            await resend.emails.send({
              from: "Ecobank Elevate <noreply@communication.devprodtest.services>",
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
              responseContent: body.content,
              responderName: responder.name,
              recipientName: "Admin",
            });

            await resend.emails.send({
              from: "Ecobank Elevate <noreply@communication.devprodtest.services>",
              to: ADMIN_EMAIL,
              subject: `New Response to Ticket: ${ticket.title}`,
              html: adminEmailContent,
            });
          }
        } catch (emailError) {
          console.error("Error sending ticket response email:", emailError);
          // Don't return error to client, just log it
        }

        set.status = 201;
        return { response: newResponse[0] };
      } catch (error) {
        logger.error("Error creating ticket response:", error);
        const err = error as Error;
        set.status = 500;
        return { error: err.message || "Failed to create ticket response" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        content: t.String({ minLength: 1 }),
        attachments: t.Optional(t.Array(t.String())),
      }),
    },
  );
