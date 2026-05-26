import { useEffect } from 'react'
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import AppRouter from '@/router/index.jsx'
import useAppStore from '@/store/app.js'
import useSettingsStore from '@/store/settings.js'

function App() {
  const size = useAppStore((state) => state.size)
  const themeColor = useSettingsStore((state) => state.theme)
  const isDark = useSettingsStore((state) => state.isDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.setProperty('--current-color', themeColor)
  }, [isDark, themeColor])

  return (
    <ConfigProvider
      componentSize={size}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          borderRadius: 4,
          colorPrimary: themeColor
        }
      }}
    >
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
