import request from '@/utils/request.js'

export function getUserRouter() {
  return request({
    url: '/menu/user-routers',
    method: 'get'
  })
}
