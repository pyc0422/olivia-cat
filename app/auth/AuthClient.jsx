"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { allowedMembers, allowedNames } from "../../lib/allowed-members";
import { loadStoredCurrentUser, saveStoredCurrentUser } from "../../lib/current-user-storage";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

const defaultForm = {
  name: allowedNames[0],
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

    if (!allowedNames.includes(form.name)) {
      setError("Pick a name from the club list.");
      setBusy(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          phone: form.phone || null,
          member_group: allowedMembers.find((member) => member.name === form.name)?.group || "members",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (data.user) {
      saveStoredCurrentUser(data.user);
    } else {
      saveStoredCurrentUser({
        id: form.email,
        email: form.email,
        user_metadata: {
          name: form.name,
          phone: form.phone || null,
          member_group: allowedMembers.find((member) => member.name === form.name)?.group || "members",
        },
      });
    }

    setMessage("Check your email to verify the account, then sign in.");
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
          Club accounts are limited to the names on the member list. Email is used for verification and password recovery.
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
              <select value={form.name} onChange={(event) => updateField("name", event.target.value)}>
                {allowedMembers.map((member) => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
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
