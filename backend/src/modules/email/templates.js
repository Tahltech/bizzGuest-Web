import { env } from '../../config/env.js';

function baseLayout(title, bodyHtml) {
  return `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#f4f2e9;padding:32px 0;">
    <table role="presentation" width="100%"><tr><td align="center">
      <table role="presentation" width="480" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #d8d3c4;">
        <tr><td style="background:#1b2420;padding:24px 32px;">
          <span style="color:#f4f2e9;font-size:22px;letter-spacing:.02em;">${env.appName}</span>
        </td></tr>
        <tr><td style="padding:32px;color:#1b2420;font-size:15px;line-height:1.6;">
          <h2 style="font-weight:normal;margin-top:0;">${title}</h2>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f4f2e9;color:#7b8378;font-size:12px;">
          ${env.appName} · Yaoundé, Cameroon
        </td></tr>
      </table>
    </td></tr></table>
  </div>`;
}

export const templates = {
  welcome: ({ fullName }) => ({
    subject: `Welcome to ${env.appName}`,
    html: baseLayout(
      `Welcome, ${fullName}.`,
      `<p>Your ${env.appName} account is ready. You can now search apartments, book your stay, and manage your reservations from your account.</p>`
    )
  }),

  password_reset: ({ fullName, resetUrl }) => ({
    subject: `Reset your ${env.appName} password`,
    html: baseLayout(
      `Reset your password`,
      `<p>Hello ${fullName},</p>
       <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
       <p><a href="${resetUrl}" style="display:inline-block;background:#a9722e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset password</a></p>
       <p>If you didn't request this, you can safely ignore this email.</p>`
    )
  }),

  booking_confirmation: ({ guestName, reference, apartmentName, checkIn, checkOut, totalFormatted, paidFormatted }) => ({
    subject: `Booking confirmed — ${reference}`,
    html: baseLayout(
      `Booking confirmed`,
      `<p>Hello ${guestName},</p>
       <p>Your reservation at ${apartmentName} is confirmed.</p>
       <table style="width:100%;margin:16px 0;border-collapse:collapse;">
         <tr><td style="padding:4px 0;color:#7b8378;">Reference</td><td style="padding:4px 0;text-align:right;">${reference}</td></tr>
         <tr><td style="padding:4px 0;color:#7b8378;">Check-in</td><td style="padding:4px 0;text-align:right;">${checkIn}</td></tr>
         <tr><td style="padding:4px 0;color:#7b8378;">Check-out</td><td style="padding:4px 0;text-align:right;">${checkOut}</td></tr>
         <tr><td style="padding:4px 0;color:#7b8378;">Total</td><td style="padding:4px 0;text-align:right;">${totalFormatted}</td></tr>
         <tr><td style="padding:4px 0;color:#7b8378;">Paid</td><td style="padding:4px 0;text-align:right;">${paidFormatted}</td></tr>
       </table>`
    )
  })
};
