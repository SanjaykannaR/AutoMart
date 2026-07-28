/**
 * HTML Email Templates for AutoMart notifications.
 * Uses inline CSS for maximum email client compatibility.
 * No external dependencies — pure HTML strings passed to nodemailer.
 */

const BRAND = {
  name: 'AutoMart',
  color: '#FF523B', // coral accent
  bgColor: '#0A0A0A', // jet black
  surfaceColor: '#1A1A1A', // charcoal
  textColor: '#E5E5E5',
  dimColor: '#888888',
  greenColor: '#22C55E',
  blueColor: '#38B6FF',
  fontFamily: 'Arial, Helvetica, sans-serif',
}

/** Wraps content in a centered email shell with max-width */
function shell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BRAND.bgColor};font-family:${BRAND.fontFamily};color:${BRAND.textColor};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bgColor};padding:24px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.surfaceColor};border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <!-- Header -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:20px;font-weight:bold;color:${BRAND.textColor};">🚗 ${BRAND.name}</span>
        </td></tr>
        <!-- Title -->
        <tr><td style="padding:32px 32px 8px;">
          <h1 style="margin:0;font-size:22px;color:${BRAND.textColor};">${title}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:8px 32px 32px;font-size:15px;line-height:1.6;color:${BRAND.textColor};">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:${BRAND.dimColor};text-align:center;">
          ${BRAND.name} — Automobile Parts Marketplace<br>
          This is an automated email. Do not reply.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Format currency in INR */
function inr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Order Confirmation ─────────────────────────────────────────────────────

export function orderConfirmationEmail(opts: {
  orderId: string
  userName: string
  items: Array<{ name: string; price: number; qty: number }>
  total: number
  address: string
}): string {
  const rows = opts.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;">${inr(i.price * i.qty)}</td>
    </tr>`
  ).join('')

  const body = `
    <p style="margin:0 0 16px;">Hi ${opts.userName},</p>
    <p style="margin:0 0 20px;">Your order <strong style="color:${BRAND.color};">#${opts.orderId.slice(0, 8)}</strong> has been placed successfully!</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr style="font-size:13px;color:${BRAND.dimColor};">
        <td style="padding:4px 0;">Item</td>
        <td style="padding:4px 0;text-align:center;">Qty</td>
        <td style="padding:4px 0;text-align:right;">Price</td>
      </tr>
      ${rows}
      <tr>
        <td colspan="2" style="padding:14px 0 0;font-weight:bold;">Total</td>
        <td style="padding:14px 0 0;text-align:right;font-weight:bold;color:${BRAND.color};font-size:17px;">${inr(opts.total)}</td>
      </tr>
    </table>
    <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:14px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:${BRAND.dimColor};">Delivering to</p>
      <p style="margin:4px 0 0;font-size:14px;">${opts.address}</p>
    </div>
    <p style="margin:0;font-size:14px;color:${BRAND.dimColor};">Estimated delivery: <strong style="color:${BRAND.greenColor};">30 minutes</strong></p>
  `
  return shell(`Order Confirmed #${opts.orderId.slice(0, 8)}`, body)
}

// ─── Order Status Update ────────────────────────────────────────────────────

export function orderStatusEmail(opts: {
  orderId: string
  status: string
  userName: string
  total?: number
}): string {
  const statusColors: Record<string, string> = {
    confirmed: BRAND.blueColor,
    picked: BRAND.blueColor,
    shipped: '#F59E0B',
    delivered: BRAND.greenColor,
    cancelled: '#EF4444',
  }
  const color = statusColors[opts.status] || BRAND.textColor

  const statusLabels: Record<string, string> = {
    confirmed: 'Order Confirmed',
    picked: 'Order Picked',
    shipped: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  const label = statusLabels[opts.status] || opts.status

  const body = `
    <p style="margin:0 0 16px;">Hi ${opts.userName},</p>
    <p style="margin:0 0 20px;">Your order <strong style="color:${BRAND.color};">#${opts.orderId.slice(0, 8)}</strong> status has been updated.</p>
    <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:13px;color:${BRAND.dimColor};">Current Status</p>
      <p style="margin:0;font-size:22px;font-weight:bold;color:${color};">${label}</p>
    </div>
    ${opts.total ? `<p style="margin:0;font-size:14px;color:${BRAND.dimColor};">Order Total: <strong>${inr(opts.total)}</strong></p>` : ''}
  `
  return shell(label, body)
}

// ─── Welcome Email ──────────────────────────────────────────────────────────

export function welcomeEmail(opts: {
  userName: string
  email: string
}): string {
  const body = `
    <p style="margin:0 0 16px;">Hi ${opts.userName},</p>
    <p style="margin:0 0 20px;">Welcome to <strong style="color:${BRAND.color};">AutoMart</strong>! Your account has been created successfully.</p>
    <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:bold;">Here's what you can do:</p>
      <p style="margin:0 0 6px;font-size:14px;">🛒 Browse 25+ automobile parts across 8 categories</p>
      <p style="margin:0 0 6px;font-size:14px;">🔍 Search with text, voice, or image</p>
      <p style="margin:0 0 6px;font-size:14px;">📦 Track your orders in real time</p>
      <p style="margin:0;font-size:14px;">🚚 Free delivery on your first order</p>
    </div>
    <p style="margin:0;font-size:14px;color:${BRAND.dimColor};">Account: <strong>${opts.email}</strong></p>
  `
  return shell('Welcome to AutoMart!', body)
}

// ─── Password Reset ─────────────────────────────────────────────────────────

export function passwordResetEmail(opts: {
  userName: string
  code: string
}): string {
  const body = `
    <p style="margin:0 0 16px;">Hi ${opts.userName},</p>
    <p style="margin:0 0 20px;">We received a request to reset your password. Use the code below to continue:</p>
    <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:24px;text-align:center;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:13px;color:${BRAND.dimColor};">Your Reset Code</p>
      <p style="margin:0;font-size:32px;font-weight:bold;letter-spacing:8px;color:${BRAND.color};">${opts.code}</p>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:${BRAND.dimColor};">This code expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
  `
  return shell('Password Reset Code', body)
}
