import request from '@/utils/request.js'
import qs from 'qs'

export function add(data) {
  return request({
    url: '/user',
    method: 'post',
    data
  })
}

export function update(data) {
  return request({
    url: '/user',
    method: 'put',
    data
  })
}

export function del(ids) {
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

export function list(data) {
  return request({
    url: '/user/list',
    method: 'post',
    data
  })
}

export function page(params = {}) {
  const queryString = qs.stringify(params, { indices: false })

  return request({
    url: queryString ? `/user/page?${queryString}` : '/user/page',
    method: 'get'
  })
}
