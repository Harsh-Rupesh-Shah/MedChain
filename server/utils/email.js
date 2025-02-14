import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS // Use the App Password generated from Gmail
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// Function to generate a Google Meet link
const generateGoogleMeetLink = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let meetCode = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      meetCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) meetCode += '-';
  }
  return `https://meet.google.com/${meetCode}`;
};

export const sendAppointmentEmail = async (to, subject, appointmentDetails) => {
  const { doctorName, patientName, date, timeSlot, type } = appointmentDetails;
  const meetLink = type === 'video' ? generateGoogleMeetLink() : null;

  const emailContent = `
    Dear ${to.includes('doctor') ? doctorName : patientName},

    ${to.includes('doctor') ? 
      `A new appointment has been scheduled with patient ${patientName}` :
      `Your appointment has been scheduled with Dr. ${doctorName}`
    }

    Appointment Details:
    Date: ${new Date(date).toLocaleDateString()}
    Time: ${timeSlot.startTime} - ${timeSlot.endTime}
    Type: ${type.charAt(0).toUpperCase() + type.slice(1)} Consultation

    ${meetLink ? `
    Video Call Details:
    Join using this link: ${meetLink}
    Please ensure you have a stable internet connection before joining.
    ` : `
    Location: Medical Center
    Please arrive 10 minutes before your scheduled time.
    `}

    ${to.includes('doctor') ?
      'Please review and prepare for the appointment.' :
      'Please bring any relevant medical records or test results.'
    }

    If you need to reschedule or cancel, please do so at least 24 hours in advance.

    Best regards,
    MedChain Team
  `;

  try {
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    });

    return meetLink;
  } catch (err) {
    console.error('Email sending failed:', err);
    // Don't throw the error, just log it and continue
    // This way, the appointment creation won't fail if email sending fails
    return type === 'video' ? generateGoogleMeetLink() : null;
  }
};