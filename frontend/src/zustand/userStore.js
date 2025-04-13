import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      setUser: (user) => {
        set({ user })
      },
      setIsAuthenticated: (isAuthenticated) => {
        set({ isAuthenticated })
      },
      setAccessToken: (accessToken) => {
        set({ accessToken })
      },
      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
