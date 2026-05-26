import { Layout as AntLayout } from 'antd'
import { useMemo } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import usePermissionStore from '@/store/permission.js'
import useSettingsStore from '@/store/settings.js'
import Copyright from '@/layout/components/Copyright/index.jsx'
import './index.scss'

const { Content } = AntLayout

function AppMain() {
  const location = useLocation()
  const outlet = useOutlet()
  const routes = usePermissionStore((state) => state.routes)
  const footerVisible = useSettingsStore((state) => state.footerVisible)

  const currentRoute = useMemo(() => {
    const normalizePath = (path = '/') => `/${path}`.replace(/\/+/g, '/')
    const resolvePath = (basePath = '/', routePath = '') => {
      if (!routePath || routePath === '/') {
        return normalizePath(basePath)
      }
      if (routePath.startsWith('/')) {
        return normalizePath(routePath)
      }
      return normalizePath(`${basePath}/${routePath}`)
    }
    const findRoute = (items = [], basePath = '/') => {
      for (const route of items) {
        if (route.path === '*') {
          continue
        }

        const fullPath = route.index ? normalizePath(basePath) : resolvePath(basePath, route.path)
        if (fullPath === location.pathname) {
          return route
        }

        if (route.children?.length) {
          const childRoute = findRoute(route.children, fullPath)
          if (childRoute) {
            return childRoute
          }
        }
      }

      return null
    }

    return findRoute(routes)
  }, [location.pathname, routes])

  return (
    <Content className={`app-main${footerVisible ? ' has-copyright' : ''}`}>
      <div className="app-main-page" key={`${location.pathname}${location.search}`}>
        {currentRoute?.meta?.link ? null : outlet}
      </div>
      <Copyright />
    </Content>
  )
}

export default AppMain
