import { Hono } from "hono";
import { Resend } from "resend";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { eq } from "drizzle-orm";
import { Webhook } from "svix";
import { EmailTemplate } from "../components/welcome-email";
import { Roles } from "../utils/enums";
import { users } from "../db/schemas/user.schema";
import { db } from "../db/db";
import { WebhookEvent } from "@clerk/backend";

const resend = new Resend(process.env.RESEND_API_KEY);

const app = new Hono()
  .post("/", async (c) => {
    try {
      const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

      if (!WEBHOOK_SECRET) {
        return c.json(
          {
            message: "WEBHOOK_SECRET is not set",
          },
          400,
        );
      }

      const svix_id = c.req.header("svix-id");
      const svix_timestamp = c.req.header("svix-timestamp");
      const svix_signature = c.req.header("svix-signature");

      if (!svix_id || !svix_timestamp || !svix_signature) {
        return c.json({ message: "Missing svix headers" }, 400);
      }

      const body = await c.req.json();

      const wh = new Webhook(WEBHOOK_SECRET);

      const evt: WebhookEvent = wh.verify(JSON.stringify(body), {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;

      const { type, data } = evt;

      if (type === "user.created") {
        const {
          id: clerkUserId,
          email_addresses,
          first_name,
          last_name,
          image_url,
          primary_email_address_id,
        } = data;

        await db.insert(users).values({
          id: clerkUserId,
          email:
            email_addresses.find(
              (email) => email.id === primary_email_address_id,
            )?.email_address || email_addresses[0].email_address,
          name: first_name + " " + last_name,
          role: Roles.STUDENT,
          avatarUrl: image_url,
        });

        const htmlContent = EmailTemplate({
          firstName:
            first_name || email_addresses[0].email_address.split("@")[0],
        });

        await resend.emails.send({
          from: "Law Tech University <noreply@trainings.lawyershub.org>",
          to:
            email_addresses.find(
              (email: { id: any }) => email.id === primary_email_address_id,
            )?.email_address || email_addresses[0].email_address,
          subject: "Welcome to Law Tech University",
          html: htmlContent,
        });

        return c.json({ message: "User saved and welcome email sent" });
      } else if (type === "user.updated") {
        const {
          id: clerkUserId,
          email_addresses,
          first_name,
          last_name,
          image_url,
          primary_email_address_id,
        } = data;

        await db
          .update(users)
          .set({
            email:
              email_addresses.find(
                (email) => email.id === primary_email_address_id,
              )?.email_address || email_addresses[0].email_address,
            name: first_name + " " + last_name,
            avatarUrl: image_url,
          })
          .where(eq(users.id, clerkUserId));

        return c.json({ message: "User updated" });
      }

      return c.json({ message: "Invalid event type" }, 400);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Something went wrong" }, 500);
    }
  })
  .get("/", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "You got me hehe" }, 401);
    }

    const data = await db.select().from(users);

    return c.json({ data });
  });

export default app;
