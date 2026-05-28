import axios from 'axios'
import settings from '@/settings.js'
import { getToken, removeToken } from '@/utils/auth.js'

const errorMessageMap = {
  401: '当前登录状态已过期，请重新登录！',
  403: '访问权限不足，请联系管理员！',
  500: '服务出现异常，请联系管理员！'
}

let lastError = {
  message: '',
  time: 0
}
let redirectingToLogin = false

const request = axios.create({
  baseURL: settings.baseApi,
  timeout: settings.timeout
})

const emitErrorMessage = (message, config) => {
  if (config?.showError === false || typeof window === 'undefined' || !message) {
    return
  }

  const now = Date.now()
  if (lastError.message === message && now - lastError.time < 1500) {
    return
  }

  lastError = { message, time: now }
  window.dispatchEvent(new CustomEvent('request-error', { detail: { message } }))
}

const redirectToLogin = () => {
  if (typeof window === 'undefined' || redirectingToLogin || window.location.pathname === '/login') {
    return
  }

  redirectingToLogin = true
  const fullPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  window.location.replace(`/login?redirect=${encodeURIComponent(fullPath)}`)
}

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
    const config = error.config || {}
    const status = error.response?.status || error.status
    const backendMessage = error.response?.data?.message
    const message = backendMessage || errorMessageMap[status] || error.message || '请求失败'

    if (status === 401) {
      removeToken()
      emitErrorMessage(errorMessageMap[401], config)
      redirectToLogin()
    } else {
      emitErrorMessage(message, config)
    }

    return Promise.reject(Object.assign(error, { status, message }))
  }
)

export default request
