import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  Bell,
  Camera,
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
import { getLocation } from "../components/WeatherCard";

const API = "http://localhost:5000/api/profile";
const SOON = "Accounts are coming soon.";

const card = "rounded-2xl border border-line bg-white p-5";
const row = "flex items-center gap-4 border-t border-line py-4";
const input =
  "mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-normal outline-none focus:border-brand";

export default function Profile() {
  const navigate = useNavigate();
  // Telling the layout keeps the sidebar in sync
  const { setProfile } = useOutletContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [place, setPlace] = useState("Finding your location…");
  const [photo, setPhoto] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [unit, setUnit] = useState("C");
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => showProfile(data))
      .catch(() => setError("Could not load your profile."));
  }, []);

  // The unit lives in preferences, we only show it here
  useEffect(() => {
    fetch("http://localhost:5000/api/preferences")
      .then((res) => res.json())
      .then((data) => setUnit(data.unit));
  }, []);

  useEffect(() => {
    findPlace();
  }, []);

  // Same location the weather card uses, turned into a city name
  async function findPlace() {
    const { lat, lon, isFallback } = await getLocation();
    try {
      const res = await fetch(
        `http://localhost:5000/api/place?lat=${lat}&lon=${lon}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPlace(isFallback ? `${data.place} (location off)` : data.place);
    } catch {
      setPlace("Could not find your location");
    }
  }

  function showProfile(data) {
    setName(data.name);
    setEmail(data.email);
    setPhoto(data.photo);
    setNotifications(data.notifications);
  }

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
      showProfile(data);
      setProfile(data);
      setError("");
      return true;
    } catch (err) {
      setError(err.message || "Could not save your profile.");
      return false;
    }
  }

  // The photo is sent on its own, right after it's picked
  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
    setIsUploading(true);
    try {
      const res = await fetch(`${API}/photo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPhoto(data.photo);
      setProfile(data);
      setError("");
    } catch (err) {
      setError(err.message || "Could not upload the photo.");
    } finally {
      setIsUploading(false);
    }
  }

  function startEdit() {
    setDraftName(name);
    setDraftEmail(email);
    setError("");
    setMessage("");
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

  function notReady() {
    setMessage(SOON);
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
          {/* Tapping the photo picks a new one */}
          <label className="group relative size-16 shrink-0 cursor-pointer sm:size-24">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center rounded-full bg-selected text-2xl font-semibold text-brand sm:text-3xl">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/40 text-white opacity-0 transition group-hover:opacity-100">
              <Camera size={20} />
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={uploadPhoto}
              disabled={isUploading}
              className="hidden"
            />
          </label>
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl font-bold">{name}</p>
            <p className="truncate text-sm text-muted">
              {isUploading ? "Uploading photo…" : email || "No email added"}
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
      {message && <p className="mt-4 text-sm text-brand">{message}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Account */}
        <section className={card}>
          <h2 className="mb-3 text-lg font-bold">Account Settings</h2>
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
            onClick={notReady}
          />
          <SettingRow
            icon={MapPin}
            title="Location & weather"
            text="Set your location for better weather-based recommendations."
            onClick={findPlace}
          >
            <p className="text-xs text-ink">
              {place} · °{unit}
            </p>
          </SettingRow>
        </section>

        {/* App */}
        <section className={card}>
          <h2 className="mb-3 text-lg font-bold">Preferences</h2>
          <div className={row}>
            <Bell size={22} strokeWidth={1.6} className="shrink-0 text-ink" />
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
            onClick={notReady}
          />
          <SettingRow
            icon={Image}
            title="Wardrobe images & storage"
            text="Manage your uploaded images and storage."
            to="/wardrobe"
          />
        </section>
      </div>

      {/* There are no accounts yet, so these only say so */}
      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="secondary"
          icon={LogOut}
          onClick={() => navigate("/login")}
          className="px-8"
        >
          Log out
        </Button>
        <button
          type="button"
          onClick={notReady}
          className="inline-flex items-center gap-2 text-sm font-medium text-red-600"
        >
          <Trash2 size={16} /> Delete account
        </button>
      </div>
    </div>
  );
}

// One line in a settings card: a link with `to`, a button with `onClick`.
// Anything inside it (children) shows between the title and the text.
function SettingRow({ icon: Icon, title, text, to, onClick, children }) {
  const content = (
    <>
      <Icon size={22} strokeWidth={1.6} className="shrink-0 text-ink" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {children}
        <p className="text-xs text-muted">{text}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${row} hover:text-brand`}>
        {content}
      </Link>
    );
  }
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
