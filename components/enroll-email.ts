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
  <div style="font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    <!-- Header with gradient -->
    <div style="background: linear-gradient(to right, #006666, #008080, #8BC34A); padding: 30px 20px; text-align: center;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <img src="https://d2oi1rqwb0pj00.cloudfront.net/community/nio_1749313794850_100.webp" alt="Melanin Tribe Logo" style="display: block; max-width: 180px; height: auto; margin: 0 auto;" />
            <div style="margin-top: 5px; font-size: 12px; color: #ffffff; font-weight: 300;">POWERED BY ECOBANK ELLEVATE</div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 30px 20px; background-color: #ffffff;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <h1 style="color: #006666; font-size: 24px; margin-bottom: 20px; font-weight: 300; text-align: center;">
              Welcome to ${courseName}!
            </h1>
            
            <p style="font-size: 16px; margin-bottom: 15px; font-weight: 300; color: #444444;">
              Dear ${studentName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px; font-weight: 300; color: #444444;">
              Congratulations on enrolling in <strong style="color: #006666;">${courseName}</strong>!
              We're excited to have you join us on this learning journey.
              Here's what you can expect from this course:
            </p>
            
            <!-- Course Details Box -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 25px; background-color: #f9f9f9; border-radius: 6px;">
              <tr>
                <td style="padding: 15px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Instructor:</span> 
                        <span style="color: #006666; font-weight: 400;">${instructorName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Level:</span> 
                        <span style="color: #006666; font-weight: 400;">${courseLevel}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Number of Lessons:</span> 
                        <span style="color: #006666; font-weight: 400;">${lessonCount}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Course Length:</span> 
                        <span style="color: #006666; font-weight: 400;">${Math.ceil(courseLength / 60)} hours</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Course Description -->
            <p style="font-size: 16px; margin-bottom: 10px; font-weight: 400; color: #006666;">
              Course Description:
            </p>
            
            <div style="border-left: 3px solid #8BC34A; padding-left: 15px; margin-bottom: 25px;">
              <p style="font-size: 15px; margin: 0; font-weight: 300; color: #444444; font-style: italic;">
                ${courseDescription}
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 25px; font-weight: 300; color: #444444;">
              To get started, simply log in to your account and navigate to "My Courses". You'll find ${courseName} waiting for you there.
            </p>
            
            <!-- Decorative element -->
            <div style="height: 2px; background: linear-gradient(to right, #006666, #008080, #8BC34A); margin: 25px 0;"></div>
            
            <!-- CTA Button -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="border-radius: 4px; background: linear-gradient(to right, #006666, #008080);">
                        <a href="https://ellevate-scjv.vercel.app/learning/${courseId}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-weight: 300; text-decoration: none; font-size: 16px;">
                          Start Learning Now
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <p style="font-size: 14px; color: #666666; margin-bottom: 10px; font-weight: 300;">
              If you have any questions, please don't hesitate to contact our support team.
            </p>
            <p style="font-size: 12px; color: #999999; margin: 0; font-weight: 300;">
              2025 Melanin Tribe. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  </div>
`;
