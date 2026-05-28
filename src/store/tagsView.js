import { create } from 'zustand'

const getViewPath = (view) => view.path || view.pathname || view.fullPath || '/'
const getViewFullPath = (view) => view.fullPath || view.path || view.pathname || '/'

const normalizeView = (view) => ({
  ...view,
  path: getViewPath(view),
  fullPath: getViewFullPath(view),
  title: view.title || view.meta?.title || 'no-name'
})

const useTagsViewStore = create((set, get) => ({
  visitedViews: [],
  cachedViews: [],
  iframeViews: [],

  resetViews: () => {
    set({
      visitedViews: [],
      cachedViews: [],
      iframeViews: []
    })
  },

  addView: (view) => {
    get().addVisitedView(view)
    get().addCachedView(view)
  },

  addIframeView: (view) => {
    const nextView = normalizeView(view)
    set((state) => {
      if (state.iframeViews.some((item) => item.path === nextView.path)) {
        return state
      }

      return { iframeViews: [...state.iframeViews, nextView] }
    })
  },

  addVisitedView: (view) => {
    const nextView = normalizeView(view)
    set((state) => {
      if (state.visitedViews.some((item) => item.path === nextView.path)) {
        return state
      }

      return { visitedViews: [...state.visitedViews, nextView] }
    })
  },

  addCachedView: (view) => {
    const cacheName = view.name || view.path
    if (!cacheName || view.meta?.noCache) {
      return
    }

    set((state) => {
      if (state.cachedViews.includes(cacheName)) {
        return state
      }

      return { cachedViews: [...state.cachedViews, cacheName] }
    })
  },

  delView: (view) => {
    get().delVisitedView(view)
    get().delCachedView(view)
  },

  delVisitedView: (view) => {
    const path = getViewPath(view)
    set((state) => ({
      visitedViews: state.visitedViews.filter((item) => item.path !== path),
      iframeViews: state.iframeViews.filter((item) => item.path !== path)
    }))
  },

  delIframeView: (view) => {
    const path = getViewPath(view)
    set((state) => ({
      iframeViews: state.iframeViews.filter((item) => item.path !== path)
    }))
  },

  delCachedView: (view) => {
    const cacheName = view.name || view.path
    set((state) => ({
      cachedViews: state.cachedViews.filter((name) => name !== cacheName)
    }))
  },

  delOthersViews: (view) => {
    get().delOthersVisitedViews(view)
    get().delOthersCachedViews(view)
  },

  delOthersVisitedViews: (view) => {
    const path = getViewPath(view)
    set((state) => ({
      visitedViews: state.visitedViews.filter((item) => item.meta?.affix || item.path === path),
      iframeViews: state.iframeViews.filter((item) => item.path === path)
    }))
  },

  delOthersCachedViews: (view) => {
    const cacheName = view.name || view.path
    set((state) => ({
      cachedViews: state.cachedViews.filter((name) => name === cacheName)
    }))
  },

  delAllViews: () => {
    get().delAllVisitedViews()
    get().delAllCachedViews()
  },

  delAllVisitedViews: () => {
    set((state) => ({
      visitedViews: state.visitedViews.filter((item) => item.meta?.affix),
      iframeViews: []
    }))
  },

  delAllCachedViews: () => {
    set({ cachedViews: [] })
  },

  updateVisitedView: (view) => {
    const nextView = normalizeView(view)
    set((state) => ({
      visitedViews: state.visitedViews.map((item) => (item.path === nextView.path ? nextView : item))
    }))
  },

  delRightTags: (view) => {
    const path = getViewPath(view)
    set((state) => {
      const index = state.visitedViews.findIndex((item) => item.path === path)
      if (index === -1) {
        return state
      }

      const removedViews = state.visitedViews.slice(index + 1).filter((item) => !item.meta?.affix)
      const removedPaths = removedViews.map((item) => item.path)
      const removedNames = removedViews.map((item) => item.name).filter(Boolean)

      return {
        visitedViews: state.visitedViews.filter((item, itemIndex) => itemIndex <= index || item.meta?.affix),
        cachedViews: state.cachedViews.filter((name) => !removedNames.includes(name)),
        iframeViews: state.iframeViews.filter((item) => !removedPaths.includes(item.path))
      }
    })
  },

  delLeftTags: (view) => {
    const path = getViewPath(view)
    set((state) => {
      const index = state.visitedViews.findIndex((item) => item.path === path)
      if (index === -1) {
        return state
      }

      const removedViews = state.visitedViews.slice(0, index).filter((item) => !item.meta?.affix)
      const removedPaths = removedViews.map((item) => item.path)
      const removedNames = removedViews.map((item) => item.name).filter(Boolean)

      return {
        visitedViews: state.visitedViews.filter((item, itemIndex) => itemIndex >= index || item.meta?.affix),
        cachedViews: state.cachedViews.filter((name) => !removedNames.includes(name)),
        iframeViews: state.iframeViews.filter((item) => !removedPaths.includes(item.path))
      }
    })
  }
}))

export default useTagsViewStore
