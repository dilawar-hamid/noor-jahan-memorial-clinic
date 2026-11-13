import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { AUTH_KEY, DEMO_USERS } from "../config";

function readStoredUser() {
  try {
    const saved = sessionStorage.getItem(AUTH_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Re-validate against known users so edited storage can't invent a role.
    const known = DEMO_USERS.find((u) => u.username === parsed?.username);
    return known
      ? { username: known.username, role: known.role, name: known.name }
      : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  function login(username, password) {
    const found = DEMO_USERS.find(
      (u) =>
        u.username === username.trim().toLowerCase() &&
        u.password === password,
    );
    if (!found) return false;

    const session = { username: found.username, role: found.role, name: found.name };
    setUser(session);
    try {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } catch {
      /* ignore storage failure */
    }
    return session;
  }

  function logout() {
    setUser(null);
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
