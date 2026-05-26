import Cookies from 'js-cookie'
import settings from '@/settings.js'

export function getToken() {
  return Cookies.get(settings.tokenKey)
}

export function setToken(token, rememberMe = false) {
  const options = rememberMe ? { expires: settings.tokenExpires } : undefined
  return Cookies.set(settings.tokenKey, token, options)
}

export function removeToken() {
  return Cookies.remove(settings.tokenKey)
}
