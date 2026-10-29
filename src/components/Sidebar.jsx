import {
  EllipsisVertical,
  House,
  PanelTop,
  Shirt,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { NavLink, Link } from "react-router-dom";

const links = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/wardrobe", label: "Wardrobe", icon: PanelTop },
  { to: "/outfits", label: "Outfits", icon: Shirt },
  {
    to: "/preferences",
    label: "Style & Preferences",
    mobileLabel: "Style",
    icon: SlidersHorizontal,
  },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function Brand() {
  return (
    <Link
      to="/"
      aria-label="StyleAI home"
      className="inline-flex items-center gap-2.5 rounded-lg text-ink"
    >
      <span className="flex size-8 items-center justify-center rounded-[9px] border border-brand text-brand">
        <Shirt size={21} strokeWidth={1.5} />
      </span>
      <span className="text-lg font-bold tracking-tight">StyleAI</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[205px] flex-col border-r border-line/70 bg-[linear-gradient(145deg,#f7fbff,#eff7ff)] px-4 pt-6 pb-5 lg:flex xl:w-[220px]">
      <div className="px-1.5">
        <Brand />
      </div>
      <nav
        aria-label="Main navigation"
        className="mt-8 flex flex-col gap-2 justify-between"
      >
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-[13px] transition ${isActive ? "bg-selected font-medium text-brand" : "text-muted hover:bg-selected/60 hover:text-brand"}`
            }
          >
            <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <Link
        to="/profile"
        className="mt-auto flex items-center gap-2.5 rounded-xl pt-8"
        aria-label="Open Elif’s profile"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#d8e4f4] text-xs font-semibold text-[#4f6487]">
          EA
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold">Elif</span>
          <span className="block truncate text-[10px] text-muted">
            elif@example.com
          </span>
        </span>
        <EllipsisVertical size={16} className="text-brand" aria-hidden="true" />
      </Link>
    </aside>
  );
}

export function MobileNavigation() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-white/95 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden"
    >
      {links.map(({ to, label, mobileLabel, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[10px] ${isActive ? "bg-selected/70 font-medium text-brand" : "text-muted"}`
          }
        >
          <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
          {mobileLabel ?? label}
        </NavLink>
      ))}
    </nav>
  );
}
