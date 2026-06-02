import request from '@/utils/request.js'
import qs from 'qs'

export function add(data) {
  return request({
    url: '/dept',
    method: 'post',
    data
  })
}

export function update(data) {
  return request({
    url: '/dept',
    method: 'put',
    data
  })
}

export function del(ids) {
  return request({
    url: '/dept',
    method: 'delete',
    data: ids
  })
}

export function childList(pid = 0) {
  return request({
    url: `/dept/child-list?pid=${pid}`,
    method: 'get'
  })
}

export function superiorList(ids = []) {
  return request({
    url: '/dept/superior-list',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

export function getDept(id) {
  return request({
    url: `/dept/id/${id}`,
    method: 'get'
  })
}

export function page(params = {}) {
  const queryString = qs.stringify(params, { indices: false })

  return request({
    url: queryString ? `/dept/page?${queryString}` : '/dept/page',
    method: 'get'
  })
}

export function tree(data = {}) {
  return request({
    url: '/dept/dept-tree',
    method: 'post',
    data
  })
}

export function getDeptTree(data = {}) {
  return tree(data)
}

export function getDeptChildList(pid = 0) {
  return childList(pid)
}
