import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/backend";

import { EmailTemplate } from "../components/welcome-email";
import { Roles } from "../utils/enums";
import { users } from "../db/schemas/user.schema";
import { db } from "../db/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export const user = new Elysia({ prefix: "/users" })
  // Webhook handler for Clerk user events
  .post("/", async ({ request, set }) => {
    try {
      const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

      if (!WEBHOOK_SECRET) {
        set.status = 400;
        return { message: "WEBHOOK_SECRET is not set" };
      }

      const svix_id = request.headers.get("svix-id");
      const svix_timestamp = request.headers.get("svix-timestamp");
      const svix_signature = request.headers.get("svix-signature");

      if (!svix_id || !svix_timestamp || !svix_signature) {
        set.status = 400;
        return { message: "Missing svix headers" };
      }

      const body = await request.json();

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
          from: "Ecobank Elevate <noreply@communication.devprodtest.services>",
          to:
            email_addresses.find(
              (email: { id: any }) => email.id === primary_email_address_id,
            )?.email_address || email_addresses[0].email_address,
          subject: "Welcome to Ecobank Elevate",
          html: htmlContent,
        });

        return { message: "User saved and welcome email sent" };
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

        return { message: "User updated" };
      }

      set.status = 400;
      return { message: "Invalid event type" };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return { error: "Something went wrong" };
    }
  })
  // Get all users (requires authentication)
  .use(clerkPlugin())
  .get("/", async ({ set, auth: getAuth }) => {
    const auth = getAuth();

    if (!auth?.userId) {
      set.status = 401;
      return { error: "You got me hehe" };
    }

    const data = await db.select().from(users);

    return { data };
  });
