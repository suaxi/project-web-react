import axios from 'axios'
import settings from '@/settings.js'
import { getToken, removeToken } from '@/utils/auth.js'

const request = axios.create({
  baseURL: settings.baseApi,
  timeout: settings.timeout
})

request.interceptors.request.use(
  (config) => {
    const token = getToken()

    if (token) {
      config.headers.Authorization = token
    }

    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status || error.status
    const message = error.response?.data?.message || error.message || '请求失败'

    if (status === 401) {
      removeToken()
    }

    return Promise.reject({ ...error, status, message })
  }
)

export default request
