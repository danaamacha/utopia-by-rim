import nodemailer from 'nodemailer';
import { env } from './env.js';

const inProd = process.env.NODE_ENV === 'production';

let transporter;

if (inProd && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
} else {
  transporter = nodemailer.createTransport({ jsonTransport: true });
}

export async function sendMail({ to, subject, text, html }) {
  if (!inProd) {
    console.log('====== EMAIL (dev) ======');
    console.log('To:', to);
    console.log('Subject:', subject);
    if (text) console.log('Text:', text);
    if (html) console.log('HTML:', html);
    console.log('=========================');
  }

  return transporter.sendMail({
    from: env.EMAIL_FROM || env.SMTP_USER || 'no-reply@example.test',
    to,
    subject,
    text,
    html,
  });
}
