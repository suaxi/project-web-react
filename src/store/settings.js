import { create } from 'zustand'

const defaultSettings = {
  title: '',
  theme: '#409EFF',
  sideTheme: 'theme-dark',
  showSettings: true,
  topNav: false,
  tagsView: true,
  tagsIcon: false,
  fixedHeader: false,
  sidebarLogo: true,
  dynamicTitle: false,
  footerVisible: true,
  footerContent: 'Copyright © 2026 Project Web React',
  isDark: false
}

const savedLayoutSetting = (() => {
  try {
    return JSON.parse(localStorage.getItem('layout-setting')) || {}
  } catch {
    return {}
  }
})()

const useSettingsStore = create((set, get) => ({
  ...defaultSettings,
  ...savedLayoutSetting,

  changeSetting: (key, value) => {
    set({ [key]: value })
  },

  setTitle: (title) => {
    set({ title })
  },

  setTheme: (theme) => {
    set({ theme })
  },

  setSideTheme: (sideTheme) => {
    set({ sideTheme })
  },

  toggleTheme: () => {
    set((state) => ({ isDark: !state.isDark }))
  },

  saveSetting: () => {
    const state = get()
    const layoutSetting = {
      topNav: state.topNav,
      tagsView: state.tagsView,
      tagsIcon: state.tagsIcon,
      fixedHeader: state.fixedHeader,
      sidebarLogo: state.sidebarLogo,
      dynamicTitle: state.dynamicTitle,
      footerVisible: state.footerVisible,
      sideTheme: state.sideTheme,
      theme: state.theme,
      isDark: state.isDark
    }

    localStorage.setItem('layout-setting', JSON.stringify(layoutSetting))
  },

  resetSetting: () => {
    localStorage.removeItem('layout-setting')
    set(defaultSettings)
  }
}))

export default useSettingsStore
