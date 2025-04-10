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
  avatarUri?: string;
  birthday?: Date | null;
  gender?: "male" | "female" | "other" | null;
  step:
    | "phone"
    | "captcha"
    | "otp"
    | "name"
    | "avatar"
    | "birthday-gender"
    | "complete";
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
  setAvatar: (avatarUri: string) => void;
  setBirthday: (birthday: Date | null) => void;
  setGender: (gender: "male" | "female" | "other" | null) => void;
  setStep: (step: SignupData["step"]) => void;

  // Complete or reset signup
  completeSignup: () => void;
  resetSignup: () => void;

  // Get full data for API call
  getSignupData: () => Omit<SignupData, "step" | "confirmPassword">;
}

const initialState: SignupData = {
  step: "phone",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  verificationId: "",
  otp: "",
  fullName: "",
  avatarUri: "",
  birthday: null,
  gender: null,
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

      setAvatar: (avatarUri) =>
        set((state) => ({
          data: {
            ...state.data,
            avatarUri,
          },
        })),

      setBirthday: (birthday) =>
        set((state) => ({
          data: {
            ...state.data,
            birthday,
          },
        })),

      setGender: (gender) =>
        set((state) => ({
          data: {
            ...state.data,
            gender,
          },
        })),

      setStep: (step) =>
        set((state) => ({
          data: {
            ...state.data,
            step,
          },
        })),

      completeSignup: () =>
        set((state) => ({
          data: {
            ...state.data,
            step: "complete",
          },
          isComplete: true,
        })),

      resetSignup: () =>
        set({
          data: initialState,
          isComplete: false,
        }),

      getSignupData: () => {
        const { step, confirmPassword, ...signupData } = get().data;
        return signupData;
      },
    }),
    {
      name: "signup-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
