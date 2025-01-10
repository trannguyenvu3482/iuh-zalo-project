import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => {
        set({ user });
      },
      setIsAuthenticated: (isAuthenticated) => {
        set({ isAuthenticated });
      },
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
