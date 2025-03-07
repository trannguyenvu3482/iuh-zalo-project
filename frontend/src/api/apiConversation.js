import instance from "../service/axios";

const BASE_URL = "/conversations";

const searchConversationsByName = (name) => {
  return instance.get(`${BASE_URL}/search?name=${name}`);
};

export { searchConversationsByName };
