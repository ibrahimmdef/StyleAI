import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brand } from "../components/Sidebar";
import CookieBanner from "../components/CookieBanner";
import { STORAGE, readStorage, removeStorage, writeStorage } from "../data";
import { API_URL } from "../api";

const input =
  "w-full rounded-full border border-line bg-canvas/60 px-5 py-3 text-sm outline-none transition focus:-translate-y-0.5 focus:border-brand focus:bg-surface focus:shadow-soft";
const mainButton =
  "mt-4 rounded-full bg-brand px-12 py-3 text-xs font-bold tracking-wider text-white uppercase transition hover:-translate-y-0.5 hover:bg-brand-hover active:scale-95";
const ghostButton =
  "mt-6 rounded-full border-2 border-white px-12 py-3 text-xs font-bold tracking-wider uppercase transition hover:-translate-y-0.5 hover:bg-white/10 active:scale-95";
const panelText =
  "absolute inset-0 flex flex-col items-center justify-center px-10 text-center transition-opacity duration-700";

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  // A remembered email fills itself in
  const [email, setEmail] = useState(() => readStorage(STORAGE.remember, ""));
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() =>
    Boolean(readStorage(STORAGE.remember, "")),
  );
  const [showConsent, setShowConsent] = useState(false);
  const [error, setError] = useState("");

  function switchTo(signUp) {
    setIsSignUp(signUp);
    setError("");
  }

  // signUp comes from the form itself, so the right one is always used
  async function submit(e, signUp) {
    e.preventDefault();
    if (signUp && !name.trim()) {
      setError("Enter your name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (signUp && password.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/auth/${signUp ? "signup" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, remember }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      return;
    }

    if (signUp) {
      // New here: ask about storage and location first, unless already asked
      if (readStorage(STORAGE.consent, null) === null) {
        setShowConsent(true);
        return;
      }
    } else if (remember) {
      writeStorage(STORAGE.remember, email);
    } else {
      removeStorage(STORAGE.remember);
    }
    navigate("/");
  }

  // Both forms look the same, sign up just has a name field on top
  function renderForm(signUp) {
    const active = isSignUp === signUp;
    return (
      <form
        onSubmit={(e) => submit(e, signUp)}
        className={`flex flex-col items-center justify-center gap-3 px-8 py-10 text-center transition-opacity duration-700 md:absolute md:top-0 md:h-full md:w-1/2 md:px-12 ${
          signUp ? "md:right-0" : "md:left-0"
        } ${active ? "" : "max-md:hidden md:pointer-events-none md:opacity-0"}`}
      >
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          {signUp ? "Create Account" : "Sign In"}
        </h1>
        <p className="mb-3 text-sm text-muted">
          {signUp
            ? "Start building your digital wardrobe."
            : "Welcome back to your wardrobe."}
        </p>

        {signUp && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className={input}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={input}
        />

        {!signUp && (
          <div className="mt-1 flex w-full items-center justify-between px-2 text-sm text-muted">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 accent-brand"
              />
              Remember me
            </label>
            <button type="button" className="hover:text-brand">
              Forgot password?
            </button>
          </div>
        )}
        {active && error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className={mainButton}>
          {signUp ? "Sign Up" : "Sign In"}
        </button>

        {/* On phones there's no sliding panel, so this switches the form */}
        <p className="mt-4 text-sm text-muted md:hidden">
          {signUp ? "Already have an account?" : "New to StyleAI?"}{" "}
          <button
            type="button"
            onClick={() => switchTo(!signUp)}
            className="font-medium text-brand"
          >
            {signUp ? "Sign in" : "Create one"}
          </button>
        </p>
      </form>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-linear-to-br from-selected via-canvas to-surface px-4 pt-24 pb-40 md:py-24">
      {/* Two soft blurred circles behind the card */}
      <span className="absolute -top-32 -right-24 size-96 rounded-full bg-brand/25 blur-3xl" />
      <span className="absolute -bottom-40 -left-32 size-120 rounded-full bg-brand/15 blur-3xl" />

      <div className="absolute top-6 left-6 sm:top-8 sm:left-10">
        <Brand />
      </div>

      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-surface bg-surface shadow-soft md:h-120">
        {renderForm(false)}
        {renderForm(true)}

        {/* Blue panel: sits on the right, slides left when signing up */}
        <div
          className={`absolute top-0 left-1/2 z-10 h-full w-1/2 bg-linear-135 from-brand to-ink text-white transition-transform duration-700 ease-in-out max-md:hidden ${
            isSignUp ? "-translate-x-full" : ""
          }`}
        >
          <div
            className={`${panelText} ${isSignUp ? "pointer-events-none opacity-0" : ""}`}
          >
            <h2 className="text-3xl font-bold">Hello, Friend!</h2>
            <p className="mt-4 text-white/85">
              Add your clothes and get an outfit for every day.
            </p>
            <button
              type="button"
              onClick={() => switchTo(true)}
              className={ghostButton}
            >
              Sign Up
            </button>
          </div>

          <div
            className={`${panelText} ${isSignUp ? "" : "pointer-events-none opacity-0"}`}
          >
            <h2 className="text-3xl font-bold">Welcome Back!</h2>
            <p className="mt-4 text-white/85">
              Sign in to see today's outfit and your saved looks.
            </p>
            <button
              type="button"
              onClick={() => switchTo(false)}
              className={ghostButton}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {showConsent && <CookieBanner onDone={() => navigate("/")} />}
    </div>
  );
}
