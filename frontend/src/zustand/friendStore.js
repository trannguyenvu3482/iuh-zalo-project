import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const useFriendStore = create(
  persist(
    (set) => ({
      friendRequestsReceived: [],
      friendRequestsSent: [],
      setFriendRequestsReceived: (list) =>
        set({ friendRequestsReceived: list }),
      setFriendRequestsSent: (list) => set({ friendRequestsSent: list }),
    }),
    {
      name: 'friend-store',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
