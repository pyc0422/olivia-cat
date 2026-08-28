const CURRENT_USER_KEY = "catclub-current-user";

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function loadStoredCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  return safeParse(window.localStorage.getItem(CURRENT_USER_KEY));
}

export function saveStoredCurrentUser(user) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    return;
  }

  const snapshot = {
    id: user.id || null,
    name: user.user_metadata?.name || user.name || user.email || "Unknown",
    email: user.email || "",
    phone: user.user_metadata?.phone || user.phone || null,
    member_group: user.user_metadata?.member_group || "members",
    level: user.user_metadata?.level || "Noob",
    avatar_color: user.user_metadata?.avatar_color || "orange",
    avatar_eyes: user.user_metadata?.avatar_eyes || "round",
    avatar_mouth: user.user_metadata?.avatar_mouth || "smile",
    avatar_clothes: user.user_metadata?.avatar_clothes || "hoodie",
    last_login_at: user.last_sign_in_at || user.created_at || new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage failures.
  }
}

export function clearStoredCurrentUser() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  } catch {
    // Ignore storage failures.
  }
}
