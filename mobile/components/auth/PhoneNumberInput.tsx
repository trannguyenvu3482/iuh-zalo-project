import React, { useState } from "react";
import PhoneInput from "react-native-phone-number-input";

const PhoneInputField = ({
  phoneInputRef,
}: {
  phoneInputRef: React.RefObject<PhoneInput>;
}) => {
  const [value, setValue] = useState("");
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
        borderRadius: 50,
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
        height: "100%",
        paddingLeft: 0,
      }}
      placeholder="Nhập số điện thoại"
      filterProps={{
        autoFocus: true,
        placeholder: "Nhập tên quốc gia",
      }}
    />
  );
};

export default PhoneInputField;
