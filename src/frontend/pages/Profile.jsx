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
  Moon,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "../components/Buttons";
import { STORAGE, applyTheme, removeStorage, writeStorage } from "../data";
import { getLocation } from "../components/WeatherCard";
import { API_URL, fileUrl } from "../api";

const API = `${API_URL}/api/profile`;
const SOON = "Accounts are coming soon.";

const card = "rounded-2xl border border-line bg-surface p-5";
const row = "flex items-center gap-4 border-t border-line py-4";
const input =
  "mt-1 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-normal outline-none focus:border-brand";

export default function Profile() {
  const navigate = useNavigate();
  // Telling the layout keeps the sidebar in sync
  const { setProfile } = useOutletContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [place, setPlace] = useState("Finding your location…");
  const [photo, setPhoto] = useState("");
  const [notifications, setNotifications] = useState(true);
  // main.jsx already set the theme, so the page tells us which one is on
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [unit, setUnit] = useState("C");
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [itemCount, setItemCount] = useState(0);
  const [outfitCount, setOutfitCount] = useState(0);

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => showProfile(data))
      .catch(() => setError("Could not load your profile."));
  }, []);

  // The unit lives in preferences, we only show it here
  useEffect(() => {
    fetch(`${API_URL}/api/preferences`)
      .then((res) => res.json())
      .then((data) => setUnit(data.unit));
  }, []);

  useEffect(() => {
    findPlace();
  }, []);

  // Counts for the reset question, so people know what they'd lose
  useEffect(() => {
    fetch(`${API_URL}/api/Items`)
      .then((res) => res.json())
      .then((data) => setItemCount(data.length));
    fetch(`${API_URL}/api/outfits`)
      .then((res) => res.json())
      .then((data) => setOutfitCount(data.length));
  }, []);

  // Same location the weather card uses, turned into a city name
  async function findPlace() {
    const { lat, lon, isFallback } = await getLocation();
    try {
      const res = await fetch(`${API_URL}/api/place?lat=${lat}&lon=${lon}`);
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

  // Saved on this device only, it's about this screen
  function toggleDark() {
    const theme = isDark ? "light" : "dark";
    writeStorage(STORAGE.theme, theme);
    applyTheme(theme);
    setIsDark(!isDark);
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

  // Empties the wardrobe and the saved outfits, for starting over with your own clothes
  async function resetWardrobe() {
    const sure = confirm(
      `Delete all ${itemCount} pieces and ${outfitCount} saved outfits? This can't be undone.`,
    );
    if (!sure) return;

    try {
      const items = await fetch(`${API_URL}/api/Items`, { method: "DELETE" });
      const outfits = await fetch(`${API_URL}/api/outfits`, {
        method: "DELETE",
      });
      if (!items.ok || !outfits.ok) throw new Error();
      // Today's outfit points at pieces that are gone now
      removeStorage(STORAGE.outfit);
      removeStorage(STORAGE.outfitDay);
      setItemCount(0);
      setOutfitCount(0);
      setError("");
      setMessage("Your wardrobe is empty now. Time to add your own pieces!");
    } catch {
      setError("Could not reset the wardrobe.");
    }
  }

  async function changePassword() {
    setMessage("");
    if (newPassword.length < 8) {
      setError("New password needs at least 8 characters.");
      return;
    }
    if (newPassword !== repeatPassword) {
      setError("The new passwords don't match.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: currentPassword, next: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setChangingPassword(false);
      setError("");
      setMessage("Password changed. Other devices are logged out.");
    } catch (err) {
      setError(err.message || "Could not change the password.");
    }
  }

  // Today's outfit on this device belongs to whoever was logged in
  function forgetDevice() {
    removeStorage(STORAGE.outfit);
    removeStorage(STORAGE.outfitDay);
  }

  async function logOut() {
    await fetch(`${API_URL}/api/auth/logout`, { method: "POST" });
    forgetDevice();
    navigate("/login");
  }

  async function deleteAccount() {
    const sure = confirm(
      "Delete your account, your wardrobe and your saved outfits for good? This can't be undone.",
    );
    if (!sure) return;

    const res = await fetch(`${API_URL}/api/auth/account`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Could not delete the account.");
      return;
    }
    forgetDevice();
    navigate("/login");
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
                src={fileUrl(photo)}
                alt={name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center rounded-full bg-selected text-2xl font-semibold text-brand sm:text-3xl">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/40 text-white dark:bg-black/50 opacity-0 transition group-hover:opacity-100">
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
            onClick={() => setChangingPassword(!changingPassword)}
          />
          {changingPassword && (
            <div className="flex flex-col gap-3 border-t border-line py-4">
              <label className="block text-sm font-medium">
                Current password
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={input}
                />
              </label>
              <label className="block text-sm font-medium">
                New password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={input}
                />
              </label>
              <label className="block text-sm font-medium">
                New password again
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className={input}
                />
              </label>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setChangingPassword(false)}
                >
                  Cancel
                </Button>
                <Button onClick={changePassword}>Change password</Button>
              </div>
            </div>
          )}
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
          <div className={row}>
            <Moon size={22} strokeWidth={1.6} className="shrink-0 text-ink" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted">Easier on the eyes at night.</p>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              aria-label="Dark mode"
              className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
                isDark ? "justify-end bg-brand" : "bg-line"
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

      {/* Account actions */}
      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="secondary"
          icon={LogOut}
          onClick={logOut}
          className="px-8"
        >
          Log out
        </Button>
        <div className="flex flex-wrap justify-end gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={resetWardrobe}
            disabled={itemCount === 0 && outfitCount === 0}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            <RotateCcw size={16} /> Reset wardrobe
          </button>
          <button
            type="button"
            onClick={deleteAccount}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600"
          >
            <Trash2 size={16} /> Delete account
          </button>
        </div>
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
