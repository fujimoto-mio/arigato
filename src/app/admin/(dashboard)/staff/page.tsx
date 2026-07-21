import { StaffManager, type StaffRow } from "@/components/admin/StaffManager";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const { store } = await requireAdmin();

  const staff = await prisma.staff.findMany({
    where: { storeId: store.id },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
    include: { _count: { select: { tips: true } } },
  });

  const rows: StaffRow[] = staff.map((member) => ({
    id: member.id,
    name: member.name,
    photoUrl: member.photoUrl,
    active: member.active,
    sortOrder: member.sortOrder,
    tipCount: member._count.tips,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">Staff roster</h2>
        <p className="text-sm text-neutral-500">
          Order here is the order guests see on the tip screen.
        </p>
      </div>
      <StaffManager initialStaff={rows} />
    </div>
  );
}
