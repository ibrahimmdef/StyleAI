import { Link } from "react-router-dom";

// Clicking a card opens the edit page for that item
export default function ClothingCard({ item }) {
  return (
    <Link
      to={`/wardrobe/${item.id}/edit`}
      className="block overflow-hidden rounded-2xl border border-line bg-white p-3 transition hover:border-brand/40"
    >
      <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm text-slate-400">No image</span>
        )}
      </div>

      <h3 className="mt-3 font-medium text-slate-900">{item.name}</h3>

      <p className="mt-1 text-sm text-slate-500">
        {item.type} · {(item.seasons ?? []).join(", ")}
      </p>
    </Link>
  );
}
