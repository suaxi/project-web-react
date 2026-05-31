import request from '@/utils/request.js'

export function getDeptTree(data = {}) {
  return request({
    url: '/dept/dept-tree',
    method: 'post',
    data
  })
}

export function getDeptChildList(pid = 0) {
  return request({
    url: `/dept/child-list?pid=${pid}`,
    method: 'get'
  })
}
