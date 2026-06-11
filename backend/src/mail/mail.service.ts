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
}
