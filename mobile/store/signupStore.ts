import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SignupData {
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  verificationId?: string;
  otp?: string;
  fullName?: string;
  avatar?: string;
  hasAvatar?: boolean;
  birthdate?: Date | null;
  gender?: "male" | "female" | "other" | null;
  resetToken?: string;
}

interface SignupState {
  data: SignupData;
  isComplete: boolean;

  // Methods to update state
  setPhone: (phoneNumber: string) => void;
  setPassword: (password: string) => void;
  setVerificationId: (verificationId: string) => void;
  setOtp: (otp: string) => void;
  setFullName: (fullName: string) => void;
  setAvatar: (avatar: string) => void;
  setHasAvatar: (hasAvatar: boolean) => void;
  setBirthdate: (birthdate: Date | null) => void;
  setGender: (gender: "male" | "female" | "other" | null) => void;

  // Get full data for API call
  getSignupData: () => Omit<SignupData, "step" | "confirmPassword">;
}

const initialState: SignupData = {
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  verificationId: "",
  otp: "",
  fullName: "",
  avatar: "",
  birthdate: null,
  gender: null,
  hasAvatar: false,
};

export const useSignupStore = create<SignupState>()(
  persist(
    (set, get) => ({
      data: initialState,
      isComplete: false,

      setPhone: (phoneNumber) =>
        set((state) => ({
          data: {
            ...state.data,
            phoneNumber,
          },
        })),

      setPassword: (password) =>
        set((state) => ({
          data: {
            ...state.data,
            password,
          },
        })),

      setVerificationId: (verificationId) =>
        set((state) => ({
          data: {
            ...state.data,
            verificationId,
          },
        })),

      setOtp: (otp) =>
        set((state) => ({
          data: {
            ...state.data,
            otp,
          },
        })),

      setFullName: (fullName) =>
        set((state) => ({
          data: {
            ...state.data,
            fullName,
          },
        })),

      setAvatar: (avatar) =>
        set((state) => ({
          data: {
            ...state.data,
            avatar,
          },
        })),

      setHasAvatar: (hasAvatar) =>
        set((state) => ({
          data: {
            ...state.data,
            hasAvatar,
          },
        })),

      setBirthdate: (birthdate) =>
        set((state) => ({
          data: {
            ...state.data,
            birthdate,
          },
        })),

      setGender: (gender) =>
        set((state) => ({
          data: {
            ...state.data,
            gender,
          },
        })),

      getSignupData: () => {
        const { confirmPassword, ...signupData } = get().data;
        return signupData;
      },
    }),
    {
      name: "signup-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
