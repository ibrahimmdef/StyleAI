const categories = [
  "All",
  "Tops",
  "Outerwear",
  "Bottoms",
  "Shoes",
  "Accessories",
];

export default function CategoryFilter({ activeCategory, onCategoryChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          className={`rounded-full px-4 py-2 text-sm transition ${
            activeCategory === category
              ? "bg-brand text-white"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
