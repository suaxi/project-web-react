import request from '@/utils/request.js'
import qs from 'qs'

export function addRole(data) {
  return request({
    url: '/role',
    method: 'post',
    data
  })
}

export function updateRole(data) {
  return request({
    url: '/role',
    method: 'put',
    data
  })
}

export function deleteRole(ids) {
  return request({
    url: '/role',
    method: 'delete',
    data: ids
  })
}

export function updateRoleMenu(data) {
  return request({
    url: '/role/update-role-menu',
    method: 'put',
    data
  })
}

export function getRole(id) {
  return request({
    url: `/role/id/${id}`,
    method: 'get'
  })
}

export function getRoleList(data = {}) {
  return request({
    url: '/role/list',
    method: 'post',
    data
  })
}

export function getRolePage(params = {}) {
  const queryString = qs.stringify(params, { indices: false })

  return request({
    url: queryString ? `/role/page?${queryString}` : '/role/page',
    method: 'get'
  })
}
