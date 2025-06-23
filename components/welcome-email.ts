interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate = ({ firstName }: EmailTemplateProps) => `
  <div style="font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    <!-- Header with gradient -->
    <div style="background: linear-gradient(to right, #006666, #008080, #8BC34A); padding: 30px 20px; text-align: center;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <!-- Logo placeholder - replace with actual Ecobank logo URL -->
            <div style="margin: 0 auto; width: 180px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" style="width: 100%; height: auto;">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#006666" />
                    <stop offset="50%" style="stop-color:#008080" />
                    <stop offset="100%" style="stop-color:#8BC34A" />
                  </linearGradient>
                </defs>
                <text x="10" y="45" fill="url(#logoGradient)" font-family="Arial, sans-serif" font-weight="700" font-size="28">ellevate</text>
                <text x="10" y="70" fill="#ffffff" font-family="Arial, sans-serif" font-weight="300" font-size="16">academy</text>
              </svg>
            </div>
            <div style="margin-top: 5px; font-size: 12px; color: #ffffff; font-weight: 300;">powered by Melanin Kapital</div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 30px 20px; background-color: #ffffff;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <h1 style="color: #006666; font-size: 24px; margin-bottom: 20px; font-weight: 300;">
              Welcome to Ellevate Academy, ${firstName}!
            </h1>
            
            <p style="font-size: 16px; margin-bottom: 15px; font-weight: 300; color: #444444;">
              We're thrilled to have you join our community of forward-thinking professionals and tech enthusiasts.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px; font-weight: 300; color: #444444;">
              At Ellevate Academy, we're dedicated to empowering you with the knowledge and skills needed to excel in the digital age. Your journey towards becoming a leader in technology starts now!
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
                        <a href="https://ellevate-scjv.vercel.app/courses" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-weight: 300; text-decoration: none; font-size: 16px;">
                          Explore Our Courses
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
            <p style="font-size: 14px; color: #666666; margin-bottom: 10px; font-weight: 300; font-style: italic;">
              Together, we'll shape the future of digital innovation in Africa and beyond.
            </p>
            <p style="font-size: 12px; color: #999999; margin: 0; font-weight: 300;">
              2025 Ellevate Academy. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  </div>
`;
