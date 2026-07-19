"use client";

type StaffOption = {
  id: string;
  name: string;
  photoUrl: string | null;
};

export function StaffPicker({
  staff,
  selectedId,
  onSelect,
}: {
  staff: StaffOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 py-2">
      {staff.map((member) => {
        const isSelected = member.id === selectedId;
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            aria-pressed={isSelected}
            className="flex flex-shrink-0 flex-col items-center gap-2"
          >
            <span
              className={`flex h-20 w-20 items-center justify-center rounded-full border-2 bg-neutral-100 text-2xl ${
                isSelected ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30" : "border-transparent"
              }`}
            >
              {member.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photoUrl} alt={member.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                "👤"
              )}
            </span>
            <span className={`text-sm font-medium ${isSelected ? "text-[var(--color-brand)]" : "text-neutral-700"}`}>
              {member.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
