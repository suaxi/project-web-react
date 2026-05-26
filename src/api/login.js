import request from '@/utils/request.js'

export function login(username, password, code, uuid) {
  return request({
    url: 'auth/login',
    method: 'post',
    data: {
      username,
      password,
      code,
      uuid
    }
  })
}

export function getUserInfo() {
  return request({
    url: 'user/user-info',
    method: 'get'
  })
}

export function captcha() {
  return request({
    url: 'auth/captcha',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: 'auth/logout',
    method: 'get'
  })
}
