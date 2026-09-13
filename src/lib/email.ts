// TESTING MODE (D-059): Resend removed — email is a console stub. Callers
// (alerts, transactions, feedback) keep working unchanged; every "email"
// just logs. For full launch, swap this one function for a real provider.

export async function sendEmail(to: string, subject: string, text: string) {
  console.log(`[email stub — testing mode] to=${to} subject="${subject}"\n${text}`);
}
