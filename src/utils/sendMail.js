import nodemailer from "nodemailer";
import Brevo from "@getbrevo/brevo";
// export const sendEmail = async ({ email, subject, message }) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: process.env.SMTP_PORT,
//       secure: false, // Brevo uses STARTTLS on port 587
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: `"Support" <${process.env.SMTP_USER}>`,
//       to: email,
//       subject,
//       text: message,
//     });

//     console.log(`📧 Email sent successfully to ${email}`);
//   } catch (error) {
//     console.error("❌ Email sending failed:", error);
//     throw new Error("Failed to send email");
//   }
// };

export const sendEmail = async ({ email, subject, message }) => {
  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();

    // ✅ Set API key correctly
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: "Support", email: process.env.FROM_EMAIL };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = message;

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`📧 Email sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error.response?.data || error);
    throw new Error("Failed to send email");
  }
};
