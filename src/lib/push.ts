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

export type PushPayload = {
  /** The store this notification is about — scopes who receives it. */
  storeId: string;
  /** Store name — admin devices lead with it; the store's own operators don't. */
  storeName: string;
  /** Base title (no store name). Admins get "<storeName>｜<title>"; the store's
   *  operators get just "<title>" (they only manage one store). */
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Send a Web Push notification about a store's tip/review to the right devices:
 *  - every platform admin (manages all stores) — title leads with the store name, and
 *  - that store's operators only — title without the store name.
 *
 * Dead subscriptions (404/410) are pruned. Failures are logged, never thrown — a
 * missed notification must not fail the request that recorded a real tip.
 */
export async function sendStorePush(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) {
    console.error("web push: VAPID keys are not set");
    return;
  }

  const [operators, admins] = await Promise.all([
    prisma.adminUser.findMany({
      where: { storeId: payload.storeId, role: "store_operator" },
      select: { id: true },
    }),
    prisma.adminUser.findMany({ where: { NOT: { role: "store_operator" } }, select: { id: true } }),
  ]);
  const operatorIds = new Set(operators.map((a) => a.id));
  const adminIds = new Set(admins.map((a) => a.id));

  // Two payloads: admins (and legacy null-linked devices) lead with the store
  // name; this store's operators drop it.
  const adminBody = JSON.stringify({
    title: `${payload.storeName}｜${payload.title}`,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
  });
  const operatorBody = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url, tag: payload.tag });

  const subs = await prisma.pushSubscription.findMany();
  const targets = subs
    .map((sub) => {
      if (sub.adminUserId == null || adminIds.has(sub.adminUserId)) return { sub, body: adminBody };
      if (operatorIds.has(sub.adminUserId)) return { sub, body: operatorBody };
      return null;
    })
    .filter((t): t is { sub: (typeof subs)[number]; body: string } => t !== null);
  if (targets.length === 0) return;

  await Promise.all(
    targets.map(async ({ sub, body }) => {
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

/**
 * Send a push to specific admin devices (by adminUserId) — used for directional
 * notifications like support replies. `includeLegacyNull` also targets legacy
 * subscriptions with no admin link (treated as platform-admin devices).
 */
export async function sendPushToAdminIds(
  adminUserIds: string[],
  payload: { title: string; body: string; url?: string; tag?: string },
  includeLegacyNull = false,
): Promise<void> {
  if (!ensureConfigured()) {
    console.error("web push: VAPID keys are not set");
    return;
  }
  const allowed = new Set(adminUserIds);
  const subs = await prisma.pushSubscription.findMany();
  const targets = subs.filter(
    (sub) => (sub.adminUserId != null && allowed.has(sub.adminUserId)) || (includeLegacyNull && sub.adminUserId == null),
  );
  if (targets.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    targets.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode ?? 0;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
        } else {
          console.error("web push send failed", status, (error as Error).message);
        }
      }
    }),
  );
}
