import { create } from 'zustand'
import { getUserInfo, login, logout } from '@/api/login.js'
import { getToken, removeToken, setToken } from '@/utils/auth.js'

const defaultUser = {
  token: getToken() || '',
  id: '',
  name: '',
  nickName: '管理员',
  avatar: '',
  roles: [],
  permissions: [],
  user: {}
}

const useUserStore = create((set) => ({
  ...defaultUser,

  login: async (userInfo = {}) => {
    const username = userInfo.username?.trim()
    const password = userInfo.password
    const code = userInfo.code
    const uuid = userInfo.uuid
    const rememberMe = Boolean(userInfo.rememberMe)
    const res = await login(username, password, code, uuid)

    setToken(res.token, rememberMe)
    set({ token: res.token })
  },

  getUserInfo: async () => {
    const res = await getUserInfo()
    const user = res.user || {}
    const permissions = res.permissions?.length ? res.permissions : ['ROLE_SYSTEM_DEFAULT']

    set({
      id: user.id || '',
      name: user.username || user.name || '',
      nickName: user.nickName || user.nickname || user.username || user.name || defaultUser.nickName,
      avatar: user.avatar || '',
      roles: permissions,
      permissions,
      user
    })

    return res
  },

  setUserInfo: (userInfo = {}) => {
    set({
      id: userInfo.id || '',
      name: userInfo.name || '',
      nickName: userInfo.nickName || userInfo.nickname || userInfo.name || defaultUser.nickName,
      avatar: userInfo.avatar || '',
      roles: userInfo.roles || [],
      permissions: userInfo.permissions || [],
      user: userInfo
    })
  },

  logOut: async () => {
    try {
      if (getToken()) {
        await logout()
      }
    } finally {
      removeToken()
      set({
        ...defaultUser,
        token: ''
      })
    }
  }
}))

export default useUserStore
