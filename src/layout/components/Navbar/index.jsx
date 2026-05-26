import { useEffect, useMemo, useState } from 'react'
import {
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined
} from '@ant-design/icons'
import { App as AntdApp, Avatar, Breadcrumb, Button, Dropdown, Tooltip } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAppStore from '@/store/app.js'
import usePermissionStore from '@/store/permission.js'
import useSettingsStore from '@/store/settings.js'
import useUserStore from '@/store/user.js'
import './index.scss'

function Navbar({ onSetLayout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const routes = usePermissionStore((state) => state.routes)
  const sidebar = useAppStore((state) => state.sidebar)
  const device = useAppStore((state) => state.device)
  const size = useAppStore((state) => state.size)
  const toggleSideBar = useAppStore((state) => state.toggleSideBar)
  const setSize = useAppStore((state) => state.setSize)
  const topNav = useSettingsStore((state) => state.topNav)
  const isDark = useSettingsStore((state) => state.isDark)
  const showSettings = useSettingsStore((state) => state.showSettings)
  const toggleTheme = useSettingsStore((state) => state.toggleTheme)
  const nickName = useUserStore((state) => state.nickName)
  const avatar = useUserStore((state) => state.avatar)
  const logOut = useUserStore((state) => state.logOut)
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const { modal } = AntdApp.useApp()

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const breadcrumbItems = useMemo(() => {
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
    const matchedRoutes = []
    const matchRoutes = (items = [], basePath = '/') => {
      for (const route of items) {
        if (route.path === '*') {
          continue
        }

        const routePath = route.index ? normalizePath(basePath) : resolvePath(basePath, route.path)
        const isCurrent = location.pathname === routePath
        const isParent = route.children?.length && location.pathname.startsWith(`${routePath}/`)

        if (isCurrent || isParent) {
          matchedRoutes.push({ ...route, fullPath: routePath })
          if (route.children?.length) {
            matchRoutes(route.children, routePath)
          }
          return
        }
      }
    }

    matchRoutes(routes)

    return matchedRoutes
      .filter((route) => route.meta?.title && !route.hidden && !route.meta?.hidden)
      .map((route, index, list) => ({
        title:
          index < list.length - 1 ? (
            <Link to={route.fullPath}>{route.meta.title}</Link>
          ) : (
            route.meta.title
          )
      }))
  }, [location.pathname, routes])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      return
    }

    await document.exitFullscreen()
  }

  const handleUserMenuClick = ({ key }) => {
    if (key === 'profile') {
      navigate('/user/profile')
      return
    }

    if (key === 'setting') {
      onSetLayout?.()
      return
    }

    if (key === 'logout') {
      modal.confirm({
        title: '提示',
        content: '确定退出登录吗？',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          await logOut()
          navigate('/index', { replace: true })
        }
      })
    }
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心'
    },
    showSettings
      ? {
          key: 'setting',
          icon: <SettingOutlined />,
          label: '布局设置'
        }
      : null,
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ].filter(Boolean)

  const sizeMenuItems = [
    { key: 'small', label: '紧凑' },
    { key: 'middle', label: '默认' },
    { key: 'large', label: '宽松' }
  ]

  return (
    <div className="navbar-inner">
      <Button
        className="navbar-icon-button hamburger-container"
        icon={sidebar.opened ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        onClick={() => toggleSideBar(false)}
        type="text"
      />

      {topNav ? <div className="top-nav-placeholder" /> : <Breadcrumb className="breadcrumb-container" items={breadcrumbItems} />}

      <div className="right-menu">
        {device !== 'mobile' ? (
          <>
            <Tooltip placement="bottom" title={isFullscreen ? '退出全屏' : '全屏'}>
              <Button
                className="navbar-icon-button"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                type="text"
              />
            </Tooltip>

            <Tooltip placement="bottom" title="主题模式">
              <Button
                className="navbar-icon-button"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                type="text"
              />
            </Tooltip>

            <Dropdown
              menu={{
                items: sizeMenuItems,
                selectable: true,
                selectedKeys: [size],
                onClick: ({ key }) => setSize(key)
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button className="navbar-text-button" type="text">
                布局大小
              </Button>
            </Dropdown>
          </>
        ) : null}

        <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight" trigger={['hover']}>
          <button className="avatar-wrapper" type="button">
            <Avatar icon={!avatar ? <UserOutlined /> : null} size={30} src={avatar || undefined} />
            <span className="user-nickname">{nickName}</span>
          </button>
        </Dropdown>
      </div>
    </div>
  )
}

export default Navbar
