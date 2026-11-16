import { useState } from "react";
import { Link } from "react-router-dom";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { fileUrl } from "../api";

const menuItem = "flex w-full items-center gap-2 px-3 py-2 text-left";

export default function ClothingCard({ item, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article
      onMouseLeave={() => setMenuOpen(false)}
      className="relative rounded-2xl border border-line bg-surface p-3"
    >
      {/* Three dots menu */}
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Item options"
        className="absolute top-2 right-2 rounded-full p-1.5 text-muted hover:bg-selected hover:text-brand"
      >
        <EllipsisVertical size={16} />
      </button>

      {menuOpen && (
        <div className="absolute top-10 right-2 z-10 w-32 rounded-xl border border-line bg-surface py-1 text-sm shadow-lg">
          <Link
            to={`/wardrobe/${item.id}/edit`}
            className={`${menuItem} hover:bg-selected`}
          >
            <Pencil size={14} /> Edit
          </Link>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete(item);
            }}
            className={`${menuItem} text-red-600 hover:bg-red-50`}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* In dark mode the photo gets a light tile, so black clothes don't vanish */}
      <div className="flex h-40 items-center justify-center rounded-xl dark:bg-ink/20">
        {item.image ? (
          <img
            src={fileUrl(item.image)}
            alt={item.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm text-muted">No image</span>
        )}
      </div>

      <h3 className="mt-3 truncate font-medium">{item.name}</h3>
      <p className="mt-0.5 text-xs text-muted">
        {item.type} · {(item.seasons ?? []).join(", ")}
      </p>
    </article>
  );
}
