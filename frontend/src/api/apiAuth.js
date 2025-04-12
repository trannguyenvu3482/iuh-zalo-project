import instance from '../service/axios'

const BASE_URL = '/auth'
const login = async (phoneNumber, password) => {
  return await instance.post(`${BASE_URL}/signin`, {
    phoneNumber,
    password,
  })
}

const logout = async () => {
  return await instance.get(`${BASE_URL}/logout`)
}

const getAccount = async () => {
  return await instance.get(`${BASE_URL}/account`)
}

// const getNewToken = async () => {
//   return await instance.get(`${BASE_URL}/refresh-token`, {
//     headers: {
//       "Content-Type": "application/json",
//       Authentication: undefined,
//     },
//     withCredentials: true,
//   });
// };

// QR Code Login APIs
const generateQR = async () => {
  return await instance.get(`${BASE_URL}/generate-qr`)
}

const checkQRStatus = async (sessionId) => {
  if (!sessionId) {
    throw new Error('Session ID is required')
  }
  console.log('Checking QR status for session:', sessionId)
  try {
    const response = await instance.get(`${BASE_URL}/qr-status/${sessionId}`)
    console.log('QR status raw response:', response)
    return response
  } catch (error) {
    console.error('QR status check error:', error.response || error)
    throw error
  }
}

export { checkQRStatus, generateQR, getAccount, login, logout }
