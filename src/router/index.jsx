import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, useLocation, useNavigate, useRoutes } from 'react-router-dom'
import usePermissionStore from '@/store/permission.js'
import useUserStore from '@/store/user.js'
import { getToken } from '@/utils/auth.js'

const whiteList = ['/login']

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
    let canceled = false

    if (!token) {
      setRouteReady(true)
      resetRoutes()
      return undefined
    }

    if (location.pathname === '/login' || roles.length) {
      setRouteReady(true)
      return undefined
    }

    setRouteReady(false)

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

    return () => {
      canceled = true
    }
  }, [fullPath, generateRoutes, getUserInfo, location.pathname, logOut, navigate, resetRoutes, roles.length, token])

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
