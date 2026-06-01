import request from '@/utils/request.js'

export function add(data) {
  return request({
    url: '/menu',
    method: 'post',
    data
  })
}

export function update(data) {
  return request({
    url: '/menu',
    method: 'put',
    data
  })
}

export function del(ids) {
  return request({
    url: '/menu',
    method: 'delete',
    data: ids
  })
}

export function getUserRouter() {
  return request({
    url: '/menu/user-routers',
    method: 'get'
  })
}

export function getMenu(id) {
  return request({
    url: `/menu/id/${id}`,
    method: 'get'
  })
}

export function getMenuList(id = 0) {
  return request({
    url: `/menu/menu-list?id=${id}`,
    method: 'get'
  })
}

export function child(id = 0) {
  return getMenuList(id)
}

export function getMenuChildList(pid = 0) {
  return request({
    url: `/menu/child-list?pid=${pid}`,
    method: 'get'
  })
}

export function childList(pid = 0) {
  return getMenuChildList(pid)
}

export function tree(data = {}) {
  return request({
    url: '/menu/menu-tree',
    method: 'post',
    data
  })
}
