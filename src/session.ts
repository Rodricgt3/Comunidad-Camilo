import { createContext, useContext } from "react";
import type { Profile } from "./types";
export const Session = createContext<{
  profile: Profile | null;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
}>({ profile: null, refresh: async () => {}, notify: () => {} });
export const useSession = () => useContext(Session);
