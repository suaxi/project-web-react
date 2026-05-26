const settings = {
  title: import.meta.env.VITE_APP_TITLE || 'Project Web React',
  baseApi: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 30000,
  tokenKey: 'token',
  tokenExpires: 1
}

export default settings
