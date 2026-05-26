import { useEffect, useRef } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import usePermissionStore from '@/store/permission.js'
import useUserStore from '@/store/user.js'
import { getToken } from '@/utils/auth.js'

function RouterView() {
  const routes = usePermissionStore((state) => state.routes)

  return useRoutes(routes)
}

function AuthBootstrap({ children }) {
  const bootstrapped = useRef(false)
  const getUserInfo = useUserStore((state) => state.getUserInfo)
  const generateRoutes = usePermissionStore((state) => state.generateRoutes)

  useEffect(() => {
    if (bootstrapped.current || !getToken()) {
      return
    }

    bootstrapped.current = true
    Promise.all([getUserInfo(), generateRoutes()]).catch(() => {})
  }, [generateRoutes, getUserInfo])

  return children
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <RouterView />
      </AuthBootstrap>
    </BrowserRouter>
  )
}

export default AppRouter
