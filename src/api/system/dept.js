import request from '@/utils/request.js'

export function getDeptChildList(pid = 0) {
  return request({
    url: `/dept/child-list?pid=${pid}`,
    method: 'get'
  })
}
