import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdminApi } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { supabaseServiceClient } from "@/lib/supabase/server";

const createSchema = z.object({ email: z.string().trim().email().max(200) });
const deleteSchema = z.object({ adminUserId: z.string().min(1) });

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

  return NextResponse.json({ operator: { email }, tempPassword });
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
