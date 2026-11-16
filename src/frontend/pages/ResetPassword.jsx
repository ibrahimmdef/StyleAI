import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Brand } from "../components/Sidebar";
import { API_URL } from "../api";

const input =
  "w-full rounded-full border border-line bg-canvas/60 px-5 py-3 text-sm outline-none transition focus:border-brand focus:bg-surface";
const mainButton =
  "rounded-full bg-brand px-12 py-3 text-xs font-bold tracking-wider text-white uppercase transition hover:bg-brand-hover active:scale-95 disabled:opacity-60";

// Forgot password. Without a token: ask for the email and send a link.
// With the token from that email: pick a new password.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Sends to /auth/forgot or /auth/reset, returns true when it worked
  async function send(path, body) {
    setError("");
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
      return true;
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      return false;
    } finally {
      setIsSending(false);
    }
  }

  async function askForLink(e) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    await send("forgot", { email });
  }

  async function saveNewPassword(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }
    if (password !== repeat) {
      setError("The passwords don't match.");
      return;
    }
    // The backend logs you in with the new password
    if (await send("reset", { token, password })) navigate("/");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-linear-to-br from-selected via-canvas to-surface px-4 py-24">
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10">
        <Brand />
      </div>

      <form
        onSubmit={token ? saveNewPassword : askForLink}
        className="flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border border-surface bg-surface p-8 text-center shadow-soft"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-selected text-brand">
          <KeyRound size={22} />
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {token ? "Pick a new password" : "Forgot your password?"}
        </h1>
        <p className="mb-2 text-sm text-muted">
          {token
            ? "At least 8 characters. You'll be logged in right after."
            : "Enter your email and we'll send you a link to reset it."}
        </p>

        {token ? (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className={input}
            />
            <input
              type="password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              placeholder="New password again"
              className={input}
            />
          </>
        ) : (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={input}
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && !token && <p className="text-sm text-brand">{message}</p>}

        <button
          type="submit"
          disabled={isSending}
          className={`mt-2 ${mainButton}`}
        >
          {token ? "Save password" : "Send link"}
        </button>
        <Link to="/login" className="mt-2 text-sm text-muted hover:text-brand">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
