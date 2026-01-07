import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

function normalizeAuth(data) {
  if (!data?.token) return null;

  // backend يرجّع user fields في root
  const user = {
    _id: data._id,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    facilityId: data.facilityId ?? null,
  };

  return { token: data.token, user };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem("auth");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = (data) => {
    const normalized = normalizeAuth(data);
    if (!normalized) return;

    setAuth(normalized);
    localStorage.setItem("auth", JSON.stringify(normalized));
    localStorage.setItem("token", normalized.token);
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
  };

  const value = useMemo(
    () => ({
      auth,
      user: auth?.user || null,
      token: auth?.token || null,
      isLoggedIn: !!auth?.token,
      login,
      logout,
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
