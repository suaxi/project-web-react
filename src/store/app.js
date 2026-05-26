import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  sidebar: {
    opened: true,
    withoutAnimation: false,
    hide: false
  },
  device: 'desktop',
  size: 'middle',

  toggleSideBar: (withoutAnimation = false) => {
    if (get().sidebar.hide) {
      return false
    }

    set((state) => ({
      sidebar: {
        ...state.sidebar,
        opened: !state.sidebar.opened,
        withoutAnimation
      }
    }))

    return true
  },

  closeSideBar: ({ withoutAnimation = false } = {}) => {
    set((state) => ({
      sidebar: {
        ...state.sidebar,
        opened: false,
        withoutAnimation
      }
    }))
  },

  toggleDevice: (device) => {
    set({ device })
  },

  setSize: (size) => {
    set({ size })
  },

  toggleSideBarHide: (hide) => {
    set((state) => ({
      sidebar: {
        ...state.sidebar,
        hide
      }
    }))
  }
}))

export default useAppStore
