import request from '@/utils/request.js'

export function getUserRouter() {
  return request({
    url: '/menu/user-routers',
    method: 'get'
  })
}

export function getMenuList(id = 0) {
  return request({
    url: `/menu/menu-list?id=${id}`,
    method: 'get'
  })
}

export function getMenuChildList(pid = 0) {
  return request({
    url: `/menu/child-list?pid=${pid}`,
    method: 'get'
  })
}
