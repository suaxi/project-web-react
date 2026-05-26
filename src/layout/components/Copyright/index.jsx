import useSettingsStore from '@/store/settings.js'
import './index.scss'

function Copyright() {
  const visible = useSettingsStore((state) => state.footerVisible)
  const content = useSettingsStore((state) => state.footerContent)

  if (!visible) {
    return null
  }

  return <footer className="copyright">{content}</footer>
}

export default Copyright
