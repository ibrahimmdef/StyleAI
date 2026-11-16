import { CATEGORIES } from "../../shared/catalog";

const categories = ["All", ...Object.keys(CATEGORIES)];

// Phones: one row you swipe sideways. Bigger screens: wraps onto more lines.
const row =
  "no-scrollbar flex gap-2 overflow-x-auto mask-r-from-85% sm:flex-wrap sm:overflow-visible sm:mask-none";

// How many pieces are in a category. "All" is everything.
function countIn(clothes, category) {
  if (category === "All") return clothes.length;
  return clothes.filter((item) => item.category === category).length;
}

export default function CategoryFilter({
  clothes,
  activeCategory,
  onCategoryChange,
}) {
  return (
    <div className={row}>
      {categories.map((category) => {
        const active = activeCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm transition sm:px-4 ${
              active
                ? "bg-brand text-white"
                : "bg-surface text-muted hover:bg-selected hover:text-brand"
            }`}
          >
            {category}
            <span
              className={`rounded-full px-1.5 text-xs ${
                active ? "bg-white/20" : "bg-selected text-brand"
              }`}
            >
              {countIn(clothes, category)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
