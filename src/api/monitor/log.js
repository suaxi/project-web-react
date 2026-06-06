import request from '@/utils/request.js'
import qs from 'qs'

export function page(params = {}) {
  const queryString = qs.stringify(params, { indices: false })

  return request({
    url: queryString ? `/log/page?${queryString}` : '/log/page',
    method: 'get'
  })
}
