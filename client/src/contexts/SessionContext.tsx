/* Gilded Night — session context: live engine auth + credits, no fakes. */
import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { api, GmUser } from "@/lib/api";

interface SessionState {
  user: GmUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (u: GmUser | null) => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<SessionState>({
  user: null,
  loading: true,
  refresh: async () => {},
  setUser: () => {},
  logout: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GmUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const j = await api.me();
      setUser(j.authenticated && j.user ? j.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* engine unreachable — clear local view anyway */
    }
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ user, loading, refresh, setUser, logout }}>{children}</Ctx.Provider>
  );
}

export const useSession = () => useContext(Ctx);
