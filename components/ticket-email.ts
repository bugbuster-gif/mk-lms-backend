// Email template for new ticket notification
export const NewTicketEmail = ({
  ticketId,
  title,
  description,
  type,
  priority,
  userName,
  courseName,
  isAdmin,
}: {
  ticketId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  userName: string;
  courseName?: string;
  isAdmin?: boolean;
}) => `
  <div style="font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    <!-- Header with gradient -->
    <div style="background: linear-gradient(to right, #006666, #008080, #8BC34A); padding: 30px 20px; text-align: center;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
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
            <h1 style="color: #006666; font-size: 24px; margin-bottom: 20px; font-weight: 300; text-align: center;">
              New Support Ticket Created
            </h1>
            
            <!-- Ticket Info Box -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 25px; background-color: #f9f9f9; border-radius: 6px;">
              <tr>
                <td style="padding: 15px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Ticket ID:</span> 
                        <span style="color: #006666; font-weight: 400;">${ticketId}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Created By:</span> 
                        <span style="color: #006666; font-weight: 400;">${userName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Type:</span> 
                        <span style="color: #006666; font-weight: 400;">${type}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Priority:</span> 
                        <span style="color: #006666; font-weight: 400;">${priority}</span>
                      </td>
                    </tr>
                    ${
                      courseName
                        ? `
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="color: #666666; font-weight: 300;">Course:</span> 
                        <span style="color: #006666; font-weight: 400;">${courseName}</span>
                      </td>
                    </tr>
                    `
                        : ""
                    }
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Ticket Title -->
            <h2 style="color: #008080; font-size: 18px; margin-bottom: 10px; font-weight: 400;">
              ${title}
            </h2>
            
            <!-- Ticket Description -->
            <div style="border-left: 3px solid #8BC34A; padding-left: 15px; margin-bottom: 25px; background-color: #f9f9f9; padding: 15px 15px 15px 18px; border-radius: 0 6px 6px 0;">
              <p style="font-size: 15px; margin: 0; font-weight: 300; color: #444444;">
                ${description}
              </p>
            </div>
            
            <!-- Decorative element -->
            <div style="height: 2px; background: linear-gradient(to right, #006666, #008080, #8BC34A); margin: 25px 0;"></div>
            
            <!-- CTA Button -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="border-radius: 4px; background: linear-gradient(to right, #006666, #008080);">
                        <a href="https://ellevate-scjv.vercel.app/${isAdmin ? "ticket-list" : "tickets"}/${ticketId}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-weight: 300; text-decoration: none; font-size: 16px;">
                          View Ticket
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
              This is an automated message. Please do not reply directly to this email.
            </p>
            <p style="font-size: 12px; color: #999999; margin: 0; font-weight: 300;">
              &copy; 2025 Ellevate Academy. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  </div>
`;

// Email template for ticket response notification
export const TicketResponseEmail = ({
  ticketId,
  ticketTitle,
  responseContent,
  responderName,
  recipientName,
  isAdmin,
}: {
  ticketId: string;
  ticketTitle: string;
  responseContent: string;
  responderName: string;
  recipientName: string;
  isAdmin?: boolean;
}) => `
  <div style="font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    <!-- Header with gradient -->
    <div style="background: linear-gradient(to right, #006666, #008080, #8BC34A); padding: 30px 20px; text-align: center;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <div style="margin: 0 auto; width: 180px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" style="width: 100%; height: auto;">
                <defs>
                  <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#006666" />
                    <stop offset="50%" style="stop-color:#008080" />
                    <stop offset="100%" style="stop-color:#8BC34A" />
                  </linearGradient>
                </defs>
                <text x="10" y="45" fill="url(#logoGradient2)" font-family="Arial, sans-serif" font-weight="700" font-size="28">ellevate</text>
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
            <h1 style="color: #006666; font-size: 24px; margin-bottom: 20px; font-weight: 300; text-align: center;">
              New Response to Your Ticket
            </h1>
            
            <p style="font-size: 16px; margin-bottom: 15px; font-weight: 300; color: #444444;">
              Dear ${recipientName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px; font-weight: 300; color: #444444;">
              ${responderName} has responded to your ticket: <strong style="color: #006666;">${ticketTitle}</strong>
            </p>
            
            <!-- Response Box -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 25px;">
              <tr>
                <td>
                  <div style="border-left: 3px solid #8BC34A; padding-left: 15px; background-color: #f9f9f9; padding: 15px 15px 15px 18px; border-radius: 0 6px 6px 0;">
                    <p style="margin: 0 0 10px 0; font-weight: 400; color: #006666;">Response:</p>
                    <p style="font-size: 15px; margin: 0; font-weight: 300; color: #444444;">
                      ${responseContent}
                    </p>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Decorative element -->
            <div style="height: 2px; background: linear-gradient(to right, #006666, #008080, #8BC34A); margin: 25px 0;"></div>
            
            <!-- CTA Button -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="border-radius: 4px; background: linear-gradient(to right, #006666, #008080);">
                        <a href="https://ellevate-scjv.vercel.app/${isAdmin ? "ticket-list" : "tickets"}/${ticketId}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-weight: 300; text-decoration: none; font-size: 16px;">
                          View Ticket
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
              This is an automated message. Please do not reply directly to this email.
            </p>
            <p style="font-size: 12px; color: #999999; margin: 0; font-weight: 300;">
              &copy; 2025 Ellevate Academy. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  </div>
`;

// Email template for ticket status update notification
export const TicketStatusEmail = ({
  ticketId,
  ticketTitle,
  newStatus,
  recipientName,
  updatedBy,
  isAdmin,
}: {
  ticketId: string;
  ticketTitle: string;
  newStatus: string;
  recipientName: string;
  updatedBy: string;
  isAdmin?: boolean;
}) => `
  <div style="font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    <!-- Header with gradient -->
    <div style="background: linear-gradient(to right, #006666, #008080, #8BC34A); padding: 30px 20px; text-align: center;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <div style="margin: 0 auto; width: 180px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" style="width: 100%; height: auto;">
                <defs>
                  <linearGradient id="logoGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#006666" />
                    <stop offset="50%" style="stop-color:#008080" />
                    <stop offset="100%" style="stop-color:#8BC34A" />
                  </linearGradient>
                </defs>
                <text x="10" y="45" fill="url(#logoGradient3)" font-family="Arial, sans-serif" font-weight="700" font-size="28">ellevate</text>
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
            <h1 style="color: #006666; font-size: 24px; margin-bottom: 20px; font-weight: 300; text-align: center;">
              Ticket Status Updated
            </h1>
            
            <p style="font-size: 16px; margin-bottom: 15px; font-weight: 300; color: #444444;">
              Dear ${recipientName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px; font-weight: 300; color: #444444;">
              The status of your ticket <strong style="color: #006666;">${ticketTitle}</strong> has been updated by ${updatedBy}.
            </p>
            
            <!-- Status Box -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 25px;">
              <tr>
                <td>
                  <div style="border-left: 3px solid #8BC34A; padding-left: 15px; background-color: #f9f9f9; padding: 15px 15px 15px 18px; border-radius: 0 6px 6px 0;">
                    <p style="margin: 0 0 10px 0; font-weight: 400; color: #006666;">New Status:</p>
                    <p style="font-size: 15px; margin: 0; font-weight: 300; color: #444444;">
                      ${newStatus}
                    </p>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Decorative element -->
            <div style="height: 2px; background: linear-gradient(to right, #006666, #008080, #8BC34A); margin: 25px 0;"></div>
            
            <!-- CTA Button -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="border-radius: 4px; background: linear-gradient(to right, #006666, #008080);">
                        <a href="https://ellevate-scjv.vercel.app/${isAdmin ? "ticket-list" : "tickets"}/${ticketId}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-weight: 300; text-decoration: none; font-size: 16px;">
                          View Ticket
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
              This is an automated message. Please do not reply directly to this email.
            </p>
            <p style="font-size: 12px; color: #999999; margin: 0; font-weight: 300;">
              &copy; 2025 Ellevate Academy. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
  </div>
`;
