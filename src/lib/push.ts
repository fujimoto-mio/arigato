import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Strip any surrounding quotes — a quoted VAPID key fails signing (all pushes
// silently error), a common .env mistake.
const unquote = (value: string | undefined) => value?.replace(/^["']|["']$/g, "");
const publicKey = unquote(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
const privateKey = unquote(process.env.VAPID_PRIVATE_KEY);
const subject = unquote(process.env.VAPID_SUBJECT) || "mailto:admin@tipjapan.com";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/**
 * Send a Web Push notification to every subscribed admin device. A single admin
 * manages every store and wants every store's notifications, so this ignores the
 * store — all admin devices are notified. Dead subscriptions (404/410) are
 * pruned. Failures are logged, never thrown — a missed notification must not
 * fail the request that recorded a real tip.
 */
export async function sendStorePush(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) {
    console.error("web push: VAPID keys are not set");
    return;
  }

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode ?? 0;
        if (status === 404 || status === 410) {
          // Subscription no longer valid — remove it.
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
        } else {
          console.error("web push send failed", status, (error as Error).message);
        }
      }
    }),
  );
}
