import { SEASONS } from "../../shared/catalog";
import Dropdown from "./Dropdown";

const box = "rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export default function WardrobeFilters({
  season,
  onSeasonChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Dropdown
        value={season}
        options={["All", ...SEASONS]}
        labels={{ All: "All seasons" }}
        onChange={onSeasonChange}
        className={box}
      />
      <Dropdown
        value={sortBy}
        options={["Newest", "Name"]}
        labels={{ Name: "Name: A–Z" }}
        onChange={onSortChange}
        className={box}
      />
    </div>
  );
}
