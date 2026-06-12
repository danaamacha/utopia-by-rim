import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendOrderConfirmation(params: {
    to: string;
    fullName: string;
    orderId: string;
    total: number;
    items: Array<{ name: string; qty: number; price: number }>;
  }) {
    const { to, fullName, orderId, total, items } = params;

    const itemsHtml = items
      .map(
        (it) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${it.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${it.price.toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto">
        <h2 style="margin:0 0 10px">Thanks ${fullName} ✨</h2>
        <p style="margin:0 0 14px">Your order is confirmed.</p>
        <p style="margin:0 0 16px"><b>Order ID:</b> ${orderId}</p>

        <table style="width:100%;border-collapse:collapse;margin:14px 0">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Item</th>
              <th style="text-align:center;padding:8px;border-bottom:2px solid #ddd;">Qty</th>
              <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="display:flex;justify-content:space-between;font-size:16px">
          <b>Total</b>
          <b>$${total.toFixed(2)}</b>
        </div>

        <p style="margin-top:18px;color:#666;font-size:13px">
          If you have any question, reply to this email.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `Order Confirmed — ${orderId}`,
      html,
    });
  }

  /** Notify the shop owner about a new contact-form message. */
  async sendContactNotification(params: {
    name: string;
    email: string;
    message: string;
  }) {
    const { name, email, message } = params;
    const to = process.env.CONTACT_NOTIFY_EMAIL || process.env.SMTP_USER;

    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto">
        <h2 style="margin:0 0 10px">New contact message ✉️</h2>
        <p style="margin:0 0 6px"><b>From:</b> ${escape(name)} &lt;${escape(email)}&gt;</p>
        <div style="margin-top:12px;padding:14px;background:#f7f3fa;border-radius:8px;white-space:pre-wrap">${escape(message)}</div>
        <p style="margin-top:18px;color:#666;font-size:13px">
          Reply to this email to answer the customer directly,
          or manage messages in the admin dashboard.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      replyTo: email,
      subject: `New message from ${name} — Utopia by Rim`,
      html,
    });
  }
}
