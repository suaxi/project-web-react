import { useEffect } from 'react'
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import AppRouter from '@/router/index.jsx'
import useAppStore from '@/store/app.js'
import useSettingsStore from '@/store/settings.js'

function RequestErrorMessage() {
  const { message } = AntdApp.useApp()

  useEffect(() => {
    const handleRequestError = (event) => {
      const errorMessage = event.detail?.message

      if (errorMessage) {
        message.error(errorMessage)
      }
    }

    window.addEventListener('request-error', handleRequestError)

    return () => {
      window.removeEventListener('request-error', handleRequestError)
    }
  }, [message])

  return null
}

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
        <RequestErrorMessage />
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
