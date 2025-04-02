import { forwardRef } from "react";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

type ButtonProps = {
  title: string;
  type?: "primary" | "secondary";
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
  ({ title, type = "primary", ...touchableProps }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        {...touchableProps}
        className={`${styles.button} ${touchableProps.className} ${
          type === "primary" ? styles.primary : styles.secondary
        }`}
      >
        <Text
          className={`${styles.buttonText} ${
            type === "primary" ? styles.primaryText : styles.secondaryText
          }`}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  },
);

const styles = {
  button: "items-center rounded-[28px] p-4",
  buttonText: "text-lg font-bold text-center",
  primary: "bg-blue-600",
  secondary: "bg-gray-300",
  primaryText: "text-white",
  secondaryText: "text-black",
};
