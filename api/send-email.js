// /api/send-email — sends Classeli emails through Resend (https://resend.com).
// Emails are built here from fixed templates, so this endpoint can't be used to send arbitrary content.
//
// Vercel environment variables:
//   RESEND_API_KEY  — from resend.com (if missing, emails are skipped and the site keeps working)
//   EMAIL_FROM      — e.g. "Classeli <hello@classeli.com>" once classeli.com is verified in Resend
//   ADMIN_EMAIL     — where teacher applications and reports go (default below)

const ADMIN = process.env.ADMIN_EMAIL || "nino@pudogeorgia.com";
const FROM = process.env.EMAIL_FROM || "Classeli <onboarding@resend.dev>";
const SITE = "https://www.classeli.com";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const validEmail = (e) => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 200;

const wrap = (title, inner) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1A1A1A">
    <div style="background:#1CB0F6;color:#fff;padding:18px 24px;border-radius:14px 14px 0 0;font-size:20px;font-weight:bold">classeli</div>
    <div style="border:2px solid #E0EEF7;border-top:none;border-radius:0 0 14px 14px;padding:24px">
      <h2 style="margin:0 0 16px;font-size:20px">${title}</h2>
      ${inner}
      <p style="margin-top:28px;font-size:12px;color:#777">Classeli · <a href="${SITE}" style="color:#1CB0F6">classeli.com</a></p>
    </div>
  </div>`;
const row = (label, value) => value ? `<p style="margin:6px 0"><b>${esc(label)}:</b> ${esc(value)}</p>` : "";

const TEMPLATES = {
  booking_confirmed: (d) => ({ to: d.to, subject: `Booking confirmed — ${d.teacher || "your lesson"}`,
    html: wrap("Your lesson is booked! 🎉", row("Teacher", d.teacher) + row("Course", d.skill) + row("Time", d.slot) + row("Price", d.price != null ? `₾${d.price}` : "") +
      `<p style="margin-top:16px">Join the video lesson from your <a href="${SITE}" style="color:#1CB0F6">Classeli dashboard</a> at the scheduled time.</p>`) }),
  new_booking: (d) => ({ to: d.to, subject: `New booking — ${d.student || "a student"}`,
    html: wrap("You have a new booking", row("Student", d.student) + row("Course", d.skill) + row("Time", d.slot) + row("Price", d.price != null ? `₾${d.price}` : "") +
      `<p style="margin-top:16px">See it in your <a href="${SITE}" style="color:#1CB0F6">Classeli dashboard</a>.</p>`) }),
  new_message: (d) => ({ to: d.to, subject: `New message from ${d.from || "a Classeli user"}`,
    html: wrap("You have a new message", `<p style="background:#F0F8FF;border-radius:10px;padding:12px 14px">${esc(d.preview)}</p><p>Reply from your <a href="${SITE}" style="color:#1CB0F6">Classeli dashboard → Messages</a>.</p>`) }),
  application_received: (d) => ({ to: ADMIN, subject: `New teacher application: ${d.name || ""} — ${d.skill || ""}`,
    html: wrap("New teacher application", row("Name", d.name) + row("Email", d.email) + row("Phone", d.phone) + row("Course", d.skill) + row("Price", d.price ? `₾${d.price}` : "") +
      row("Qualifications", d.qualifications) + row("Links", d.links) + row("Bio", d.bio) + `<p style="margin-top:16px">Review it in the Admin panel.</p>`) }),
  application_decision: (d) => ({ to: d.to, subject: d.approved ? "You're approved to teach on Classeli 🎉" : "Your Classeli teacher application",
    html: d.approved
      ? wrap(`Welcome, ${esc(d.name || "teacher")}!`, `<p>Your application has been approved. Log in, open <b>Teach</b>, and complete your profile and availability so students can book you.</p><p><a href="${SITE}" style="color:#1CB0F6">Go to Classeli →</a></p>`)
      : wrap("About your application", `<p>Thank you for applying to teach on Classeli. Unfortunately we can't approve your application right now.</p>${d.reason ? `<p><b>Reason:</b> ${esc(d.reason)}</p>` : ""}<p>You're welcome to update your details and apply again.</p>`) }),
  booking_cancelled: (d) => {
    const forTeacher = d.audience === "teacher";
    const who = d.by === "teacher" ? (d.teacher || "The teacher") : (d.student || "The student");
    const refundLine = forTeacher ? "" : (d.refund
      ? `<p style="margin-top:12px;color:#2E7D32"><b>You'll get a full refund.</b> It's returned to the card you paid with.</p>`
      : `<p style="margin-top:12px">This lesson was cancelled less than 24 hours before it started, so under our Terms it isn't refundable.</p>`);
    return { to: d.to, subject: `Lesson cancelled — ${d.skill || "Classeli"}`,
      html: wrap("A lesson was cancelled", `<p>${esc(who)} cancelled this lesson.</p>` + row("Teacher", d.teacher) + row("Student", d.student) + row("Course", d.skill) + row("Time", d.slot) + refundLine +
        `<p style="margin-top:16px">Book another time from <a href="${SITE}" style="color:#1CB0F6">Classeli</a>.</p>`) };
  },
  report_received: (d) => ({ to: ADMIN, subject: `🚩 New report: ${d.reason || ""}`,
    html: wrap("New report", row("From", d.reporter) + row("About", d.reported) + row("Reason", d.reason) + row("Details", d.details)) }),
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { type, data } = req.body || {};
  const build = TEMPLATES[type];
  if (!build) return res.status(400).json({ error: "Unknown email type" });
  const mail = build(data || {});
  if (!validEmail(mail.to)) return res.status(400).json({ error: "Invalid recipient" });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ skipped: true, reason: "RESEND_API_KEY not set" });
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to: [mail.to], subject: mail.subject, html: mail.html }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: "Email provider error", details: out });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
