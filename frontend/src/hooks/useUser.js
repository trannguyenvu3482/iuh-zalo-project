import { useEffect, useState } from 'react'
import { useUserStore } from '../zustand/userStore'

export const useUser = () => {
  const user = useUserStore((state) => state.user)
  const [currentUser, setCurrentUser] = useState(user)

  useEffect(() => {
    const unsub = useUserStore.subscribe(
      (state) => state.user,
      (newUser) => {
        setCurrentUser(newUser)
      },
    )

    return () => unsub()
  }, [])

  return currentUser
}
