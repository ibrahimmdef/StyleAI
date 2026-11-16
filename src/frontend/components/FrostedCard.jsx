// A card with a soft, blurry background, used behind outfit pictures so
// white and gray pieces don't vanish. isolate keeps the -z-10 spots inside the card.
export default function FrostedCard({ className = "", children }) {
  return (
    <section
      className={`relative isolate overflow-hidden rounded-2xl border border-surface bg-linear-to-br from-selected via-canvas to-surface p-4 shadow-soft sm:p-6 ${className}`}
    >
      <span className="absolute -top-24 -left-24 -z-10 size-96 rounded-full bg-brand/20 blur-3xl" />
      <span className="absolute top-1/3 -right-32 -z-10 size-96 rounded-full bg-ink/10 blur-3xl" />
      <span className="absolute -bottom-32 left-1/4 -z-10 size-80 rounded-full bg-brand/10 blur-3xl" />
      {children}
    </section>
  );
}
