import instance from "../service/axios";

const BASE_URL = "/auth";
const login = async (phoneNumber, password) => {
  return await instance.post(`${BASE_URL}/signin`, {
    username: phoneNumber,
    password,
  });
};

const logout = async () => {
  return await instance.get(`${BASE_URL}/logout`);
};

const getAccount = async () => {
  return await instance.get(`${BASE_URL}/account`);
};

// const getNewToken = async () => {
//   return await instance.get(`${BASE_URL}/refresh-token`, {
//     headers: {
//       "Content-Type": "application/json",
//       Authentication: undefined,
//     },
//     withCredentials: true,
//   });
// };

export { getAccount, login, logout };
