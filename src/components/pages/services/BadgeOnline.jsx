export default function BadgeOnline({ on = false }) {
  if (!on) return null;
  return (
    <span title="Online"
      className="absolute top-3 right-3 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
  );
}
