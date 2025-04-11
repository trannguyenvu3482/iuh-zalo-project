import instance from '../service/axios'

const BASE_URL = '/users'

const searchUserByPhoneNumber = (phoneNumber) => {
  return instance.get(`${BASE_URL}/search?phoneNumber=${phoneNumber}`)
}

const getUserInfo = () => {
  return instance.get(`${BASE_URL}/me`)
}

const updateUserProfile = (userData) => {
  return instance.put(`${BASE_URL}/profile`, userData)
}

const updateUserAvatar = (avatar) => {
  return instance.put(`${BASE_URL}/avatar`, avatar, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

const updateUserBanner = (banner) => {
  return instance.put(`${BASE_URL}/banner`, banner, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export {
  getUserInfo,
  searchUserByPhoneNumber,
  updateUserAvatar,
  updateUserBanner,
  updateUserProfile,
}
