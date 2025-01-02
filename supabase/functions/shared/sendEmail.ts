 import nodemailer from "npm:nodemailer";

const smtpTransportOptions = {
  host: "smtp.zeptomail.in",
  auth: {
    user: "emailapikey",
    pass:
      "PHtE6r0JRODt2m4t9xEC7f7uEZSsNNkm/ullKFRFtd0TCKJSGE0HqNwvwWOwqEp/VqZFEqadnIo9sr6Yu+qHLWfvNTlJWWqyqK3sx/VYSPOZsbq6x00ZsF4cdkfZXIPocdBp0yXUvt3eNA==",
  },
  tls: {
    ciphers: "SSLv3",
  },
  service: Deno.env.get("SMTP_SERVICE"),
};

const transporter = nodemailer.createTransport(smtpTransportOptions);


export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  cc?: string,
  attachments?: any[] // Accept attachments
): Promise<void> {
  const mailOptions = {
    from: "Business Workspace <notifications@automatebusiness.com>",
    to,
    cc,
    subject,
    text,
    html,
    attachments, // Attachments included here
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
