import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePhoto?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  sendOtp: (name: string, email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      api<{ user: User }>("/auth/me", { token }),
      api<{ profile: { profilePhoto?: string | null } | null }>("/profile", { token }),
    ])
      .then(([userData, profileData]) => {
        setUser({
          ...userData.user,
          profilePhoto: profileData.profile?.profilePhoto ?? null,
        });
      })
      .catch(() => {
        sessionStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const refreshProfile = async () => {
    if (!token) return;
    const profileData = await api<{ profile: { profilePhoto?: string | null } | null }>("/profile", { token });
    setUser((prev) => prev ? { ...prev, profilePhoto: profileData.profile?.profilePhoto ?? null } : prev);
  };

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    sessionStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const sendOtp = async (name: string, email: string, password: string): Promise<void> => {
    await api<{ message: string }>("/auth/send-otp", {
      method: "POST",
      body: { name, email, password },
    });
  };

  const verifyOtp = async (email: string, otp: string): Promise<User> => {
    const data = await api<{ token: string; user: User }>("/auth/verify-otp", {
      method: "POST",
      body: { email, otp },
    });
    sessionStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name: string, email: string, password: string): Promise<User> => {
    const data = await api<{ token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: { name, email, password },
    });
    sessionStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, sendOtp, verifyOtp, signup, logout, refreshProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
