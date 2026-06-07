import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, useLocation, useNavigate, useRoutes } from 'react-router-dom'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import usePermissionStore from '@/store/permission.js'
import useUserStore from '@/store/user.js'
import { getToken } from '@/utils/auth.js'
import settings from '@/settings.js'

const whiteList = ['/login']

NProgress.configure({ showSpinner: false })

function RouterView() {
  const location = useLocation()
  const navigate = useNavigate()
  const routes = usePermissionStore((state) => state.routes)
  const generateRoutes = usePermissionStore((state) => state.generateRoutes)
  const resetRoutes = usePermissionStore((state) => state.resetRoutes)
  const storeToken = useUserStore((state) => state.token)
  const roles = useUserStore((state) => state.roles)
  const getUserInfo = useUserStore((state) => state.getUserInfo)
  const logOut = useUserStore((state) => state.logOut)
  const [routeReady, setRouteReady] = useState(() => !getToken())
  const routeElement = useRoutes(routes)
  const token = storeToken || getToken()
  const fullPath = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.hash, location.pathname, location.search]
  )
  const loginRedirect = useMemo(() => {
    const redirect = new URLSearchParams(location.search).get('redirect')

    return redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/index'
  }, [location.search])

  useEffect(() => {
    if (!routeReady) {
      return undefined
    }

    NProgress.start()
    const timer = window.setTimeout(() => {
      NProgress.done()
    }, 200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [fullPath, routeReady])

  useEffect(() => {
    let canceled = false

    if (!token) {
      NProgress.done()
      setRouteReady(true)
      resetRoutes()
      return undefined
    }

    if (location.pathname === '/login' || roles.length) {
      NProgress.done()
      setRouteReady(true)
      return undefined
    }

    setRouteReady(false)
    NProgress.start()

    Promise.all([getUserInfo(), generateRoutes()])
      .then(() => {
        if (!canceled) {
          setRouteReady(true)
        }
      })
      .catch(async () => {
        try {
          await logOut()
        } finally {
          if (!canceled) {
            setRouteReady(true)
            navigate(`/login?redirect=${encodeURIComponent(fullPath)}`, { replace: true })
          }
        }
      })
      .finally(() => {
        if (!canceled) {
          NProgress.done()
        }
      })

    return () => {
      canceled = true
      NProgress.done()
    }
  }, [fullPath, generateRoutes, getUserInfo, location.pathname, logOut, navigate, resetRoutes, roles.length, token])

  useEffect(() => {
    const findDocumentTitle = (items = [], basePath = '') => {
      for (const route of items) {
        const routePath = route.index ? basePath || '/' : route.path?.startsWith('/') ? route.path : `${basePath}/${route.path || ''}`.replace(/\/+/g, '/')

        if (routePath === location.pathname) {
          return route.meta?.title
        }

        const childTitle = findDocumentTitle(route.children, routePath)
        if (childTitle) {
          return childTitle
        }
      }
      return ''
    }

    document.title = findDocumentTitle(routes) || settings.title
  }, [location.pathname, routes])

  if (!token && !whiteList.includes(location.pathname)) {
    return <Navigate replace to={`/login?redirect=${encodeURIComponent(fullPath)}`} />
  }

  if (token && location.pathname === '/login') {
    return <Navigate replace to={loginRedirect} />
  }

  if (token && location.pathname !== '/login' && (!roles.length || !routeReady)) {
    return null
  }
  return routeElement
}

function AppRouter() {
  return (
    <BrowserRouter>
      <RouterView />
    </BrowserRouter>
  )
}

export default AppRouter
