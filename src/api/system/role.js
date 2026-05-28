import request from '@/utils/request.js'

export function getRoleList(data = {}) {
  return request({
    url: '/role/list',
    method: 'post',
    data
  })
}
