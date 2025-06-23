import { Elysia, t } from "elysia";
import { clerkPlugin } from "elysia-clerk";
import { UTApi } from "uploadthing/server";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { JSDOM } from "jsdom";
import SVGtoPDF from "svg-to-pdfkit";

import { db } from "../db/db";
import { users } from "../db/schemas/user.schema";
import { courses } from "../db/schemas/course.schema";
import { enrollments } from "../db/schemas/enrollment.schema";
import { Roles } from "../utils/enums";

const utapi = new UTApi();
const certificateTemplatePath = path.join(__dirname, "/files/cert.svg");

// Certificate dimensions (landscape format)
const CERTIFICATE_WIDTH = 842;
const CERTIFICATE_HEIGHT = 595;

export const uploads = new Elysia({ prefix: "/uploads" })
  .use(clerkPlugin())
  // Test route for certificate generation (for development only)
  .get("/test-certificate", async ({ set }) => {
    try {
      console.log("Starting test certificate generation");
      console.log(`Template path: ${certificateTemplatePath}`);

      // Check if SVG template exists
      if (!fs.existsSync(certificateTemplatePath)) {
        console.error("SVG template not found at:", certificateTemplatePath);
        set.status = 404;
        return { error: "Certificate template not found" };
      }

      // Read SVG template
      const svgTemplate = fs.readFileSync(certificateTemplatePath, "utf8");
      console.log("SVG template loaded, length:", svgTemplate.length);

      // Parse SVG using JSDOM
      const dom = new JSDOM(svgTemplate);
      const document = dom.window.document;

      // Sample data
      const userName = "John Doe";
      const courseName = "Advanced Web Development";
      const date = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const certificateId = `CERT-TEST-${Date.now().toString().substring(9, 13)}`;

      // Find and replace placeholders in the SVG
      // Using more robust selectors with fallbacks
      let nameElement = document.querySelector("text[id='recipient-name']");
      if (!nameElement)
        nameElement = document.querySelector(
          "text[data-field='recipient-name']",
        );
      if (!nameElement) nameElement = document.querySelector("text[y='270']");
      if (nameElement) {
        console.log("Found name element, setting to:", userName);
        nameElement.textContent = userName;
      } else {
        console.warn("Name element not found in SVG");
      }

      let courseElement = document.querySelector("text[id='course-name']");
      if (!courseElement)
        courseElement = document.querySelector(
          "text[data-field='course-name']",
        );
      if (!courseElement)
        courseElement = document.querySelector("text[y='350']");
      if (courseElement) {
        console.log("Found course element, setting to:", courseName);
        courseElement.textContent = courseName;
      } else {
        console.warn("Course element not found in SVG");
      }

      let dateElement = document.querySelector("text[id='certificate-date']");
      if (!dateElement)
        dateElement = document.querySelector("text[data-field='date']");
      if (!dateElement) dateElement = document.querySelector("text[y='445']");
      if (dateElement) {
        console.log("Found date element, setting to:", date);
        dateElement.textContent = date;
      } else {
        console.warn("Date element not found in SVG");
      }

      let certIdElement = document.querySelector("text[id='certificate-id']");
      if (!certIdElement)
        certIdElement = document.querySelector(
          "text[data-field='certificate-id']",
        );
      if (!certIdElement)
        certIdElement = document.querySelector("text[y='550']");
      if (certIdElement) {
        console.log("Found certificate ID element, setting to:", certificateId);
        certIdElement.textContent = `Certificate ID: ${certificateId} • Verify at ellevate-academy.com/verify`;
      } else {
        console.warn("Certificate ID element not found in SVG");
      }

      // Get the modified SVG
      const modifiedSvg = dom.serialize();

      // Extract SVG element as string
      const svgElement = modifiedSvg.substring(
        modifiedSvg.indexOf("<svg"),
        modifiedSvg.indexOf("</svg>") + 6,
      );

      console.log("Modified SVG extracted, length:", svgElement.length);

      try {
        // Create PDF document with fixed landscape dimensions
        const doc = new PDFDocument({
          layout: "portrait",
          size: [CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT],
          margin: 0, // Remove margins
          info: {
            Title: "Ellevate Academy Certificate",
            Author: "Ellevate Academy",
            Subject: "Course Completion Certificate",
          },
        });

        const buffers: Buffer[] = [];
        doc.on("data", (chunk) => buffers.push(chunk));

        const pdfBufferPromise = new Promise<Buffer>((resolve) => {
          doc.on("end", () => resolve(Buffer.concat(buffers)));
        });

        // Convert SVG to PDF using svg-to-pdfkit
        // Ensure the SVG fills the entire PDF page
        SVGtoPDF(doc, svgElement, 0, 0, {
          width: CERTIFICATE_WIDTH,
          height: CERTIFICATE_HEIGHT,
          preserveAspectRatio: "xMidYMid meet",
          assumePt: true,
        });

        doc.end();
        console.log("PDF document ended");

        const pdfBuffer = await pdfBufferPromise;
        console.log("PDF buffer created, size:", pdfBuffer.length);

        set.headers["Content-Type"] = "application/pdf";
        set.headers["Content-Disposition"] =
          `attachment; filename="test_certificate.pdf"`;

        return pdfBuffer;
      } catch (error) {
        console.error("Error converting SVG to PDF:", error);
        set.status = 500;
        return { error: `Failed to convert SVG to PDF: ${error.message}` };
      }
    } catch (error) {
      console.error("Error generating test certificate:", error);
      set.status = 500;
      return { error: `Failed to generate certificate: ${error.message}` };
    }
  })

  // Generate certificate PDF
  .post(
    "/:courseId",
    async ({ params: { courseId }, set, auth: getAuth }) => {
      try {
        const auth = getAuth();

        if (!auth?.userId) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, auth.userId));

        if (!user) {
          set.status = 404;
          return { error: "User not found" };
        }

        const [course] = await db
          .select()
          .from(courses)
          .where(eq(courses.id, courseId));

        if (!course) {
          set.status = 404;
          return { error: "Course not found" };
        }

        // Check if user is enrolled in the course
        const [enrollment] = await db
          .select()
          .from(enrollments)
          .where(eq(enrollments.userId, auth.userId))
          .where(eq(enrollments.courseId, courseId));

        if (!enrollment) {
          set.status = 403;
          return { error: "User not enrolled in this course" };
        }

        // Check if SVG template exists
        if (!fs.existsSync(certificateTemplatePath)) {
          console.error("SVG template not found at:", certificateTemplatePath);
          set.status = 404;
          return { error: "Certificate template not found" };
        }

        // Read SVG template
        const svgTemplate = fs.readFileSync(certificateTemplatePath, "utf8");

        // Parse SVG using JSDOM
        const dom = new JSDOM(svgTemplate);
        const document = dom.window.document;

        // Get current date in a nice format
        const date = new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        // Generate a certificate ID
        const certificateId = `CERT-${courseId.substring(0, 4)}-${auth.userId.substring(0, 4)}-${Date.now().toString().substring(9, 13)}`;

        // Find and replace placeholders in the SVG
        // Using more robust selectors with fallbacks
        let nameElement = document.querySelector("text[id='recipient-name']");
        if (!nameElement)
          nameElement = document.querySelector(
            "text[data-field='recipient-name']",
          );
        if (!nameElement) nameElement = document.querySelector("text[y='270']");
        if (nameElement) {
          nameElement.textContent = user.name;
        }

        let courseElement = document.querySelector("text[id='course-name']");
        if (!courseElement)
          courseElement = document.querySelector(
            "text[data-field='course-name']",
          );
        if (!courseElement)
          courseElement = document.querySelector("text[y='350']");
        if (courseElement) {
          courseElement.textContent = course.name;
        }

        let dateElement = document.querySelector("text[id='certificate-date']");
        if (!dateElement)
          dateElement = document.querySelector("text[data-field='date']");
        if (!dateElement) dateElement = document.querySelector("text[y='445']");
        if (dateElement) {
          dateElement.textContent = date;
        }

        let certIdElement = document.querySelector("text[id='certificate-id']");
        if (!certIdElement)
          certIdElement = document.querySelector(
            "text[data-field='certificate-id']",
          );
        if (!certIdElement)
          certIdElement = document.querySelector("text[y='550']");
        if (certIdElement) {
          certIdElement.textContent = `Certificate ID: ${certificateId} • Verify at ellevate-academy.com/verify`;
        }

        // Get the modified SVG
        const modifiedSvg = dom.serialize();

        // Extract SVG element as string
        const svgElement = modifiedSvg.substring(
          modifiedSvg.indexOf("<svg"),
          modifiedSvg.indexOf("</svg>") + 6,
        );

        try {
          // Create PDF document with fixed landscape dimensions
          const doc = new PDFDocument({
            layout: "landscape",
            size: [CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT],
            margin: 0, // Remove margins
            info: {
              Title: `${course.name} Certificate - ${user.name}`,
              Author: "Ellevate Academy",
              Subject: "Course Completion Certificate",
            },
          });

          const buffers: Buffer[] = [];
          doc.on("data", (chunk) => buffers.push(chunk));

          const pdfBufferPromise = new Promise<Buffer>((resolve) => {
            doc.on("end", () => resolve(Buffer.concat(buffers)));
          });

          // Convert SVG to PDF using svg-to-pdfkit
          // Ensure the SVG fills the entire PDF page
          SVGtoPDF(doc, svgElement, 0, 0, {
            width: CERTIFICATE_WIDTH,
            height: CERTIFICATE_HEIGHT,
            preserveAspectRatio: "xMidYMid meet",
            assumePt: true,
          });

          doc.end();

          const pdfBuffer = await pdfBufferPromise;

          set.headers["Content-Type"] = "application/pdf";
          set.headers["Content-Disposition"] =
            `attachment; filename="${user.name.replace(/\s+/g, "_")}_${course.name.replace(/\s+/g, "_")}_Certificate.pdf"`;

          return pdfBuffer;
        } catch (error) {
          console.error("Error converting SVG to PDF:", error);
          set.status = 500;
          return { error: `Failed to convert SVG to PDF: ${error.message}` };
        }
      } catch (error) {
        console.error("Error generating certificate:", error);
        set.status = 500;
        return { error: `Failed to generate certificate: ${error.message}` };
      }
    },
    {
      params: t.Object({
        courseId: t.String(),
      }),
    },
  )
  // Delete uploaded file
  .delete(
    "/",
    async ({ body, set, auth: getAuth }) => {
      try {
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
      } catch (error) {
        console.error("Error deleting file:", error);
        set.status = 500;
        return { error: "Failed to delete file" };
      }
    },
    {
      body: t.Object({
        key: t.String(),
      }),
    },
  );
