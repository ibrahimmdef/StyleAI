import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import CategoryFilter from "../components/CategoryFilter";
import WardrobeFilters from "../components/WardrobeFilters";
import ClothingCard from "../components/ClothingCard";
import { Button } from "../components/Buttons";

export default function Wardrobe({ clothes = [] }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [season, setSeason] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [search, setSearch] = useState("");

  const filteredClothes = clothes
    .filter((item) => {
      const seasons = item.seasons ?? [];

      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      // boş seasons = bütün fəsillər
      const matchesSeason =
        season === "All" || seasons.length === 0 || seasons.includes(season);

      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSeason && matchesSearch;
    })
    .sort((a, b) => (sortBy === "Name" ? a.name.localeCompare(b.name) : 0));

  // "Newest": sonradan əlavə olunan əvvəldə görünsün
  if (sortBy !== "Name") filteredClothes.reverse();

  return (
    <div className="min-h-[70vh] rounded-2xl border border-line bg-white p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Wardrobe
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your personal clothing collection.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line px-3 sm:w-80 sm:flex-none">
            <Search size={18} className="shrink-0 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your wardrobe..."
              className="min-w-0 w-full bg-transparent py-3 text-sm outline-none"
            />
          </div>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate("/wardrobe/new")}
          >
            Add Item
          </Button>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <WardrobeFilters
          season={season}
          onSeasonChange={setSeason}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />
      </div>

      {filteredClothes.length === 0 ? (
        <p className="mt-10 text-center text-slate-500">
          {clothes.length === 0
            ? "Your wardrobe is empty. Add your first item."
            : "No items match your filters."}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredClothes.map((item) => (
            <ClothingCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
