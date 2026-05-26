import { Link } from 'react-router-dom'

function Logo({ collapse }) {
  const title = import.meta.env.VITE_APP_TITLE || 'Project Web'

  return (
    <div className={`sidebar-logo-container${collapse ? ' collapse' : ''}`}>
      <Link className="sidebar-logo-link" to="/">
        <span className="sidebar-logo-mark">P</span>
        {!collapse ? <span className="sidebar-title">{title}</span> : null}
      </Link>
    </div>
  )
}

export default Logo
