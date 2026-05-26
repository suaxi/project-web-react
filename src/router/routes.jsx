import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'

const Layout = lazy(() => import('@/layout/index.jsx'))

const lazyElement = (loader) => {
  const Component = lazy(loader)
  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  )
}

export const layoutRoutes = [
  {
    path: 'index',
    element: lazyElement(() => import('@/views/dashboard/index.jsx')),
    meta: {
      title: '首页',
      icon: 'dashboard',
      hidden: false,
      affix: true,
      noCache: false,
      activeMenu: '',
      link: '',
      alwaysShow: false,
      query: null
    }
  }
]

export const constantRoutes = [
  {
    path: '/',
    element: (
      <Suspense fallback={null}>
        <Layout />
      </Suspense>
    ),
    hidden: true,
    meta: {
      title: 'Root',
      hidden: true
    },
    children: [
      {
        index: true,
        element: <Navigate to="/index" replace />,
        hidden: true,
        meta: {
          title: 'Root Redirect',
          hidden: true,
          noCache: true
        }
      },
      {
        path: 'redirect/*',
        element: lazyElement(() => import('@/views/redirect/index.jsx')),
        hidden: true,
        meta: {
          title: 'Redirect',
          hidden: true,
          noCache: true
        }
      },
      ...layoutRoutes,
      {
        path: 'user/profile',
        element: lazyElement(() => import('@/views/user/profile.jsx')),
        hidden: true,
        meta: {
          title: '个人中心',
          hidden: true,
          noCache: true
        }
      },
      {
        path: '404',
        element: lazyElement(() => import('@/views/error/404.jsx')),
        hidden: true,
        meta: {
          title: '404',
          hidden: true,
          noCache: true
        }
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
        hidden: true,
        meta: {
          title: 'Not Found Redirect',
          hidden: true,
          noCache: true
        }
      }
    ]
  }
]

export default constantRoutes
