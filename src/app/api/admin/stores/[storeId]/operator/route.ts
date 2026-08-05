import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { supabaseServiceClient } from "@/lib/supabase/server";

const createSchema = z.object({ email: z.string().trim().email().max(200) });
const deleteSchema = z.object({ adminUserId: z.string().min(1) });
// Update an operator's login email and/or password (bcrypt caps password at 72 bytes).
const updateSchema = z
  .object({
    adminUserId: z.string().min(1),
    email: z.string().trim().email().max(200).optional(),
    password: z.string().min(8).max(72).optional(),
  })
  .refine((data) => data.email !== undefined || data.password !== undefined, "nothing_to_update");

/** List the store's operator accounts. Platform admin only. */
export async function GET(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const operators = await prisma.adminUser.findMany({
    where: { storeId, role: "store_operator" },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ operators });
}

/**
 * Create a store-operator account for this store (1 account = 1 store). Creates a
 * confirmed Supabase user with a generated temporary password and returns it once
 * so the platform admin can hand it to the store. No email/SMTP dependency.
 */
export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "store_not_found" }, { status: 404 });

  // One operator account per store (1 account = 1 store).
  const existing = await prisma.adminUser.findFirst({ where: { storeId, role: "store_operator" } });
  if (existing) return NextResponse.json({ error: "operator_exists" }, { status: 409 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  if (await prisma.adminUser.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  // URL-safe temporary password (~16 chars).
  const tempPassword = randomBytes(12).toString("base64url");
  const supabase = supabaseServiceClient();
  const { data, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createError || !data.user) {
    // Most commonly: the email is already registered in Supabase auth.
    return NextResponse.json({ error: "auth_create_failed" }, { status: 400 });
  }

  await prisma.adminUser.create({
    data: { supabaseUserId: data.user.id, email, role: "store_operator", storeId },
  });

  // Issuing the login is the "account creation + 有効化" step: a pending store
  // (created via the public /subscribe flow) becomes active, and its email is
  // mirrored to the login. The guest page still needs a live subscription.
  await prisma.store.updateMany({
    where: { id: storeId, status: "pending" },
    data: { status: "active" },
  });
  await prisma.store.update({ where: { id: storeId }, data: { email } });

  return NextResponse.json({ operator: { email }, tempPassword });
}

/** Update a store operator's login email and/or password. Platform admin only. */
export async function PATCH(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const operator = await prisma.adminUser.findFirst({
    where: { id: parsed.data.adminUserId, storeId, role: "store_operator" },
  });
  if (!operator) return NextResponse.json({ error: "operator_not_found" }, { status: 404 });

  const supabase = supabaseServiceClient();

  // Email is also the store's contact email — update the auth user, the AdminUser
  // row, and mirror onto the store so everything stays in sync.
  if (parsed.data.email !== undefined) {
    const nextEmail = parsed.data.email.toLowerCase();
    if (nextEmail !== operator.email) {
      const clash = await prisma.adminUser.findUnique({ where: { email: nextEmail } });
      if (clash && clash.id !== operator.id) {
        return NextResponse.json({ error: "email_taken" }, { status: 409 });
      }
      const { error: authError } = await supabase.auth.admin.updateUserById(operator.supabaseUserId, {
        email: nextEmail,
        email_confirm: true,
      });
      if (authError) return NextResponse.json({ error: "email_update_failed" }, { status: 400 });
      await prisma.adminUser.update({ where: { id: operator.id }, data: { email: nextEmail } });
      await prisma.store.update({ where: { id: storeId }, data: { email: nextEmail } });
    }
  }

  if (parsed.data.password !== undefined) {
    const { error: authError } = await supabase.auth.admin.updateUserById(operator.supabaseUserId, {
      password: parsed.data.password,
    });
    if (authError) return NextResponse.json({ error: "password_update_failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

/** Remove a store-operator account (deletes the Supabase user + AdminUser row). */
export async function DELETE(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { error } = await requirePlatformAdminApi();
  if (error) return error;

  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const operator = await prisma.adminUser.findFirst({
    where: { id: parsed.data.adminUserId, storeId, role: "store_operator" },
  });
  if (!operator) return NextResponse.json({ error: "operator_not_found" }, { status: 404 });

  const supabase = supabaseServiceClient();
  await supabase.auth.admin.deleteUser(operator.supabaseUserId).catch(() => {});
  await prisma.adminUser.delete({ where: { id: operator.id } });

  return NextResponse.json({ ok: true });
}
