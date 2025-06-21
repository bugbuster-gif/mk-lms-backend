import { Roles } from "../utils/enums";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { UTApi } from "uploadthing/server";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { users } from "../db/schemas/user.schema";
import PDFDocument from "pdfkit";
import path from "path";

const utapi = new UTApi();

const imageTemplatePath = path.join(__dirname, "/files/cert.jpg");

const app = new Hono()
  .post(
    "/:courseId",
    clerkMiddleware(),
    zValidator("param", z.object({ courseId: z.string() })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, auth.userId));

      const doc = new PDFDocument({ layout: "landscape", size: [595, 842] });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));

      const pdfBufferPromise = new Promise<Buffer>((resolve) => {
        doc.on("end", () => resolve(Buffer.concat(buffers)));
      });

      doc.font("Times-BoldItalic");

      doc.image(imageTemplatePath, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
      });

      const maxNameWidth = 400;
      const maxFontSize = 26;
      const minFontSize = 16;

      const calculateOptimalFontSize = (
        text: string,
        maxWidth: number,
        initialFontSize: number,
      ): number => {
        let fontSize = initialFontSize;

        doc.fontSize(fontSize);
        let textWidth = doc.widthOfString(text);

        while (textWidth > maxWidth && fontSize > minFontSize) {
          fontSize--;
          doc.fontSize(fontSize);
          textWidth = doc.widthOfString(text);
        }

        return fontSize;
      };

      const name = user.name;
      const date = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const nameFontSize = calculateOptimalFontSize(
        name,
        maxNameWidth,
        maxFontSize,
      );
      const dateFontSize = calculateOptimalFontSize(date, maxNameWidth, 14);

      const nameY = 295;
      const dateY = 450;

      const pageWidth = doc.page.width;
      const centerText = (text: string, fontSize: number) => {
        doc.fontSize(fontSize);
        const textWidth = doc.widthOfString(text);
        return (pageWidth - textWidth) / 2;
      };

      const nameX = centerText(name, nameFontSize);
      const dateX = centerText(date, dateFontSize);

      doc.fontSize(nameFontSize).text(name, nameX, nameY, {
        lineBreak: false,
        characterSpacing: 0.5,
      });

      doc.fontSize(dateFontSize).text(date, dateX, dateY, {
        lineBreak: false,
        characterSpacing: 0.5,
      });

      doc.end();

      const pdfBuffer = await pdfBufferPromise;

      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", 'attachment; filename="certificate.pdf"');
      return c.body(pdfBuffer);
    },
  )
  .delete(
    "/",
    clerkMiddleware(),
    zValidator("json", z.object({ key: z.string() })),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) return c.json({ error: "Unauthenticated" }, 401);

      if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN)
        return c.json({ error: "Unauthorized" }, 403);

      const { key } = c.req.valid("json");

      await utapi.deleteFiles([key]);

      return c.json({ data: key });
    },
  );

export default app;
