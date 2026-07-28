import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

/** Save (or refresh) a Web Push subscription for the signed-in admin's store. */
export async function POST(request: Request) {
  const { context, error } = await requireAdminApi();
  if (error) return error;

  const parsed = subscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { endpoint, keys } = parsed.data;

  // A single admin manages every store, so the subscription is global (storeId
  // null) and receives every store's notifications (see sendStorePush).
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      storeId: null,
      adminUserId: context.adminUserId,
    },
    update: { p256dh: keys.p256dh, auth: keys.auth, storeId: null, adminUserId: context.adminUserId },
  });

  return NextResponse.json({ ok: true });
}

/** Remove a subscription (admin turned notifications off / unsubscribed). */
export async function DELETE(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const parsed = z.object({ endpoint: z.string().url() }).safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint } });
  return NextResponse.json({ ok: true });
}
