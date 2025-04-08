import instance from "../service/axios";

const BASE_URL = "/users";

const searchUserByPhoneNumber = (phoneNumber) => {
  return instance.get(`${BASE_URL}/search?phoneNumber=${phoneNumber}`);
};

const getUserInfo = () => {
  return instance.get(`${BASE_URL}/me`);
};

const updateUserProfile = (userData) => {
  return instance.put(`${BASE_URL}/profile`, userData);
};

export { getUserInfo, searchUserByPhoneNumber, updateUserProfile };
