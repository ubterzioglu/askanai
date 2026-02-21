import nodemailer from "nodemailer";
import { getEnv } from "./env";

type SendAccountEmailsParams = {
  userEmail: string;
  plainPassword: string;
};

function parsePort(value?: string): number {
  const n = Number(value || "587");
  return Number.isFinite(n) ? n : 587;
}

function parseRecipients(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function sendAccountCreatedEmails(params: SendAccountEmailsParams): Promise<boolean> {
  const host = getEnv("ZOHO_SMTP_HOST");
  const port = parsePort(getEnv("ZOHO_SMTP_PORT"));
  const user = getEnv("ZOHO_SMTP_USER");
  const pass = getEnv("ZOHO_SMTP_PASSWORD");
  const adminRecipients = parseRecipients(getEnv("MAIL_TO"));

  if (!host || !user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const userText =
    "Hesabiniz basariyla olusturuldu.\n\n" +
    `E-posta: ${params.userEmail}\n\n` +
    "Talebiniz dogrultusunda sifreniz e-posta ile paylasilmistir:\n" +
    `Sifre: ${params.plainPassword}\n\n` +
    "Lutfen sifrenizi guvenli bir yerde saklayin ve kimseyle paylasmayin.";

  const adminText =
    "Yeni hesap olusturuldu.\n\n" +
    `Kullanici e-postasi: ${params.userEmail}\n` +
    `Olusturma zamani (UTC): ${new Date().toISOString()}\n` +
    "Not: Sifre bilgisi admin bildirimi e-postasina eklenmez.";

  const jobs: Promise<unknown>[] = [
    transporter.sendMail({
      from: user,
      to: params.userEmail,
      subject: "AskAnAI hesabiniz olusturuldu",
      text: userText,
    }),
  ];

  if (adminRecipients.length) {
    jobs.push(
      transporter.sendMail({
        from: user,
        to: adminRecipients.join(","),
        subject: "AskAnAI yeni kullanici kaydi",
        text: adminText,
      })
    );
  }

  await Promise.all(jobs);
  return true;
}
