import instance from "../service/axios";

const BASE_URL = "/users";

const searchUserByPhoneNumber = (phoneNumber) => {
  return instance.get(`${BASE_URL}/search?phoneNumber=${phoneNumber}`);
};

export { searchUserByPhoneNumber };
