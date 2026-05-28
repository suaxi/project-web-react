import {
  AppstoreOutlined,
  ApartmentOutlined,
  BookOutlined,
  DashboardOutlined,
  DesktopOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  MenuOutlined,
  MonitorOutlined,
  ProfileOutlined,
  SettingOutlined,
  TableOutlined,
  ToolOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import useAppStore from '@/store/app.js'
import usePermissionStore from '@/store/permission.js'
import useSettingsStore from '@/store/settings.js'
import Logo from './Logo.jsx'
import './index.scss'

const iconMap = {
  dashboard: <DashboardOutlined />,
  dict: <BookOutlined />,
  desktop: <DesktopOutlined />,
  link: <LinkOutlined />,
  list: <UnorderedListOutlined />,
  log: <FileTextOutlined />,
  menu: <MenuOutlined />,
  monitor: <MonitorOutlined />,
  peoples: <TeamOutlined />,
  role: <TeamOutlined />,
  setting: <SettingOutlined />,
  system: <SettingOutlined />,
  tool: <ToolOutlined />,
  tree: <ApartmentOutlined />,
  'tree-table': <TableOutlined />,
  user: <UserOutlined />,
  folder: <FolderOpenOutlined />,
  app: <AppstoreOutlined />
}

function Sidebar() {
  const location = useLocation()
  const sidebarRouters = usePermissionStore((state) => state.sidebarRouters)
  const sidebar = useAppStore((state) => state.sidebar)
  const device = useAppStore((state) => state.device)
  const closeSideBar = useAppStore((state) => state.closeSideBar)
  const sideTheme = useSettingsStore((state) => state.sideTheme)
  const showLogo = useSettingsStore((state) => state.sidebarLogo)
  const isDark = useSettingsStore((state) => state.isDark)
  const menuTheme = isDark || sideTheme === 'theme-dark' ? 'dark' : 'light'

  const isExternal = (path = '') => /^(https?:|mailto:|tel:)/.test(path)
  const visibleChildren = (route) => (route.children || []).filter((child) => !child.hidden && !child.meta?.hidden)
  const normalizePath = (path) => `/${path || ''}`.replace(/\/+/g, '/')
  const resolvePath = (basePath, routePath = '') => {
    if (isExternal(routePath)) {
      return routePath
    }
    if (isExternal(basePath)) {
      return basePath
    }
    if (!routePath) {
      return normalizePath(basePath)
    }
    if (routePath.startsWith('/')) {
      return normalizePath(routePath)
    }
    return normalizePath(`${basePath}/${routePath}`)
  }

  const getIcon = (icon) => {
    if (!icon || icon === '#') {
      return null
    }
    return iconMap[icon] || <AppstoreOutlined />
  }

  const getTitle = (route) => route.meta?.title || route.name || route.path

  const getMenuItem = (route, basePath = '/') => {
    if (route.hidden || route.meta?.hidden) {
      return null
    }

    const routePath = resolvePath(basePath, route.path)
    const children = visibleChildren(route)
    const shouldPromoteChild = children.length === 1 && !route.alwaysShow && !route.meta?.alwaysShow

    if (shouldPromoteChild && !visibleChildren(children[0]).length) {
      return getMenuItem(children[0], routePath)
    }

    if (children.length) {
      return {
        key: routePath,
        icon: getIcon(route.meta?.icon),
        label: getTitle(route),
        children: children.map((child) => getMenuItem(child, routePath)).filter(Boolean)
      }
    }

    return {
      key: routePath,
      icon: getIcon(route.meta?.icon),
      label: isExternal(routePath) ? (
        <a href={routePath} rel="noreferrer" target="_blank">
          {getTitle(route)}
        </a>
      ) : (
        <Link to={routePath}>{getTitle(route)}</Link>
      )
    }
  }

  const getSelectedKey = (routes, pathname, basePath = '/') => {
    for (const route of routes) {
      const routePath = resolvePath(basePath, route.path)

      if (routePath === pathname) {
        return route.meta?.activeMenu || routePath
      }

      if (route.children?.length) {
        const selectedKey = getSelectedKey(route.children, pathname, routePath)
        if (selectedKey) {
          return selectedKey
        }
      }
    }

    return ''
  }

  const selectedKey = normalizePath(getSelectedKey(sidebarRouters, location.pathname) || location.pathname)
  const openKeys = selectedKey
    .split('/')
    .filter(Boolean)
    .slice(0, -1)
    .map((_, index, parts) => `/${parts.slice(0, index + 1).join('/')}`)

  const handleMenuClick = () => {
    if (device === 'mobile') {
      closeSideBar({ withoutAnimation: false })
    }
  }

  return (
    <div className={`sidebar-shell ${menuTheme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      {showLogo ? <Logo collapse={!sidebar.opened} /> : null}
      <Menu
        className="sidebar-menu"
        defaultOpenKeys={openKeys}
        inlineCollapsed={!sidebar.opened}
        items={sidebarRouters.map((route) => getMenuItem(route)).filter(Boolean)}
        mode="inline"
        onClick={handleMenuClick}
        selectedKeys={[selectedKey]}
        theme={menuTheme}
      />
    </div>
  )
}

export default Sidebar
