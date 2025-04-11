import React, { useState } from "react";
import PhoneInput from "react-native-phone-number-input";

const PhoneInputField = ({
  phoneInputRef,
  value,
  setValue,
}: {
  phoneInputRef: React.RefObject<PhoneInput>;
  value: string;
  setValue: (value: string) => void;
}) => {
  const [formattedValue, setFormattedValue] = useState("");

  return (
    <PhoneInput
      ref={phoneInputRef}
      defaultValue={value}
      defaultCode="VN"
      layout="second"
      onChangeText={(text) => {
        setValue(text);
      }}
      onChangeFormattedText={(text) => {
        setFormattedValue(text);
      }}
      autoFocus
      containerStyle={{
        width: "100%",
        borderWidth: 2,
        borderColor: "red",
        borderRadius: 10,
        backgroundColor: "#f5f5f5",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
      countryPickerButtonStyle={{
        backgroundColor: "#f5f5f5",
        borderTopLeftRadius: 50,
        borderBottomLeftRadius: 50,
        height: "100%",
      }}
      textContainerStyle={{
        backgroundColor: "#f5f5f5",
        borderRadius: 50,
        paddingLeft: 0,
        height: 50,
      }}
      placeholder="Nhập số điện thoại"
      filterProps={{
        autoFocus: true,
        placeholder: "Nhập tên quốc gia",
      }}
      textInputStyle={{
        height: 50,
      }}
    />
  );
};

export default PhoneInputField;
