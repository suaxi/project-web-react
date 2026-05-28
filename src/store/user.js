import { create } from 'zustand'
import { getUserInfo, login, logout } from '@/api/login.js'
import usePermissionStore from '@/store/permission.js'
import useTagsViewStore from '@/store/tagsView.js'
import { getToken, removeToken, setToken } from '@/utils/auth.js'

const emptyUser = {
  token: '',
  id: '',
  name: '',
  nickName: '管理员',
  avatar: '',
  roles: [],
  permissions: [],
  user: {}
}

const defaultUser = {
  ...emptyUser,
  token: getToken() || ''
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

    if (!res?.token) {
      throw new Error('登录返回缺少 token')
    }

    setToken(res.token, rememberMe)
    set({ token: res.token })

    return res
  },

  getUserInfo: async () => {
    const res = await getUserInfo()
    const user = res.user || {}
    const permissions = res.permissions?.length ? res.permissions : ['ROLE_SYSTEM_DEFAULT']
    const avatar = user.avatar || user.avatarPath || ''
    const validAvatar = /^(https?:|data:image\/|\/api\/|\/assets\/)/.test(avatar) ? avatar : ''

    set({
      id: user.id ?? '',
      name: user.username || user.name || '',
      nickName: user.nickName || user.nickname || user.username || user.name || defaultUser.nickName,
      avatar: validAvatar,
      roles: permissions,
      permissions,
      user
    })

    return res
  },

  setUserInfo: (userInfo = {}) => {
    const avatar = userInfo.avatar || userInfo.avatarPath || ''

    set({
      id: userInfo.id ?? '',
      name: userInfo.name || '',
      nickName: userInfo.nickName || userInfo.nickname || userInfo.name || defaultUser.nickName,
      avatar: /^(https?:|data:image\/|\/api\/|\/assets\/)/.test(avatar) ? avatar : '',
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
      usePermissionStore.getState().resetRoutes()
      useTagsViewStore.getState().resetViews()
      set({ ...emptyUser })
    }
  }
}))

export default useUserStore
