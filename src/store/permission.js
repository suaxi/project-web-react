import { createElement, lazy, Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { create } from 'zustand'
import { getUserRouter } from '@/api/system/menu.js'
import { constantRoutes, layoutRoutes } from '@/router/routes.jsx'

const viewModules = import.meta.glob('../views/**/*.jsx')

const loadView = (view) => {
  const normalizedView = view?.replace(/^\/+|\.jsx$/g, '')
  const modulePath = `../views/${normalizedView}.jsx`
  const indexModulePath = `../views/${normalizedView}/index.jsx`
  const loader = viewModules[modulePath] || viewModules[indexModulePath]

  if (!loader) {
    return undefined
  }

  const Component = lazy(loader)
  return createElement(Suspense, { fallback: null }, createElement(Component))
}

const convertBackendRoutes = (routes = []) =>
  routes.map((route) => {
    const nextRoute = { ...route }
    const hasChildren = Boolean(nextRoute.children?.length)
    const component = nextRoute.component

    if (hasChildren || ['Layout', 'ParentView'].includes(component)) {
      nextRoute.element = createElement(Outlet)
    } else if (component && component !== 'InnerLink') {
      nextRoute.element = loadView(component)
    }

    delete nextRoute.component

    if (hasChildren) {
      nextRoute.children = convertBackendRoutes(nextRoute.children)
    } else {
      delete nextRoute.children
      delete nextRoute.redirect
    }

    return nextRoute
  })

const mergeLayoutChildren = (dynamicRoutes = []) =>
  constantRoutes.map((route) => {
    if (route.path !== '/') {
      return route
    }

    const children = route.children || []
    const fallbackRoutes = children.filter((child) => child.path === '404' || child.path === '*')
    const baseRoutes = children.filter((child) => !['404', '*'].includes(child.path))

    return {
      ...route,
      children: [...baseRoutes, ...dynamicRoutes, ...fallbackRoutes]
    }
  })

const usePermissionStore = create((set) => ({
  routes: constantRoutes,
  addRoutes: [],
  defaultRoutes: layoutRoutes,
  topbarRouters: layoutRoutes,
  sidebarRouters: layoutRoutes,

  setRoutes: (routes) => {
    set({
      addRoutes: routes,
      routes: mergeLayoutChildren(routes)
    })
  },

  setDefaultRoutes: (defaultRoutes) => {
    set({ defaultRoutes })
  },

  setTopbarRoutes: (topbarRouters) => {
    set({ topbarRouters })
  },

  setSidebarRouters: (sidebarRouters) => {
    set({ sidebarRouters })
  },

  generateRoutes: async () => {
    const res = await getUserRouter()
    const menuRoutes = convertBackendRoutes(JSON.parse(JSON.stringify(res || [])))
    const sidebarRoutes = [...layoutRoutes, ...menuRoutes]

    set({
      addRoutes: menuRoutes,
      routes: mergeLayoutChildren(menuRoutes),
      defaultRoutes: sidebarRoutes,
      topbarRouters: sidebarRoutes,
      sidebarRouters: sidebarRoutes
    })

    return menuRoutes
  },

  resetRoutes: () => {
    set({
      routes: constantRoutes,
      addRoutes: [],
      defaultRoutes: layoutRoutes,
      topbarRouters: layoutRoutes,
      sidebarRouters: layoutRoutes
    })
  }
}))

export default usePermissionStore
