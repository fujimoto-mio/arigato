import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

/**
 * Provision a store admin.
 *
 *   npm run admin:create -- owner@example.com "s3cret" kokoro
 *
 * Creates (or reuses) the Supabase Auth user, then links it to the store via
 * AdminUser. Supabase Auth is the credential store; AdminUser only records which
 * store that identity administers.
 */
const [email, password, slug = "kokoro"] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run admin:create -- <email> <password> [storeSlug]');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!connectionString) throw new Error("DATABASE_URL is not set");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase env vars are not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findExistingUserId(targetEmail: string): Promise<string | null> {
  // listUsers has no email filter, so page through until we find a match.
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === targetEmail.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    throw new Error(`Store "${slug}" not found. Run \`npm run db:seed\` first.`);
  }

  let userId = await findExistingUserId(email);

  if (userId) {
    console.log(`Reusing existing Supabase user for ${email}`);
    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  await prisma.adminUser.upsert({
    where: { supabaseUserId: userId },
    update: { storeId: store.id },
    create: { supabaseUserId: userId, storeId: store.id, role: "owner" },
  });

  console.log(`✓ ${email} can now sign in at /admin/login and manages "${store.slug}".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
