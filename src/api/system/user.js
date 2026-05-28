import request from '@/utils/request.js'
import qs from 'qs'

export function addUser(data) {
  return request({
    url: '/user',
    method: 'post',
    data
  })
}

export function updateUser(data) {
  return request({
    url: '/user',
    method: 'put',
    data
  })
}

export function deleteUser(ids) {
  return request({
    url: '/user',
    method: 'delete',
    data: ids
  })
}

export function getUser(id) {
  return request({
    url: `/user/id/${id}`,
    method: 'get'
  })
}

export function getUserList(data) {
  return request({
    url: '/user/list',
    method: 'post',
    data
  })
}

export function getUserPage(params) {
  const queryString = qs.stringify(params, { indices: false })

  return request({
    url: queryString ? `/user/page?${queryString}` : '/user/page',
    method: 'get'
  })
}
