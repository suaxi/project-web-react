import request from '@/utils/request.js'
import qs from 'qs'

export function add(data) {
  return request({
    url: '/dict',
    method: 'post',
    data
  })
}

export function update(data) {
  return request({
    url: '/dict',
    method: 'put',
    data
  })
}

export function del(ids) {
  return request({
    url: '/dict',
    method: 'delete',
    data: ids
  })
}

export function getDict(id) {
  return request({
    url: `/dict/id/${id}`,
    method: 'get'
  })
}

export function page(params = {}) {
  const queryString = qs.stringify(params, { indices: false })

  return request({
    url: queryString ? `/dict/page?${queryString}` : '/dict/page',
    method: 'get'
  })
}

export function detailList(data) {
  return request({
    url: '/dict/detail-list',
    method: 'post',
    data
  })
}
