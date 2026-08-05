import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { supabaseServiceClient } from "@/lib/supabase/server";

// Empty string clears an optional field back to null.
const emptyToNull = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  // The slug is the guest URL (`/s/<slug>`); it must stay URL-safe and unique.
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "invalid_slug"),
  googlePlaceId: emptyToNull(200),
  // Registration contact details. contactName / phone / email / address are
  // required; companyName is optional.
  companyName: emptyToNull(120),
  contactName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200),
  address: z.string().trim().min(1).max(300),
  // Registration consent items — all three required.
  termsAgreed: z.literal(true),
  billingAgreed: z.literal(true),
  cancellationAgreed: z.literal(true),
});

const CONSENT_FIELDS = ["termsAgreed", "billingAgreed", "cancellationAgreed"];

/** Create a new store — platform admin only. Also creates the operator login. */
export async function POST(request: Request) {
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    const isSlug = parsed.error.issues.some((issue) => issue.path[0] === "slug");
    const isConsent = parsed.error.issues.some((issue) => CONSENT_FIELDS.includes(String(issue.path[0])));
    return NextResponse.json(
      { error: isSlug ? "invalid_slug" : isConsent ? "consent_required" : "invalid_request" },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  // Reject a taken slug or an email that already has an operator account before
  // creating anything.
  if (await prisma.store.findUnique({ where: { slug: data.slug } })) {
    return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  }
  if (await prisma.adminUser.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const store = await prisma.store.create({
    data: {
      name: data.name,
      slug: data.slug,
      googlePlaceId: data.googlePlaceId,
      companyName: data.companyName,
      contactName: data.contactName,
      phone: data.phone,
      email,
      address: data.address,
      termsAgreedAt: new Date(),
    },
  });

  // Create the operator login from the registration email: a confirmed Supabase
  // user with a generated temp password, shown once. Roll back the store if this
  // fails so we never leave a store with no way in.
  const tempPassword = randomBytes(12).toString("base64url");
  try {
    const supabase = supabaseServiceClient();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
    if (createError || !created.user) throw createError ?? new Error("auth_create_failed");

    await prisma.adminUser.create({
      data: { supabaseUserId: created.user.id, email, role: "store_operator", storeId: store.id },
    });
  } catch {
    await prisma.store.delete({ where: { id: store.id } }).catch(() => {});
    return NextResponse.json({ error: "auth_create_failed" }, { status: 400 });
  }

  return NextResponse.json({
    store: { id: store.id, slug: store.slug, name: store.name },
    operator: { email, tempPassword },
  });
}
