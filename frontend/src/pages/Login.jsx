import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useNavigate } from "react-router-dom";
import HamburgerIcon from "../assets/icons/hamburger.png";
import lock from "../assets/icons/lock.png";
import ZaloPCLogo from "../assets/icons/zalo-pc.png";
import ZaloLogo from "../assets/imgs/logo.png";
import { useUserStore } from "../zustand/userStore";

const Login = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useUserStore();
  const [isUsingQRLogin, setIsUsingQRLogin] = useState(true);
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleLoginWithPassword = () => {
    // TODO: Change this later
    if (value === "+84999999999" && password === "123456") {
      alert("Login success!");
      setIsAuthenticated(true);
      navigate("/");
    }
  };

  const isValidPhone = (phoneNumber) => {
    try {
      return isValidPhoneNumber(phoneNumber);
    } catch (error) {
      return false;
    }
  };

  return (
    <>
      <Helmet>
        <title>Zalo - Đăng nhập</title>
      </Helmet>

      <div className="wrapper bg-[#e9f3ff] w-screen h-screen">
        <div className="flex items-center justify-center pt-16 flex-col">
          <img className="w-[105px] h-auto" src={ZaloLogo} />
          <div className="text-center mt-4">
            <p>Đăng nhập tài khoản Zalo</p>
            <p>để kết nối với ứng dụng Zalo Web</p>
          </div>

          <div className="bg-white max-w-[540px] w-[540px] mt-4 rounded-xl">
            <div className="top flex items-center w-full rounded-tl-xl rounded-tr-xl">
              <div className="flex flex-1 justify-center items-center min-h-14 px-6 border-b border-[#f0f0f0] relative">
                <h1 className="font-semibold">
                  Đăng nhập {isUsingQRLogin ? "qua mã QR" : "với mật khẩu"}
                </h1>
                <div className="absolute right-4">
                  {isUsingQRLogin && (
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      className="bg-white rounded-md px-3.5 py-2.5 flex items-center justify-center border"
                    >
                      <img src={HamburgerIcon} alt="hamburger" />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="z-10 menu absolute right-4 top-[46px] flex flex-col items-center justify-center bg-white shadow-xl w-[200px] rounded-md py-2 px-1 border border-[#f0f0f0]">
                    <button
                      onClick={() => {
                        setIsUsingQRLogin(false);
                        setValue("");
                        setIsOpen(false);
                      }}
                      className="text-sm cursor-pointer"
                    >
                      Đăng nhập với mật khẩu
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="body flex items-center w-full">
              <div className="flex flex-1 justify-center items-center min-h-14 px-6 relative">
                {isUsingQRLogin ? (
                  <div className="border border-[#f0f0f0] w-[236px] min-h-[300px] mt-[42px] rounded-xl flex flex-col items-center">
                    <img
                      src="data:image/png;base64,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"
                      alt=""
                    />
                    <p className="mt-1 text-blue-600">Chỉ dùng để đăng nhập</p>
                    <p className="mt-1">Zalo trên máy tính</p>
                  </div>
                ) : (
                  <form>
                    <PhoneInput
                      className="border-b p-2 mt-[42px]"
                      numberInputProps={{
                        style: {
                          border: "none",
                          outline: "none",
                          backgroundColor: "transparent",
                          width: "100%",
                        },
                      }}
                      international
                      placeholder="Số điện thoại"
                      countryCallingCodeEditable={false}
                      defaultCountry="VN"
                      value={value}
                      onChange={setValue}
                    />
                    <div className="flex w-full gap-4 items-center mt-2 border-b p-2">
                      <img src={lock} alt="" />
                      <input
                        type="password"
                        className="outline-none background-transparent"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <button
                      disabled={!isValidPhone(value)}
                      onClick={handleLoginWithPassword}
                      className="flex flex-1 bg-[#0191f4] mt-8 w-full px-1 rounded-md text-white text-sm items-center justify-center py-3 hover:bg-[#007bff] disabled:opacity-50"
                    >
                      Đăng nhập với mật khẩu
                    </button>

                    <button
                      onClick={() => alert("Chức năng chưa phát triển...")}
                      className="flex flex-1 w-full px-1 rounded-md text-sm items-center justify-center py-3 hover:opacity-70"
                    >
                      Quên mật khẩu
                    </button>
                    <button
                      type="submit"
                      onClick={() => {
                        setIsUsingQRLogin(true);
                        setIsOpen(false);
                        setValue("");
                      }}
                      className="flex text-[#0190f3] flex-1 w-full px-1 rounded-md text-sm font-semibold items-center justify-center py-3 hover:opacity-70 mt-4"
                    >
                      Đăng nhập qua mã QR
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="bottom flex items-center border h-[100px] mt-8 mx-4 mb-2 rounded-xl border-[#c0c0c0] px-2 flex-row ">
              <img src={ZaloPCLogo} alt="" />
              <div className="flex justify-between w-full gap-4 items-center ml-3">
                <div className="flex flex-col w-[300px]">
                  <p className="text-sm font-bold">
                    Nâng cao hiệu quả công việc với Zalo PC
                  </p>
                  <p className="text-sm">
                    Gửi file lớn lên đến 1 GB, chụp màn hình, gọi video và nhiều
                    tiện ích hơn nữa
                  </p>
                </div>
                <button className="flex flex-1 bg-[#0167ff] px-1 rounded-md text-white font-semibold items-center justify-center py-2">
                  Tải ngay
                </button>
              </div>
            </div>
          </div>

          <div className="flex-row justify-between items-center mt-24 mx-4 mb-2 rounded-xl border-[#c0c0c0] px-2">
            <a href="#" className="text-xs text-blue-500 mr-2 font-bold">
              Tiếng Việt
            </a>
            <a href="#" className="text-xs text-blue-500">
              English
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
