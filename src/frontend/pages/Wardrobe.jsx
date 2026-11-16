import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import CategoryFilter from "../components/CategoryFilter";
import WardrobeFilters from "../components/WardrobeFilters";
import ClothingCard from "../components/ClothingCard";
import { Button } from "../components/Buttons";
import { API_URL } from "../api";

export default function Wardrobe() {
  const navigate = useNavigate();

  const [clothes, setClothes] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/Items`)
      .then((res) => res.json())
      .then((data) => setClothes(data));
  }, []);

  // The card only asks, the list lives here, so the delete happens here too
  async function deleteItem(item) {
    if (!confirm(`Delete "${item.name}" from your wardrobe?`)) return;

    const res = await fetch(`${API_URL}/api/Items/${item.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("Item could not be deleted.");
      return;
    }
    setClothes(clothes.filter((c) => c.id !== item.id));
  }

  const [activeCategory, setActiveCategory] = useState("All");
  const [season, setSeason] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [search, setSearch] = useState("");

  const filteredClothes = clothes
    .filter((item) => {
      const seasons = item.seasons ?? [];

      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      // no seasons picked means it works in any season
      const matchesSeason =
        season === "All" || seasons.length === 0 || seasons.includes(season);

      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSeason && matchesSearch;
    })
    .sort((a, b) => (sortBy === "Name" ? a.name.localeCompare(b.name) : 0));

  // "Newest": show the latest added items first
  if (sortBy !== "Name") filteredClothes.reverse();

  return (
    <div className="min-h-[70vh] rounded-2xl border border-line bg-surface p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            My Wardrobe
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your personal clothing collection.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line px-3 sm:w-80 sm:flex-none">
            <Search size={18} className="shrink-0 text-muted" />
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
          clothes={clothes}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <WardrobeFilters
          season={season}
          onSeasonChange={setSeason}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {filteredClothes.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          {clothes.length === 0
            ? "Your wardrobe is empty. Add your first item."
            : "No items match your filters."}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredClothes.map((item) => (
            <ClothingCard key={item.id} item={item} onDelete={deleteItem} />
          ))}
        </div>
      )}
    </div>
  );
}
