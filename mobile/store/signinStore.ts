import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SigninData {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  phoneNumber?: string;
  fullName?: string;
  avatar?: string;
}

interface SigninState {
  data: SigninData;
  isSignedIn: boolean;

  setTokens: (accessToken: string, refreshToken?: string) => void;
  setUserInfo: (info: Partial<SigninData>) => void;
  signOut: () => void;
}

const initialState: SigninData = {
  accessToken: "",
  refreshToken: "",
  userId: "",
  phoneNumber: "",
  fullName: "",
  avatar: "",
};

export const useSigninStore = create<SigninState>()(
  persist(
    (set) => ({
      data: initialState,
      isSignedIn: false,

      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          data: {
            ...state.data,
            accessToken,
            refreshToken: refreshToken ?? state.data.refreshToken,
          },
          isSignedIn: !!accessToken,
        })),

      setUserInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            ...info,
          },
        })),

      signOut: () =>
        set(() => ({
          data: initialState,
          isSignedIn: false,
        })),
    }),
    {
      name: "signin-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);