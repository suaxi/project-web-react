import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, ColorPicker, Divider, Drawer, Switch } from 'antd'
import useAppStore from '@/store/app.js'
import usePermissionStore from '@/store/permission.js'
import useSettingsStore from '@/store/settings.js'
import './index.scss'

const predefineColors = ['#409EFF', '#ff4500', '#ff8c00', '#ffd700', '#90ee90', '#00ced1', '#1e90ff', '#c71585']

function Settings({ open, onClose }) {
  const appStore = useAppStore()
  const defaultRoutes = usePermissionStore((state) => state.defaultRoutes)
  const setSidebarRouters = usePermissionStore((state) => state.setSidebarRouters)
  const settings = useSettingsStore()
  const { message } = AntdApp.useApp()

  const topNavChange = (checked) => {
    settings.changeSetting('topNav', checked)

    if (!checked) {
      appStore.toggleSideBarHide(false)
      setSidebarRouters(defaultRoutes)
    }
  }

  const themeChange = (color, hex) => {
    settings.setTheme(hex || color.toHexString())
  }

  const saveSetting = () => {
    settings.saveSetting()
    message.loading('正在保存到本地，请稍候...', 1)
  }

  const resetSetting = () => {
    message.loading('正在清除设置缓存并刷新，请稍候...', 1)
    settings.resetSetting()
    setTimeout(() => window.location.reload(), 1000)
  }

  return (
    <Drawer className="settings-drawer" closable={false} lockScroll={false} onClose={onClose} open={open} placement="right" size={300}>
      <h3 className="drawer-title">主题风格设置</h3>

      <div className="theme-card-group">
        <button
          className={`theme-card theme-card-dark${settings.sideTheme === 'theme-dark' ? ' active' : ''}`}
          onClick={() => settings.setSideTheme('theme-dark')}
          type="button"
        >
          <span className="theme-card-sidebar" />
          <span className="theme-card-main" />
          <span className="theme-card-check">✓</span>
        </button>

        <button
          className={`theme-card theme-card-light${settings.sideTheme === 'theme-light' ? ' active' : ''}`}
          onClick={() => settings.setSideTheme('theme-light')}
          type="button"
        >
          <span className="theme-card-sidebar" />
          <span className="theme-card-main" />
          <span className="theme-card-check">✓</span>
        </button>
      </div>

      <div className="drawer-item">
        <span>主题颜色</span>
        <ColorPicker value={settings.theme} onChange={themeChange} />
      </div>

      <div className="color-swatches">
        {predefineColors.map((color) => (
          <button
            aria-label={color}
            className="color-swatch"
            key={color}
            onClick={() => settings.setTheme(color)}
            style={{ backgroundColor: color }}
            type="button"
          />
        ))}
      </div>

      <Divider />

      <h3 className="drawer-title">系统布局配置</h3>

      <div className="drawer-item">
        <span>开启 TopNav</span>
        <Switch checked={settings.topNav} onChange={topNavChange} />
      </div>

      <div className="drawer-item">
        <span>开启 TagsView</span>
        <Switch checked={settings.tagsView} onChange={(checked) => settings.changeSetting('tagsView', checked)} />
      </div>

      <div className="drawer-item">
        <span>显示页签图标</span>
        <Switch checked={settings.tagsIcon} disabled={!settings.tagsView} onChange={(checked) => settings.changeSetting('tagsIcon', checked)} />
      </div>

      <div className="drawer-item">
        <span>固定 Header</span>
        <Switch checked={settings.fixedHeader} onChange={(checked) => settings.changeSetting('fixedHeader', checked)} />
      </div>

      <div className="drawer-item">
        <span>显示 Logo</span>
        <Switch checked={settings.sidebarLogo} onChange={(checked) => settings.changeSetting('sidebarLogo', checked)} />
      </div>

      <div className="drawer-item">
        <span>动态标题</span>
        <Switch checked={settings.dynamicTitle} onChange={(checked) => settings.changeSetting('dynamicTitle', checked)} />
      </div>

      <div className="drawer-item">
        <span>底部版权</span>
        <Switch checked={settings.footerVisible} onChange={(checked) => settings.changeSetting('footerVisible', checked)} />
      </div>

      <Divider />

      <div className="setting-actions">
        <Button icon={<SaveOutlined />} onClick={saveSetting} type="primary">
          保存配置
        </Button>
        <Button icon={<ReloadOutlined />} onClick={resetSetting}>
          重置配置
        </Button>
      </div>
    </Drawer>
  )
}

export default Settings
