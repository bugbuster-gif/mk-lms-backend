interface EmailTemplateProps {
  firstName: string;
}

export const EmailTemplate = ({ firstName }: EmailTemplateProps) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
    <img src="https://utfs.io/f/phrFL61UtA1zRqqMWN50uStCI1N23axLd5Oq97mK8knlDMgp" alt="Law Tech University Logo" style="display: block; max-width: 100%; height: auto; margin-bottom: 20px;" />
    
    <h1 style="color: #2c3e50; font-size: 24px; margin-bottom: 20px;">
      Welcome to Law Tech University, ${firstName}!
    </h1>
    
    <p style="font-size: 16px; margin-bottom: 15px;">
      We&apos;re thrilled to have you join our community of forward-thinking legal professionals and tech enthusiasts.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      At LTU, we&apos;re dedicated to empowering you with the knowledge and skills needed to excel in the digital age of law. Your journey towards becoming a leader in legal technology starts now!
    </p>
    
    <a href="https://lawtech.university/courses" style="display: inline-block; background-color: #a31c24; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Explore Our Courses
    </a>
    
    <p style="font-size: 14px; color: #7f8c8d; margin-top: 20px; font-style: italic;">
      Together, we&apos;ll shape the future of digital law in Africa and beyond.
    </p>
  </div>
`;
