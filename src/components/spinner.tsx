/** Full-block page loading spinner (teal, 24px) — replaces 10 duplicated copies. */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2EC4C6] border-t-transparent" />
    </div>
  );
}
