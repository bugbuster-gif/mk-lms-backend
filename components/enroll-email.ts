export const EnrollEmail = ({
  courseName,
  instructorName,
  courseLevel,
  lessonCount,
  courseLength,
  courseDescription,
  studentName,
  courseId,
}: {
  courseName: string;
  instructorName: string;
  courseLevel: string;
  lessonCount: number;
  courseLength: number;
  courseDescription: string;
  studentName: string;
  courseId: string;
}) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 16px; background-color: #f9f9f9;">
    <img src="https://utfs.io/f/phrFL61UtA1zRqqMWN50uStCI1N23axLd5Oq97mK8knlDMgp" alt="Law Tech University Logo" style="display: block; width: 150px; margin: 0 auto 20px;" />

    <div style="background-color: #ffffff; border-radius: 8px; padding: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #a31c24; font-size: 24px; margin-bottom: 20px; text-align: center;">
        Welcome to ${courseName}!
      </h1>

      <p style="margin-bottom: 15px;">Dear ${studentName},</p>

      <p style="margin-bottom: 15px;">
        Congratulations on enrolling in <strong>${courseName}</strong>!
        We&apos;re excited to have you join us on this learning journey.
        Here&apos;s what you can expect from this course:
      </p>

      <ul style="background-color: #f0f0f0; border-radius: 6px; padding: 15px 15px 15px 30px; margin-bottom: 20px;">
        <li style="margin-bottom: 10px;">Instructor: <strong>${instructorName}</strong></li>
        <li style="margin-bottom: 10px;">Level: <strong>${courseLevel}</strong></li>
        <li style="margin-bottom: 10px;">Number of Lessons: <strong>${lessonCount}</strong></li>
        <li style="margin-bottom: 10px;">Course Length: <strong>${Math.ceil(courseLength / 60)} hours</strong></li>
      </ul>

      <p style="margin-bottom: 20px;"><strong>Course Description:</strong></p>
      <p style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        ${courseDescription}
      </p>

      <p style="margin-bottom: 20px;">
        To get started, simply log in to your account and navigate to &quot;My Courses&quot;. You&apos;ll find ${courseName} waiting for you there.
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://lawtech.university/learning/${courseId}" style="background-color: #a31c24; color: #ffffff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          Start Learning Now
        </a>
      </div>
    </div>

    <p style="text-align: center; font-size: 14px; color: #666; margin-top: 20px;">
      If you have any questions, please don&apos;t hesitate to contact our support team.
    </p>
  </div>
`;
