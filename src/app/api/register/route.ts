import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { nameToSlug } from "@/lib/slug";
import { supabaseServiceClient } from "@/lib/supabase/server";

const emptyToNull = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional();

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  companyName: emptyToNull(120),
  contactName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(72),
  address: z.string().trim().min(1).max(300),
  // Registration consent items — all three required.
  termsAgreed: z.literal(true),
  billingAgreed: z.literal(true),
  cancellationAgreed: z.literal(true),
});

const CONSENT_FIELDS = ["termsAgreed", "billingAgreed", "cancellationAgreed"];

async function makeUniqueSlug(name: string): Promise<string> {
  // Romaji for Japanese names (寿司はな → "sushihana"); "store" for all-kanji.
  const root = (nameToSlug(name) || "store").slice(0, 40);
  let candidate = root;
  while (await prisma.store.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${root}-${randomBytes(3).toString("hex")}`.slice(0, 50);
  }
  return candidate;
}

/**
 * Public store self-registration. Creates a "pending" store and the operator's
 * login (with their own password); the guest QR/page stays unpublished until the
 * platform admin approves it.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    const isConsent = parsed.error.issues.some((issue) => CONSENT_FIELDS.includes(String(issue.path[0])));
    const isPassword = parsed.error.issues.some((issue) => issue.path[0] === "password");
    return NextResponse.json(
      { error: isConsent ? "consent_required" : isPassword ? "weak_password" : "invalid_request" },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  if (await prisma.adminUser.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const slug = await makeUniqueSlug(data.name);
  const store = await prisma.store.create({
    data: {
      name: data.name,
      slug,
      status: "pending",
      companyName: data.companyName,
      contactName: data.contactName,
      phone: data.phone,
      email,
      address: data.address,
      termsAgreedAt: new Date(),
    },
  });

  // Create the operator login with their chosen password. Roll back the store if
  // this fails so a registration never leaves a store with no way in.
  try {
    const supabase = supabaseServiceClient();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: data.password,
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

  return NextResponse.json({ ok: true });
}
