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
        className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
      >
        <option value="All">All seasons</option>
        <option value="Spring">Spring</option>
        <option value="Summer">Summer</option>
        <option value="Autumn">Autumn</option>
        <option value="Winter">Winter</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
      >
        <option value="Newest">Newest</option>
        <option value="Name">Name: A–Z</option>
      </select>
    </div>
  );
}
