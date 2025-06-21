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
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 16px; background-color: #f9f9f9;">
    <img src="https://utfs.io/f/phrFL61UtA1zRqqMWN50uStCI1N23axLd5Oq97mK8knlDMgp" alt="Law Tech University Logo" style="display: block; width: 150px; margin: 0 auto 20px;" />

    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #a31c24; font-size: 24px; margin-bottom: 20px; text-align: center;">
        New Support Ticket Created
      </h1>

      <div style="background-color: #f0f0f0; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
        <p style="margin: 5px 0;"><strong>Created By:</strong> ${userName}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${type}</p>
        <p style="margin: 5px 0;"><strong>Priority:</strong> ${priority}</p>
        ${courseName ? `<p style="margin: 5px 0;"><strong>Course:</strong> ${courseName}</p>` : ""}
      </div>

      <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px;">${title}</h2>
      <p style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        ${description}
      </p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://lawtech.university/${isAdmin ? "ticket-list" : "tickets"}/${ticketId}" style="background-color: #a31c24; color: #ffffff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          View Ticket
        </a>
      </div>
    </div>

    <p style="text-align: center; font-size: 14px; color: #666; margin-top: 20px;">
      This is an automated message. Please do not reply directly to this email.
    </p>
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
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 16px; background-color: #f9f9f9;">
    <img src="https://utfs.io/f/7deJt7gRMIyioevliYRWfV46SeCrtEygKuYPFmZjATX89JzO" alt="LMS Logo" style="display: block; width: 150px; margin: 0 auto 20px;" />

    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #a31c24; font-size: 24px; margin-bottom: 20px; text-align: center;">
        New Response to Your Ticket
      </h1>

      <p style="margin-bottom: 15px;">Dear ${recipientName},</p>

      <p style="margin-bottom: 15px;">
        ${responderName} has responded to your ticket: <strong>${ticketTitle}</strong>
      </p>

      <div style="background-color: #f0f0f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Response:</strong></p>
        <p style="margin: 10px 0 0 0;">${responseContent}</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://lawtech.university/${isAdmin ? "ticket-list" : "tickets"}/${ticketId}" style="background-color: #a31c24; color: #ffffff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          View Ticket
        </a>
      </div>
    </div>

    <p style="text-align: center; font-size: 14px; color: #666; margin-top: 20px;">
      This is an automated message. Please do not reply directly to this email.
    </p>
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
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 16px; background-color: #f9f9f9;">
    <img src="https://utfs.io/f/7deJt7gRMIyioevliYRWfV46SeCrtEygKuYPFmZjATX89JzO" alt="LMS Logo" style="display: block; width: 150px; margin: 0 auto 20px;" />

    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1 style="color: #a31c24; font-size: 24px; margin-bottom: 20px; text-align: center;">
        Ticket Status Updated
      </h1>

      <p style="margin-bottom: 15px;">Dear ${recipientName},</p>

      <p style="margin-bottom: 15px;">
        The status of your ticket <strong>${ticketTitle}</strong> has been updated by ${updatedBy}.
      </p>

      <div style="background-color: #f0f0f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>New Status:</strong> ${newStatus}</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://lawtech.university/${isAdmin ? "ticket-list" : "tickets"}/${ticketId}" style="background-color: #a31c24; color: #ffffff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">
          View Ticket
        </a>
      </div>
    </div>

    <p style="text-align: center; font-size: 14px; color: #666; margin-top: 20px;">
      This is an automated message. Please do not reply directly to this email.
    </p>
  </div>
`;
