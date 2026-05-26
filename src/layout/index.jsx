import { useEffect, useState } from 'react'
import { Layout as AntLayout } from 'antd'
import AppMain from '@/layout/components/AppMain/index.jsx'
import Navbar from '@/layout/components/Navbar/index.jsx'
import Settings from '@/layout/components/Settings/index.jsx'
import Sidebar from '@/layout/components/Sidebar/index.jsx'
import TagsView from '@/layout/components/TagsView/index.jsx'
import useAppStore from '@/store/app.js'
import useSettingsStore from '@/store/settings.js'
import './index.scss'

const { Sider, Header } = AntLayout
const MOBILE_WIDTH = 992

function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const sidebar = useAppStore((state) => state.sidebar)
  const device = useAppStore((state) => state.device)
  const toggleDevice = useAppStore((state) => state.toggleDevice)
  const closeSideBar = useAppStore((state) => state.closeSideBar)
  const fixedHeader = useSettingsStore((state) => state.fixedHeader)
  const needTagsView = useSettingsStore((state) => state.tagsView)
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    const updateDevice = () => {
      if (window.innerWidth - 1 < MOBILE_WIDTH) {
        toggleDevice('mobile')
        closeSideBar({ withoutAnimation: true })
        return
      }

      toggleDevice('desktop')
    }

    updateDevice()
    window.addEventListener('resize', updateDevice)

    return () => {
      window.removeEventListener('resize', updateDevice)
    }
  }, [closeSideBar, toggleDevice])

  useEffect(() => {
    if (device === 'mobile' && useAppStore.getState().sidebar.opened) {
      closeSideBar({ withoutAnimation: false })
    }
  }, [closeSideBar, device])

  const wrapperClassName = [
    'app-wrapper',
    sidebar.opened ? 'openSidebar' : 'hideSidebar',
    sidebar.withoutAnimation ? 'withoutAnimation' : '',
    device === 'mobile' ? 'mobile' : '',
    sidebar.hide ? 'sidebarHide' : '',
    needTagsView ? 'hasTagsView' : '',
    fixedHeader ? 'fixedHeaderLayout' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClassName} style={{ '--current-color': theme }}>
      {device === 'mobile' && sidebar.opened ? (
        <div className="drawer-bg" onClick={() => closeSideBar({ withoutAnimation: false })} />
      ) : null}

      <AntLayout className="layout-shell">
        {!sidebar.hide ? (
          <Sider
            className="sidebar-container"
            collapsed={!sidebar.opened}
            collapsedWidth={54}
            trigger={null}
            width={200}
          >
            <Sidebar />
          </Sider>
        ) : null}

        <AntLayout className="main-container">
          <div className={fixedHeader ? 'fixed-header' : 'layout-header-wrap'}>
            <Header className="navbar">
              <Navbar onSetLayout={() => setSettingsOpen(true)} />
            </Header>
            {needTagsView ? <TagsView /> : null}
          </div>

          <AppMain />
          <Settings onClose={() => setSettingsOpen(false)} open={settingsOpen} />
        </AntLayout>
      </AntLayout>
    </div>
  )
}

export default Layout
