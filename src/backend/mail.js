// Sends an email through Resend (resend.com, free for a few thousand a month).
// Without RESEND_API_KEY nothing is sent: the email is printed in this terminal,
// which is enough to test "forgot password" on your own machine.
export async function sendMail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n--- Email to ${to} (not sent, no RESEND_API_KEY) ---`);
    console.log(`${subject}\n\n${text}\n---\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "StyleAI <onboarding@resend.dev>",
      to,
      subject,
      text,
    }),
  });
  if (!res.ok) {
    throw new Error(`Email failed: ${res.status} ${await res.text()}`);
  }
}
