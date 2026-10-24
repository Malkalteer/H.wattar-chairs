const nodemailer = require('nodemailer');

const isEmailEnabled = () => Boolean(process.env.SMTP_HOST);

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const layout = ({ title, bodyHtml, buttonText, buttonUrl }) => `
<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#f5f2ee;padding:24px">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:16px;padding:28px;color:#1c1a19">
    <h2 style="margin:0 0 16px;color:#5f3426">${escapeHtml(title)}</h2>
    <div style="line-height:1.9;font-size:15px">${bodyHtml}</div>
    ${buttonUrl ? `<p style="text-align:center;margin:28px 0"><a href="${escapeHtml(buttonUrl)}" style="background:#5f3426;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none">${escapeHtml(buttonText)}</a></p>` : ''}
    <p style="color:#999;font-size:12px;margin-top:24px">Wattar Chair</p>
  </div>
</div>`;

// يرسل بريدًا، وإن لم يكن SMTP مضبوطًا يطبع الرسالة في سجل الخادم (مفيد للتطوير)
const sendMail = async ({ to, subject, title, bodyHtml, buttonText, buttonUrl, text }) => {
  if (!to) return false;

  if (!isEmailEnabled()) {
    console.log(`\n[البريد غير مفعّل] إلى: ${to}\nالموضوع: ${subject}\n${text || ''}${buttonUrl ? `\nالرابط: ${buttonUrl}` : ''}\n`);
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: `${text || title}${buttonUrl ? `\n${buttonUrl}` : ''}`,
      html: layout({ title: title || subject, bodyHtml: bodyHtml || escapeHtml(text), buttonText, buttonUrl }),
    });
    return true;
  } catch (error) {
    console.error('Mail error:', error.message);
    return false;
  }
};

// إشعار للمدير (ADMIN_EMAIL) — لا يوقف العملية إن فشل
const notifyAdmin = (subject, text, path = '/admin') => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return sendMail({
    to: process.env.ADMIN_EMAIL,
    subject,
    title: subject,
    text,
    bodyHtml: escapeHtml(text).replace(/\n/g, '<br>'),
    buttonText: 'فتح لوحة التحكم',
    buttonUrl: `${clientUrl}${path}`,
  }).catch(() => false);
};

module.exports = { sendMail, notifyAdmin, isEmailEnabled, escapeHtml };
