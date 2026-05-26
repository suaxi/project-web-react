import { Navigate, useLocation, useParams } from 'react-router-dom'

function Redirect() {
  const params = useParams()
  const location = useLocation()
  const targetPath = `/${params['*'] || ''}`.replace(/\/+/g, '/') || '/'

  return <Navigate to={`${targetPath}${location.search}${location.hash}`} replace />
}

export default Redirect
