import nodemailer from "nodemailer";

// Gmail SMTP 설정
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

export async function sendEmail(
  email: string,
  title: string,
  content: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"MailON" <no-reply@mail.mailon.com>`,
      to: email,
      subject: `[🍈 MailON] ${title}`,
      html: content,
    });
  } catch (err) {
    console.error(`❌ Failed to send email`, err);
  }
}
