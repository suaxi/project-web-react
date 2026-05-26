import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Dropdown } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import usePermissionStore from '@/store/permission.js'
import useSettingsStore from '@/store/settings.js'
import useTagsViewStore from '@/store/tagsView.js'
import './index.scss'

function TagsView() {
  const location = useLocation()
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const routes = usePermissionStore((state) => state.routes)
  const visitedViews = useTagsViewStore((state) => state.visitedViews)
  const addView = useTagsViewStore((state) => state.addView)
  const addVisitedView = useTagsViewStore((state) => state.addVisitedView)
  const updateVisitedView = useTagsViewStore((state) => state.updateVisitedView)
  const delView = useTagsViewStore((state) => state.delView)
  const delOthersViews = useTagsViewStore((state) => state.delOthersViews)
  const delAllViews = useTagsViewStore((state) => state.delAllViews)
  const delLeftTags = useTagsViewStore((state) => state.delLeftTags)
  const delRightTags = useTagsViewStore((state) => state.delRightTags)
  const theme = useSettingsStore((state) => state.theme)

  const routeRecords = useMemo(() => {
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
    const records = []
    const walk = (items = [], basePath = '/') => {
      items.forEach((route) => {
        if (route.path === '*') {
          return
        }

        const fullPath = route.index ? normalizePath(basePath) : resolvePath(basePath, route.path)
        records.push({ ...route, fullPath })

        if (route.children?.length) {
          walk(route.children, fullPath)
        }
      })
    }

    walk(routes)
    return records
  }, [routes])

  const affixTags = useMemo(
    () =>
      routeRecords
        .filter((route) => route.meta?.affix)
        .map((route) => ({
          path: route.fullPath,
          fullPath: route.fullPath,
          name: route.name || route.path,
          title: route.meta.title,
          meta: route.meta
        })),
    [routeRecords]
  )

  useEffect(() => {
    affixTags.forEach((tag) => addVisitedView(tag))
  }, [addVisitedView, affixTags])

  useEffect(() => {
    const route = routeRecords.find((item) => item.fullPath === location.pathname)
    if (!route?.meta?.title || route.fullPath === '/404' || route.fullPath.startsWith('/redirect')) {
      return
    }

    const currentView = {
      path: route.fullPath,
      fullPath: `${location.pathname}${location.search}${location.hash}`,
      name: route.name || route.path,
      title: route.meta.title,
      meta: route.meta,
      query: Object.fromEntries(new URLSearchParams(location.search))
    }

    if (useTagsViewStore.getState().visitedViews.some((item) => item.path === currentView.path)) {
      updateVisitedView(currentView)
      return
    }

    addView(currentView)
  }, [addView, location.hash, location.pathname, location.search, routeRecords, updateVisitedView])

  useEffect(() => {
    const scrollContainer = scrollRef.current
    const activeTag = scrollContainer?.querySelector('.tags-view-item.active')

    if (!scrollContainer || !activeTag) {
      return
    }

    const containerRect = scrollContainer.getBoundingClientRect()
    const activeRect = activeTag.getBoundingClientRect()

    if (activeRect.left < containerRect.left) {
      scrollContainer.scrollLeft -= containerRect.left - activeRect.left + 16
    } else if (activeRect.right > containerRect.right) {
      scrollContainer.scrollLeft += activeRect.right - containerRect.right + 16
    }
  }, [location.pathname, visitedViews])

  const isActive = (tag) => tag.path === location.pathname
  const isAffix = (tag) => Boolean(tag.meta?.affix)
  const getLatestView = () => useTagsViewStore.getState().visitedViews.slice(-1)[0]
  const toLastView = () => {
    const latestView = getLatestView()
    navigate(latestView?.fullPath || latestView?.path || '/index', { replace: true })
  }

  const closeSelectedTag = (tag) => {
    if (isAffix(tag)) {
      return
    }

    delView(tag)

    if (isActive(tag)) {
      toLastView()
    }
  }

  const refreshSelectedTag = (tag) => {
    navigate(`/redirect${tag.fullPath || tag.path}`)
  }

  const closeOthersTags = (tag) => {
    delOthersViews(tag)
    navigate(tag.fullPath || tag.path, { replace: true })
  }

  const closeLeftSelectedTags = (tag) => {
    delLeftTags(tag)
    if (!useTagsViewStore.getState().visitedViews.some((item) => item.path === location.pathname)) {
      toLastView()
    }
  }

  const closeRightSelectedTags = (tag) => {
    delRightTags(tag)
    if (!useTagsViewStore.getState().visitedViews.some((item) => item.path === location.pathname)) {
      toLastView()
    }
  }

  const closeAllTags = () => {
    delAllViews()
    if (!useTagsViewStore.getState().visitedViews.some((item) => item.path === location.pathname)) {
      toLastView()
    }
  }

  const getMenuItems = (tag) => {
    const currentIndex = visitedViews.findIndex((item) => item.path === tag.path)
    const hasLeftClosable = visitedViews.slice(0, currentIndex).some((item) => !isAffix(item))
    const hasRightClosable = visitedViews.slice(currentIndex + 1).some((item) => !isAffix(item))

    return [
      {
        key: 'refresh',
        icon: <ReloadOutlined />,
        label: '刷新页面'
      },
      !isAffix(tag)
        ? {
            key: 'close',
            icon: <CloseOutlined />,
            label: '关闭当前'
          }
        : null,
      {
        key: 'others',
        icon: <CloseCircleOutlined />,
        label: '关闭其他'
      },
      hasLeftClosable
        ? {
            key: 'left',
            icon: <ArrowLeftOutlined />,
            label: '关闭左侧'
          }
        : null,
      hasRightClosable
        ? {
            key: 'right',
            icon: <ArrowRightOutlined />,
            label: '关闭右侧'
          }
        : null,
      {
        key: 'all',
        icon: <CloseCircleOutlined />,
        label: '全部关闭'
      }
    ].filter(Boolean)
  }

  const handleMenuClick = (key, tag) => {
    if (key === 'refresh') {
      refreshSelectedTag(tag)
    } else if (key === 'close') {
      closeSelectedTag(tag)
    } else if (key === 'others') {
      closeOthersTags(tag)
    } else if (key === 'left') {
      closeLeftSelectedTags(tag)
    } else if (key === 'right') {
      closeRightSelectedTags(tag)
    } else if (key === 'all') {
      closeAllTags()
    }
  }

  const handleWheel = (event) => {
    if (!scrollRef.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return
    }

    event.preventDefault()
    scrollRef.current.scrollLeft += event.deltaY
  }

  return (
    <div className="tags-view-container">
      <div className="tags-view-wrapper" onWheel={handleWheel} ref={scrollRef}>
        {visitedViews.map((tag) => (
          <Dropdown
            key={tag.path}
            menu={{
              items: getMenuItems(tag),
              onClick: ({ key, domEvent }) => {
                domEvent.preventDefault()
                handleMenuClick(key, tag)
              }
            }}
            trigger={['contextMenu']}
          >
            <Link
              className={`tags-view-item${isActive(tag) ? ' active' : ''}`}
              data-path={tag.path}
              onAuxClick={(event) => {
                if (event.button === 1) {
                  event.preventDefault()
                  closeSelectedTag(tag)
                }
              }}
              style={isActive(tag) ? { backgroundColor: theme, borderColor: theme } : null}
              to={tag.fullPath || tag.path}
            >
              <span className="tag-title">{tag.title}</span>
              {!isAffix(tag) ? (
                <span
                  className="tag-close"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    closeSelectedTag(tag)
                  }}
                  role="button"
                  tabIndex={-1}
                >
                  <CloseOutlined />
                </span>
              ) : null}
            </Link>
          </Dropdown>
        ))}
      </div>
    </div>
  )
}

export default TagsView
