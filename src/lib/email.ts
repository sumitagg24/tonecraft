import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { logger } from "@/lib/logger";

/**
 * SMTP email transport — the real delivery layer for the queue's `email` jobs
 * (notification digests, invites, mentions, …).
 *
 * Configuration (SMTP_HOST/SMTP_PORT/SMTP_FROM required):
 *   SMTP_HOST   — e.g. smtp.postmarkapp.com, smtp.sendgrid.net
 *   SMTP_PORT   — 587 (STARTTLS) or 465 (implicit TLS); default 587
 *   SMTP_SECURE — "true" for implicit TLS on port 465
 *   SMTP_USER / SMTP_PASS — credentials; omitted → unauthenticated relay
 *   SMTP_FROM   — envelope From, e.g. "ToneCraft <no-reply@tonecraft.app>"
 *
 * Fail-closed contract (same convention as rate limiting): when SMTP is not
 * configured, production sends THROW so the queue job retries then
 * dead-letters with a visible error — emails are never silently dropped. In
 * development the send is skipped with a warning so local work is not blocked.
 */

const CONFIGURED = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_FROM
);

export function isEmailConfigured(): boolean {
  return CONFIGURED;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      ...(process.env.SMTP_USER
        ? {
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
        : {}),
    });
  }
  return transporter;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Send one email. Throws on SMTP failure or when unconfigured in production. */
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!CONFIGURED) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SMTP is not configured (SMTP_HOST, SMTP_PORT and SMTP_FROM are required)"
      );
    }
    logger.warn("[Email] not configured — skipping send", {
      to: message.to,
      subject: message.subject,
    });
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });
  } catch (error) {
    logger.error("[Email] send failed", {
      to: message.to,
      subject: message.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error; // let the queue worker retry with backoff
  }
}
