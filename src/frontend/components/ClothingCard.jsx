export default function ClothingCard({ item }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white p-3">
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
        {item.category} · {item.season}
      </p>
    </article>
  );
}
