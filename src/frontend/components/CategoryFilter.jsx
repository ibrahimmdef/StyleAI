import { CATEGORIES } from "../../shared/catalog";

const categories = ["All", ...Object.keys(CATEGORIES)];

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
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const active = activeCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ${
              active
                ? "bg-brand text-white"
                : "bg-white text-muted hover:bg-selected hover:text-brand"
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
