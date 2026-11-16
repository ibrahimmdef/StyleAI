import { SEASONS } from "../../shared/catalog";

export default function WardrobeFilters({
  season,
  onSeasonChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={season}
        onChange={(e) => onSeasonChange(e.target.value)}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
      >
        <option value="All">All seasons</option>
        {SEASONS.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-xl border border-line bg-surface px-3 py-2 text-sm"
      >
        <option value="Newest">Newest</option>
        <option value="Name">Name: A–Z</option>
      </select>
    </div>
  );
}
