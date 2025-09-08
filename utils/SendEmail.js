import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.USER_MAIL,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"DevNexus" <${process.env.USER_MAIL}>`,
    to,
    subject,
    html
  });
};
