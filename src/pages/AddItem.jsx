import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Plus } from "lucide-react";

const TYPES = {
  Tops: ["T-shirt", "Shirt", "Sweater", "Hoodie"],
  Outerwear: ["Jacket", "Coat", "Blazer", "Vest"],
  Bottoms: ["Jeans", "Trousers", "Shorts", "Skirt"],
  Shoes: ["Sneakers", "Boots", "Loafers", "Sandals"],
  Accessories: ["Bag", "Belt", "Hat", "Scarf"],
};

const COLORS = {
  Brown: "#5b3a2e",
  Black: "#1c1c1e",
  White: "#ffffff",
  Beige: "#d2b49c",
  Gray: "#9ca3af",
  Blue: "#6b8cae",
};

const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
const STYLES = ["Casual", "Smart casual", "Minimal", "Sporty"];

const input =
  "mt-1 w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-blue-500";

export default function AddItem({ onAdd }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Outerwear");
  const [type, setType] = useState("Jacket");
  const [color, setColor] = useState("Brown");
  const [seasons, setSeasons] = useState([]);
  const [styles, setStyles] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  const toggle = (list, setList, v) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (
      !["image/jpeg", "image/png"].includes(f.type) ||
      f.size > 10 * 1024 * 1024
    ) {
      setError("Use a JPG or PNG photo up to 10 MB.");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter an item name.");
    // image: File obyekti, backend-ə FormData ilə göndər
    onAdd({
      name: name.trim(),
      category,
      type,
      color,
      seasons,
      styles,
      image: file,
    });
    navigate("/wardrobe");
  }

  const chip = (active) =>
    `flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${
      active
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-line text-slate-600"
    }`;

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <Link
        to="/wardrobe"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={18} /> Back to wardrobe
      </Link>
      <h1 className="mt-3 text-3xl font-bold">Add a new item</h1>
      <p className="text-slate-500">
        Add a piece to get better outfit suggestions.
      </p>

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl bg-white p-6 shadow-sm"
      >
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Foto */}
          <div>
            <h3 className="font-semibold">Item photo</h3>
            <div className="mt-2 grid aspect-square place-items-center overflow-hidden rounded-xl border border-line bg-slate-50">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-sm text-slate-400">No photo yet</span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">JPG or PNG · Up to 10 MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={pickFile}
                hidden
              />
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="rounded-xl border border-blue-200 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                {preview ? "Replace photo" : "Add photo"}
              </button>
            </div>
          </div>

          {/* Detallar */}
          <div className="space-y-4">
            <h3 className="font-semibold">Item details</h3>

            <label className="block text-sm">
              Item name *
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={input}
                placeholder="e.g. Leather jacket"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Category *
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setType(TYPES[e.target.value][0]);
                  }}
                  className={input}
                >
                  {Object.keys(TYPES).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={input}
                >
                  {TYPES[category].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <p className="text-sm">
                Color: <span className="text-slate-500">{color}</span>
              </p>
              <div className="mt-2 flex gap-3">
                {Object.entries(COLORS).map(([n, hex]) => (
                  <button
                    key={n}
                    type="button"
                    title={n}
                    aria-label={n}
                    aria-pressed={color === n}
                    onClick={() => setColor(n)}
                    style={{ backgroundColor: hex }}
                    className={`grid size-9 place-items-center rounded-full border border-black/10 ${
                      color === n ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                  >
                    {color === n && (
                      <Check
                        size={16}
                        className={
                          n === "White" ? "text-slate-700" : "text-white"
                        }
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm">Season</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {SEASONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={seasons.includes(s)}
                    onClick={() => toggle(seasons, setSeasons, s)}
                    className={chip(seasons.includes(s))}
                  >
                    {seasons.includes(s) && <Check size={14} />}
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm">Style</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={styles.includes(s)}
                    onClick={() => toggle(styles, setStyles, s)}
                    className={chip(styles.includes(s))}
                  >
                    {styles.includes(s) && <Check size={14} />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => navigate("/wardrobe")}
            className="rounded-xl border border-blue-200 px-5 py-2.5 text-blue-600 hover:bg-blue-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
          >
            <Plus size={18} /> Add to wardrobe
          </button>
        </div>
      </form>
    </div>
  );
}
