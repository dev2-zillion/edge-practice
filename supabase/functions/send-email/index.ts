import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer";

const smtpTransportOptions = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "devdeveloper330@gmail.com",
    pass: "hccxmhzsptbmyenu",
  },
  tls: {
    rejectUnauthorized: false,
  },
};

const transporter = nodemailer.createTransport(smtpTransportOptions);

Deno.serve( async (req) => {
  try {
    const { record } = await req.json();

    if (!record || !record.email) {
      throw new Error("Missing required 'email' field in payload.");
    }

    const mailOptions = {
      from: "Business Workspace <devdeveloper330@gmail.com>",
      to: record.email,
      cc: "",
      subject: "Welcome to Rahul Workspace",
      text: "Thank you for signing up!",
      html: "<p>Thank you for signing up!</p>",
      attachments: [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);

    return new Response(JSON.stringify({ message: "Mail sent successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);   
  }
});
