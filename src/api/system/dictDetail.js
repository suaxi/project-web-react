import request from '@/utils/request.js'
import qs from 'qs'

export function add(data) {
  return request({
    url: '/dictDetail',
    method: 'post',
    data
  })
}

export function update(data) {
  return request({
    url: '/dictDetail',
    method: 'put',
    data
  })
}

export function del(ids) {
  return request({
    url: '/dictDetail',
    method: 'delete',
    data: ids
  })
}

export function getDictDetail(id) {
  return request({
    url: `/dictDetail/id/${id}`,
    method: 'get'
  })
}

export function page(params = {}) {
  const queryString = qs.stringify(params, { indices: false })

  return request({
    url: queryString ? `/dictDetail/page?${queryString}` : '/dictDetail/page',
    method: 'get'
  })
}
