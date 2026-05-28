import request from '@/utils/request.js'

export function getJobList() {
  return request({
    url: '/job/list',
    method: 'get'
  })
}
