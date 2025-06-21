import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { UTApi } from "uploadthing/server";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";
import path from "path";

import { db } from "../db/db";
import { users } from "../db/schemas/user.schema";
import { Roles } from "../utils/enums";

const utapi = new UTApi();
const imageTemplatePath = path.join(__dirname, "/files/cert.jpg");

export const uploads = new Elysia({ prefix: "/uploads" })
  .use(clerkPlugin())
  // Generate certificate PDF
  .post(
    "/:courseId",
    async ({ params: { courseId }, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthorized" };
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

      set.headers["Content-Type"] = "application/pdf";
      set.headers["Content-Disposition"] = 'attachment; filename="certificate.pdf"';
      
      return pdfBuffer;
    },
    {
      params: t.Object({
        courseId: t.String(),
      }),
    }
  )
  // Delete uploaded file
  .delete(
    "/",
    async ({ body, set, auth: getAuth }) => {
      const auth = getAuth();

      if (!auth?.userId) {
        set.status = 401;
        return { error: "Unauthenticated" };
      }

      if (auth.sessionClaims?.metadata?.role !== Roles.ADMIN) {
        set.status = 403;
        return { error: "Unauthorized" };
      }

      const { key } = body;

      await utapi.deleteFiles([key]);

      return { data: key };
    },
    {
      body: t.Object({
        key: t.String(),
      }),
    }
  );
