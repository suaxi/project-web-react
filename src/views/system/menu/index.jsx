import { useCallback, useEffect, useState } from 'react'
import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  TreeSelect
} from 'antd'
import { add, childList, del, getMenu, tree, update } from '@/api/system/menu.js'
import { getSidebarIcon, sidebarIconMap } from '@/layout/components/Sidebar/icons.jsx'
import useUserStore from '@/store/user.js'
import './index.scss'

const defaultQueryParams = {
  title: undefined
}

const getDefaultMenuFormValues = () => ({
  id: undefined,
  pid: 0,
  type: 0,
  title: undefined,
  name: undefined,
  component: undefined,
  icon: undefined,
  path: undefined,
  iFrame: false,
  cache: false,
  hidden: false,
  permission: undefined,
  sort: 999
})

const menuTypeOptions = [
  { label: '目录', value: 0 },
  { label: '菜单', value: 1 },
  { label: '按钮', value: 2 }
]

const booleanOptions = [
  { label: '是', value: true },
  { label: '否', value: false }
]

const visibleOptions = [
  { label: '显示', value: false },
  { label: '隐藏', value: true }
]

const iconOptions = Object.keys(sidebarIconMap)
  .sort()
  .map((key) => ({
    value: key,
    label: (
      <Space size={8}>
        <span className="system-menu-icon-option-icon">{getSidebarIcon(key)}</span>
        <span>{key}</span>
      </Space>
    )
  }))

const getRecords = (res) => {
  if (Array.isArray(res?.records)) {
    return res.records
  }

  return Array.isArray(res) ? res : []
}

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return value
}

const getMenuTitle = (item) => item.title || item.label || item.name || item.menuName || '-'

const isTruthy = (value) => value === true || value === 'true' || value === 1 || value === '1'

const normalizeMenuType = (value) => {
  const numberValue = Number(value)

  return Number.isNaN(numberValue) ? 0 : numberValue
}

const toMenuRows = (list = []) =>
  list.map((item) => {
    const children = Array.isArray(item.children) && item.children.length ? toMenuRows(item.children) : undefined
    const isLeaf = item.leaf === true

    return {
      ...item,
      key: item.id,
      displayTitle: getMenuTitle(item),
      isLeaf,
      childrenLoaded: Boolean(children),
      children: children || (isLeaf ? undefined : [])
    }
  })

const updateTreeData = (list, key, children) =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        isLeaf: children.length === 0,
        childrenLoaded: true,
        children: children.length ? children : undefined
      }
    }

    if (node.children?.length) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children)
      }
    }

    return node
  })

const getExpandableKeys = (list = []) =>
  list.reduce((keys, item) => {
    if (!item.isLeaf) {
      keys.push(item.key)
    }

    if (item.children?.length) {
      keys.push(...getExpandableKeys(item.children))
    }

    return keys
  }, [])

const renderBooleanTag = (enabled, trueText = '是', falseText = '否') => (
  <Tag color={enabled ? 'success' : 'default'}>{enabled ? trueText : falseText}</Tag>
)

const toParentMenuTreeNodes = (list = [], disabledId, parentDisabled = false) =>
  list.map((item) => {
    const disabled = parentDisabled || item.id === disabledId
    const children = Array.isArray(item.children) && item.children.length
      ? toParentMenuTreeNodes(item.children, disabledId, disabled)
      : undefined

    return {
      title: getMenuTitle(item),
      value: item.id,
      key: item.id,
      disabled,
      children
    }
  })

function MenuManagement() {
  const [searchForm] = Form.useForm()
  const [menuForm] = Form.useForm()
  const { message, modal } = AntdApp.useApp()
  const menuType = Form.useWatch('type', menuForm) ?? 0
  const permissions = useUserStore((state) => state.permissions)
  const [loading, setLoading] = useState(false)
  const [menuList, setMenuList] = useState([])
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [loadingRowKeys, setLoadingRowKeys] = useState([])
  const [queryParams, setQueryParams] = useState(defaultQueryParams)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增菜单')
  const [editingId, setEditingId] = useState(undefined)
  const [parentMenuTreeData, setParentMenuTreeData] = useState([])
  const [formLoading, setFormLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const hasPermission = (permission) => permissions.includes(permission) || permissions.includes('admin') || permissions.includes('*:*:*')
  const canAdd = hasPermission('menu:add')
  const canEdit = hasPermission('menu:edit')
  const canDel = hasPermission('menu:del')

  const loadRootMenuTree = useCallback(async () => {
    setLoading(true)

    try {
      const res = await childList(0)

      setMenuList(toMenuRows(getRecords(res)))
      setExpandedRowKeys([])
      setQueryParams(defaultQueryParams)
    } catch (error) {
      setMenuList([])
      setExpandedRowKeys([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRootMenuTree()
  }, [loadRootMenuTree])

  const fuzzyQuery = useCallback(
    async (values = searchForm.getFieldsValue()) => {
      const nextParams = {
        title: values.title?.trim() || undefined
      }

      if (!nextParams.title) {
        await loadRootMenuTree()
        return
      }

      setLoading(true)

      try {
        const res = await tree(nextParams)
        const rows = toMenuRows(getRecords(res))

        setMenuList(rows)
        setExpandedRowKeys(getExpandableKeys(rows))
        setQueryParams(nextParams)
      } catch (error) {
        setMenuList([])
        setExpandedRowKeys([])
      } finally {
        setLoading(false)
      }
    },
    [loadRootMenuTree, searchForm]
  )

  const resetQuery = () => {
    searchForm.resetFields()
    loadRootMenuTree()
  }

  const refreshMenuTree = useCallback(() => {
    if (queryParams.title) {
      return fuzzyQuery(queryParams)
    }

    return loadRootMenuTree()
  }, [fuzzyQuery, loadRootMenuTree, queryParams])

  const loadMenuChildren = async (record) => {
    if (record.isLeaf || record.childrenLoaded || loadingRowKeys.includes(record.key)) {
      return
    }

    setLoadingRowKeys((current) => [...current, record.key])

    try {
      const res = await childList(record.id)
      const children = toMenuRows(getRecords(res))

      setMenuList((current) => updateTreeData(current, record.key, children))
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setLoadingRowKeys((current) => current.filter((key) => key !== record.key))
    }
  }

  const handleExpand = (expanded, record) => {
    setExpandedRowKeys((current) => {
      if (expanded) {
        return current.includes(record.key) ? current : [...current, record.key]
      }

      return current.filter((key) => key !== record.key)
    })

    if (expanded) {
      loadMenuChildren(record)
    }
  }

  const handleExpanded = async () => {
    if (expandedRowKeys.length) {
      setExpandedRowKeys([])
      return
    }

    setLoading(true)

    try {
      const res = await tree(queryParams)
      const rows = toMenuRows(getRecords(res))

      setMenuList(rows)
      setExpandedRowKeys(getExpandableKeys(rows))
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setLoading(false)
    }
  }

  const loadParentMenuTree = async (disabledId) => {
    const res = await tree({})

    setParentMenuTreeData([
      {
        title: '根目录',
        value: 0,
        key: 0,
        children: toParentMenuTreeNodes(getRecords(res), disabledId)
      }
    ])
  }

  const handleAdd = async (record) => {
    setFormLoading(true)

    try {
      await loadParentMenuTree()
      setEditingId(undefined)
      setModalTitle('新增菜单')
      menuForm.resetFields()
      menuForm.setFieldsValue({
        ...getDefaultMenuFormValues(),
        pid: record?.id ?? 0
      })
      setModalOpen(true)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (record) => {
    if (!record?.id) {
      message.warning('请选择一条菜单记录')
      return
    }

    setFormLoading(true)

    try {
      const [detail] = await Promise.all([
        getMenu(record.id),
        loadParentMenuTree(record.id)
      ])

      const type = normalizeMenuType(detail.type)

      setEditingId(detail.id)
      setModalTitle('修改菜单')
      menuForm.resetFields()
      menuForm.setFieldsValue({
        ...getDefaultMenuFormValues(),
        id: detail.id,
        pid: detail.pid ?? 0,
        type,
        title: detail.title,
        name: detail.name,
        component: detail.component,
        icon: detail.icon || undefined,
        path: detail.path,
        iFrame: isTruthy(detail.iFrame),
        cache: isTruthy(detail.cache),
        hidden: isTruthy(detail.hidden),
        permission: detail.permission,
        sort: detail.sort ?? 999
      })
      setModalOpen(true)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const submit = async (values) => {
    const type = normalizeMenuType(values.type)
    const submitForm = {
      id: editingId,
      pid: values.pid ?? 0,
      type,
      title: values.title,
      name: type === 1 ? values.name : undefined,
      component: type === 1 ? values.component : undefined,
      icon: type !== 2 ? values.icon : undefined,
      path: type !== 2 ? values.path : undefined,
      iFrame: type !== 2 ? values.iFrame : false,
      cache: type === 1 ? values.cache : false,
      hidden: type !== 2 ? values.hidden : false,
      permission: type !== 0 ? values.permission : undefined,
      sort: values.sort ?? 999
    }

    setSubmitLoading(true)

    try {
      if (editingId !== undefined && editingId !== null) {
        await update(submitForm)
        message.success('修改成功')
      } else {
        await add(submitForm)
        message.success('保存成功')
      }

      message.info('刷新页面或重新登录后动态路由生效')
      setModalOpen(false)
      await refreshMenuTree()
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = (record) => {
    if (!record?.id) {
      message.warning('请选择一条菜单记录')
      return
    }

    modal.confirm({
      title: '警告',
      content: `是否确认删除 ${record.title || record.displayTitle}？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        danger: true
      },
      onOk: async () => {
        setDeleteLoading(true)

        try {
          await del([record.id])
          message.success('删除成功！')
          await refreshMenuTree()
        } catch (error) {
          // Request errors are displayed by the shared request handler.
        } finally {
          setDeleteLoading(false)
        }
      }
    })
  }

  const columns = [
    {
      title: '菜单标题',
      dataIndex: 'displayTitle',
      key: 'title',
      fixed: 'left',
      width: 220,
      ellipsis: true,
      render: (text, record) => (
        <Space size={6}>
          <span>{formatValue(text)}</span>
          {loadingRowKeys.includes(record.key) ? <Spin size="small" /> : null}
        </Space>
      )
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      align: 'center',
      width: 72,
      render: (icon) => <span className="system-menu-icon-cell">{getSidebarIcon(icon) || '-'}</span>
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      align: 'center',
      width: 80,
      render: formatValue
    },
    {
      title: '权限标识',
      dataIndex: 'permission',
      key: 'permission',
      width: 160,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '路由地址',
      dataIndex: 'path',
      key: 'path',
      width: 180,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '组件路径',
      dataIndex: 'component',
      key: 'component',
      width: 220,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '外链',
      dataIndex: 'iFrame',
      key: 'iFrame',
      align: 'center',
      width: 82,
      render: (value) => renderBooleanTag(isTruthy(value))
    },
    {
      title: '缓存',
      dataIndex: 'cache',
      key: 'cache',
      align: 'center',
      width: 82,
      render: (value) => renderBooleanTag(isTruthy(value))
    },
    {
      title: '可见',
      dataIndex: 'hidden',
      key: 'hidden',
      align: 'center',
      width: 82,
      render: (value) => renderBooleanTag(!isTruthy(value))
    },
    {
      title: '创建日期',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      ellipsis: true,
      render: formatValue
    }
  ]

  if (canAdd || canEdit || canDel) {
    columns.push({
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 220,
      render: (_, record) => (
        <Space size={4}>
          {canEdit ? (
            <Button icon={<EditOutlined />} loading={formLoading} onClick={() => handleUpdate(record)} type="link">
              修改
            </Button>
          ) : null}
          {canAdd ? (
            <Button icon={<PlusOutlined />} loading={formLoading} onClick={() => handleAdd(record)} type="link">
              新增
            </Button>
          ) : null}
          {canDel ? (
            <Button danger icon={<DeleteOutlined />} loading={deleteLoading} onClick={() => handleDelete(record)} type="link">
              删除
            </Button>
          ) : null}
        </Space>
      )
    })
  }

  return (
    <div className="system-menu-page">
      <div className="system-menu-table-panel">
        <Form
          className="system-menu-filter-form"
          form={searchForm}
          initialValues={defaultQueryParams}
          layout="inline"
          onFinish={fuzzyQuery}
        >
          <Form.Item label="菜单名称" name="title">
            <Input allowClear placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item className="system-menu-filter-actions">
            <Space>
              <Button htmlType="submit" icon={<SearchOutlined />} type="primary">
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={resetQuery}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div className="system-menu-toolbar">
          <Space wrap>
            {canAdd ? (
              <Button icon={<PlusOutlined />} loading={formLoading} onClick={() => handleAdd()} type="primary">
                新增
              </Button>
            ) : null}
            <Button icon={<ApartmentOutlined />} onClick={handleExpanded}>
              展开/折叠
            </Button>
            <Button icon={<ReloadOutlined />} onClick={refreshMenuTree}>
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={menuList}
          expandable={{
            childrenColumnName: 'children',
            expandedRowKeys,
            indentSize: 18,
            onExpand: handleExpand,
            rowExpandable: (record) => !record.isLeaf
          }}
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1480 }}
        />
      </div>

      <Modal
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnHidden
        okText="确定"
        onCancel={() => setModalOpen(false)}
        onOk={() => menuForm.submit()}
        open={modalOpen}
        title={modalTitle}
        width={720}
      >
        <Spin spinning={formLoading}>
          <Form
            className="system-menu-form"
            form={menuForm}
            initialValues={getDefaultMenuFormValues()}
            onFinish={submit}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="上级菜单" name="pid">
                  <TreeSelect
                    allowClear
                    placeholder="请选择上级菜单"
                    showSearch
                    style={{ width: '100%' }}
                    treeData={parentMenuTreeData}
                    treeDefaultExpandAll
                    treeNodeFilterProp="title"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="菜单类型" name="type" rules={[{ required: true, message: '请选择菜单类型' }]}>
                  <Radio.Group options={menuTypeOptions} />
                </Form.Item>
              </Col>
              {menuType !== 2 ? (
                <Col sm={12} xs={24}>
                  <Form.Item label="菜单图标" name="icon" preserve={false}>
                    <Select
                      allowClear
                      optionFilterProp="value"
                      options={iconOptions}
                      placeholder="请选择图标"
                      showSearch
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              ) : null}
              <Col sm={12} xs={24}>
                <Form.Item
                  label={menuType === 2 ? '按钮名称' : '菜单标题'}
                  name="title"
                  rules={[{ required: true, message: '请输入标题' }]}
                >
                  <Input placeholder="请输入菜单标题" />
                </Form.Item>
              </Col>
              {menuType !== 2 ? (
                <Col sm={12} xs={24}>
                  <Form.Item
                    label="路由地址"
                    name="path"
                    preserve={false}
                    rules={[{ required: true, message: '请输入地址' }]}
                  >
                    <Input placeholder="请输入路由地址" />
                  </Form.Item>
                </Col>
              ) : null}
              {menuType !== 0 ? (
                <Col sm={12} xs={24}>
                  <Form.Item label="权限标识" name="permission" preserve={false}>
                    <Input maxLength={100} placeholder="请输入权限标识" />
                  </Form.Item>
                </Col>
              ) : null}
              {menuType === 1 ? (
                <>
                  <Col sm={12} xs={24}>
                    <Form.Item label="路由名称" name="name" preserve={false}>
                      <Input placeholder="请输入路由名称" />
                    </Form.Item>
                  </Col>
                  <Col sm={12} xs={24}>
                    <Form.Item label="组件路径" name="component" preserve={false}>
                      <Input placeholder="请输入组件路径" />
                    </Form.Item>
                  </Col>
                </>
              ) : null}
              <Col sm={12} xs={24}>
                <Form.Item label="排序" name="sort" rules={[{ required: true, message: '请输入排序' }]}>
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              {menuType !== 2 ? (
                <Col sm={12} xs={24}>
                  <Form.Item label="是否外链" name="iFrame" preserve={false}>
                    <Radio.Group options={booleanOptions} />
                  </Form.Item>
                </Col>
              ) : null}
              {menuType === 1 ? (
                <Col sm={12} xs={24}>
                  <Form.Item label="是否缓存" name="cache" preserve={false}>
                    <Radio.Group options={booleanOptions} />
                  </Form.Item>
                </Col>
              ) : null}
              {menuType !== 2 ? (
                <Col sm={12} xs={24}>
                  <Form.Item label="显示状态" name="hidden" preserve={false}>
                    <Radio.Group options={visibleOptions} />
                  </Form.Item>
                </Col>
              ) : null}
            </Row>
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}

export default MenuManagement
