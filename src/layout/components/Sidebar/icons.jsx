import {
  AppstoreOutlined,
  ApartmentOutlined,
  BookOutlined,
  DashboardOutlined,
  DesktopOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  MenuOutlined,
  MonitorOutlined,
  SettingOutlined,
  TableOutlined,
  ToolOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined
} from '@ant-design/icons'

export const sidebarIconMap = {
  dashboard: <DashboardOutlined />,
  dict: <BookOutlined />,
  desktop: <DesktopOutlined />,
  link: <LinkOutlined />,
  list: <UnorderedListOutlined />,
  log: <FileTextOutlined />,
  menu: <MenuOutlined />,
  monitor: <MonitorOutlined />,
  peoples: <TeamOutlined />,
  role: <TeamOutlined />,
  setting: <SettingOutlined />,
  system: <SettingOutlined />,
  tool: <ToolOutlined />,
  tree: <ApartmentOutlined />,
  'tree-table': <TableOutlined />,
  user: <UserOutlined />,
  folder: <FolderOpenOutlined />,
  app: <AppstoreOutlined />
}

export const getSidebarIcon = (icon) => {
  if (!icon || icon === '#') {
    return null
  }

  return sidebarIconMap[icon] || <AppstoreOutlined />
}
