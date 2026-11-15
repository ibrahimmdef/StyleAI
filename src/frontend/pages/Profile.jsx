import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Image,
  LockKeyhole,
  LogOut,
  MapPin,
  Pencil,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "../components/Buttons";

const API = "http://localhost:5000/api/profile";

const card = "rounded-2xl border border-line bg-white p-5";
const row = "flex items-center gap-4 border-t border-line py-4";
const input =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [unit, setUnit] = useState("C");
  const [itemCount, setItemCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
        setNotifications(data.notifications);
      })
      .catch(() => setError("Could not load your profile."));
  }, []);

  // The unit lives in preferences, we only show it here
  useEffect(() => {
    fetch("http://localhost:5000/api/preferences")
      .then((res) => res.json())
      .then((data) => setUnit(data.unit));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/Items")
      .then((res) => res.json())
      .then((data) => setItemCount(data.length));
  }, []);

  // Sends the whole profile, returns true when it worked
  async function save(changes) {
    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, notifications, ...changes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setName(data.name);
      setEmail(data.email);
      setNotifications(data.notifications);
      setError("");
      return true;
    } catch (err) {
      setError(err.message || "Could not save your profile.");
      return false;
    }
  }

  function startEdit() {
    setDraftName(name);
    setDraftEmail(email);
    setError("");
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!draftName.trim()) {
      setError("Name can't be empty.");
      return;
    }
    if (draftEmail && !draftEmail.includes("@")) {
      setError("That email doesn't look right.");
      return;
    }
    const ok = await save({ name: draftName, email: draftEmail });
    if (ok) setIsEditing(false);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Manage your account and customize your experience.
      </p>

      {/* Name card */}
      <section className={`${card} mt-6`}>
        <div className="flex flex-wrap items-center gap-5">
          {/* No photo yet, so the first letter stands in */}
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-selected text-2xl sm:size-20 sm:text-3xl font-semibold text-brand">
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-semibold">{name}</p>
            <p className="truncate text-sm text-muted">
              {email || "No email added"}
            </p>
          </div>
          {!isEditing && (
            <Button variant="secondary" icon={Pencil} onClick={startEdit}>
              Edit profile
            </Button>
          )}
        </div>

        {isEditing && (
          <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Name
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className={input}
              />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input
                type="email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                placeholder="you@example.com"
                className={input}
              />
            </label>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={saveEdit}>Save</Button>
            </div>
          </div>
        )}
      </section>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Account */}
        <section className={card}>
          <h2 className="mb-3 font-semibold">Account Settings</h2>
          <SettingRow
            icon={UserRound}
            title="Personal information"
            text="Update your name, email and profile photo."
            onClick={startEdit}
          />
          <SettingRow
            icon={LockKeyhole}
            title="Password & security"
            text="Change your password and manage security."
          />
          <SettingRow
            icon={MapPin}
            title="Location & weather"
            text={`Uses your device location · °${unit}`}
            to="/preferences"
          />
        </section>

        {/* App */}
        <section className={card}>
          <h2 className="mb-3 font-semibold">Preferences</h2>
          <div className={row}>
            <Bell size={20} strokeWidth={1.6} className="shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-xs text-muted">
                Outfit reminders, weather alerts and new features.
              </p>
            </div>
            {/* Same switch as on Build Your Outfit */}
            <button
              type="button"
              onClick={() => save({ notifications: !notifications })}
              aria-label="Notifications"
              className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
                notifications ? "justify-end bg-brand" : "bg-line"
              }`}
            >
              <span className="size-5 rounded-full bg-white shadow" />
            </button>
          </div>
          <SettingRow
            icon={ShieldCheck}
            title="Privacy & data"
            text="Manage your data and privacy settings."
          />
          <SettingRow
            icon={Image}
            title="Wardrobe images & storage"
            text={`${itemCount} pieces in your wardrobe.`}
            to="/wardrobe"
          />
        </section>
      </div>

      {/* There are no accounts yet, so these wait */}
      <div className="mt-5 flex items-center justify-between">
        <Button variant="secondary" icon={LogOut} disabled>
          Log out
        </Button>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 text-sm text-red-600 disabled:opacity-50"
        >
          <Trash2 size={16} /> Delete account
        </button>
      </div>
    </div>
  );
}

// One line in a settings card. With `to` it's a link, with `onClick` a button,
// with neither it's not ready yet.
function SettingRow({ icon: Icon, title, text, to, onClick }) {
  const content = (
    <>
      <Icon size={20} strokeWidth={1.6} className="shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </div>
      {to || onClick ? (
        <ChevronRight size={16} className="shrink-0 text-muted" />
      ) : (
        <span className="rounded-full bg-selected px-2 py-0.5 text-xs text-muted">
          Soon
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${row} hover:text-brand`}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${row} w-full text-left hover:text-brand`}
      >
        {content}
      </button>
    );
  }
  return <div className={row}>{content}</div>;
}
