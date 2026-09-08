"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllowedMember } from "../../lib/allowed-members";
import { loadStoredCurrentUser, saveStoredCurrentUser } from "../../lib/current-user-storage";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function getHomePath() {
  return "/";
}

export default function AuthClient({ initialMode = "login" }) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...defaultForm, mode: initialMode }));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    let active = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      if (data.session) {
        const { data: userData } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        if (userData.user) {
          saveStoredCurrentUser(userData.user);
        }
        router.replace(getHomePath());
        router.refresh();
        return;
      }

      if (loadStoredCurrentUser()) {
        router.replace(getHomePath());
        router.refresh();
        return;
      }

      setCheckingSession(false);
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  if (!supabase) {
    return (
      <main className="auth-page">
        <section className="auth-card cat-box">
          <h1 className="auth-title">Cat Club login</h1>
          <p className="auth-copy">Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable login.</p>
        </section>
      </main>
      );
  }

  if (checkingSession) {
    return (
      <main className="auth-page">
        <section className="auth-card cat-box">
          <h1 className="auth-title">Cat Club login</h1>
          <p className="auth-copy">Checking your session...</p>
        </section>
      </main>
    );
  }

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setMessage("");
  };

  const signIn = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (data.user) {
      saveStoredCurrentUser(data.user);
    }

    router.push(getHomePath());
    router.refresh();
  };

  const signUp = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const name = form.name.trim();
    if (!name) {
      setError("Enter a name.");
      setBusy(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }

    const member = getAllowedMember(name);

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name,
          phone: form.phone || null,
          member_group: member?.group || "new_members",
          level: member?.level || "Noob",
          avatar_accessory: "none",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      saveStoredCurrentUser(sessionData.session.user);
      router.push(getHomePath());
      router.refresh();
    }

    setMessage(
      sessionData.session
        ? "Account created. Welcome to Cat Club!"
        : "Account created, but Supabase email confirmation is still enabled. Disable it in Supabase Authentication settings to sign in immediately."
    );
    setBusy(false);
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const { error: authError } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });

    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    setMessage("We sent a password reset email.");
    setBusy(false);
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({ password: form.password });
    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (data.user) {
      saveStoredCurrentUser(data.user);
    }

    setMessage("Password updated. You can sign in now.");
    setForm((current) => ({ ...current, mode: "login", password: "", confirmPassword: "" }));
    setBusy(false);
  };

  const title =
    form.mode === "signup" ? "Create account" : form.mode === "reset" ? "Reset password" : "Sign in";

  const onSubmit =
    form.mode === "signup" ? signUp : form.mode === "reset" ? updatePassword : signIn;

  return (
    <main className="auth-page">
      <section className="auth-card cat-box">
        <p className="auth-kicker">Cat Club</p>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-copy">
          Official club names keep their club settings. Anyone else can join as a new member. Email is only used for sign-in and password recovery.
        </p>

        <div className="auth-switcher">
          <button type="button" className={form.mode === "login" ? "is-active" : ""} onClick={() => updateField("mode", "login")}>
            Sign in
          </button>
          <button type="button" className={form.mode === "signup" ? "is-active" : ""} onClick={() => updateField("mode", "signup")}>
            Sign up
          </button>
          <button type="button" className={form.mode === "reset" ? "is-active" : ""} onClick={() => updateField("mode", "reset")}>
            Reset
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {form.mode === "signup" ? (
            <label className="auth-field">
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          {form.mode === "signup" ? (
            <label className="auth-field">
              <span>Phone number</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="Optional"
              />
            </label>
          ) : null}

          {form.mode !== "reset" ? (
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Your password"
                required
              />
            </label>
          ) : null}

          {form.mode === "signup" || form.mode === "reset" ? (
            <label className="auth-field">
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                placeholder="Repeat password"
                required={form.mode === "signup" || form.mode === "reset"}
              />
            </label>
          ) : null}

          <div className="auth-actions">
            <button type="submit" disabled={busy}>
              {busy ? "Working..." : title}
            </button>
            <a href="/">Back to club</a>
          </div>
        </form>

        {error ? <p className="auth-error">{error}</p> : null}
        {message ? <p className="auth-message">{message}</p> : null}
      </section>
    </main>
  );
}
