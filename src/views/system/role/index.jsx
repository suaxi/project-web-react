import { useCallback, useEffect, useState } from 'react'
import {
  CheckOutlined,
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
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tree,
  TreeSelect
} from 'antd'
import { getDeptTree } from '@/api/system/dept.js'
import { getMenuChildList, getMenuList } from '@/api/system/menu.js'
import { add, del, getRole, page, update, updateRoleMenu } from '@/api/system/role.js'
import useUserStore from '@/store/user.js'
import './index.scss'

const defaultQueryParams = {
  pageNum: 1,
  pageSize: 10,
  name: undefined,
  dataScope: undefined
}

const dataScopeOptions = ['全部', '本级', '自定义'].map((item) => ({
  label: item,
  value: item
}))

const getDefaultRoleFormValues = () => ({
  name: undefined,
  level: undefined,
  dataScope: undefined,
  depts: [],
  description: undefined
})

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return value
}

const getRecords = (res) => {
  if (Array.isArray(res?.records)) {
    return res.records
  }

  return Array.isArray(res) ? res : []
}

const toDeptTreeNodes = (list = []) =>
  list.map((item) => ({
    title: item.label || item.name || item.deptName || '-',
    value: item.id,
    key: item.id,
    raw: item,
    children: Array.isArray(item.children) ? toDeptTreeNodes(item.children) : undefined
  }))

const toMenuTreeNodes = (list = []) =>
  list.map((item) => ({
    title: item.label || item.title || item.name || item.menuName || '-',
    key: item.id,
    id: item.id,
    isLeaf: item.leaf === true,
    raw: item,
    children: Array.isArray(item.children) && item.children.length ? toMenuTreeNodes(item.children) : undefined
  }))

const updateTreeData = (list, key, children) =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        children
      }
    }

    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children)
      }
    }

    return node
  })

const getIdList = (list) => {
  if (!Array.isArray(list)) {
    return []
  }

  return list
    .map((item) => item?.id)
    .filter((id) => id !== undefined && id !== null && id !== '')
}

const getRoleMenuIds = (role) => {
  if (!Array.isArray(role?.menus)) {
    return []
  }

  return role.menus
    .map((item) => item?.id)
    .filter((id) => id !== undefined && id !== null && id !== '')
}

function RoleManagement() {
  const [searchForm] = Form.useForm()
  const [roleForm] = Form.useForm()
  const { message, modal } = AntdApp.useApp()
  const dataScope = Form.useWatch('dataScope', roleForm)
  const permissions = useUserStore((state) => state.permissions)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [queryParams, setQueryParams] = useState(defaultQueryParams)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [currentRole, setCurrentRole] = useState(null)
  const [currentRoleMenuIds, setCurrentRoleMenuIds] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增角色')
  const [editingId, setEditingId] = useState(undefined)
  const [formLoading, setFormLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deptTreeData, setDeptTreeData] = useState([])
  const [menuTreeData, setMenuTreeData] = useState([])
  const [expandedMenuKeys, setExpandedMenuKeys] = useState([])
  const [menuTreeLoading, setMenuTreeLoading] = useState(false)
  const [menuLoading, setMenuLoading] = useState(false)
  const hasPermission = (permission) => permissions.includes(permission) || permissions.includes('admin') || permissions.includes('*:*:*')
  const canAdd = hasPermission('roles:add')
  const canEdit = hasPermission('roles:edit')
  const canDel = hasPermission('roles:del')
  const canRoleMenuEdit = hasPermission('role-menu:edit')

  const queryPage = useCallback(async (params = defaultQueryParams) => {
    const nextParams = {
      ...defaultQueryParams,
      ...params
    }

    setLoading(true)

    try {
      const res = await page(nextParams)

      setRecords(getRecords(res))
      setTotal(Number(res?.total) || 0)
      setQueryParams(nextParams)
      setSelectedRowKeys([])
      setSelectedRows([])
      setCurrentRole(null)
      setCurrentRoleMenuIds([])
      setExpandedMenuKeys([])
    } catch (error) {
      setRecords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queryPage(defaultQueryParams)
  }, [queryPage])

  const loadRootMenuTree = useCallback(async () => {
    setMenuTreeLoading(true)

    try {
      const res = await getMenuChildList(0)

      setMenuTreeData(toMenuTreeNodes(getRecords(res)))
      setExpandedMenuKeys([])
    } catch (error) {
      setMenuTreeData([])
      setExpandedMenuKeys([])
    } finally {
      setMenuTreeLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRootMenuTree()
  }, [loadRootMenuTree])

  const loadDeptTree = async () => {
    const res = await getDeptTree({})

    setDeptTreeData(toDeptTreeNodes(getRecords(res)))
  }

  const loadMenuTree = async (node) => {
    if (node.isLeaf || node.children) {
      return
    }

    const res = await getMenuChildList(node.key)

    setMenuTreeData((current) => updateTreeData(current, node.key, toMenuTreeNodes(getRecords(res))))
  }

  const handleAdd = async () => {
    setFormLoading(true)

    try {
      await loadDeptTree()
      setEditingId(undefined)
      setModalTitle('新增角色')
      roleForm.resetFields()
      roleForm.setFieldsValue(getDefaultRoleFormValues())
      setModalOpen(true)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (record) => {
    const target = record || selectedRows[0]

    if (!target || target.id === undefined || target.id === null) {
      message.warning('请选择一条角色记录')
      return
    }

    setFormLoading(true)

    try {
      const [detail] = await Promise.all([
        getRole(target.id),
        loadDeptTree()
      ])

      setEditingId(detail.id)
      setModalTitle('修改角色')
      roleForm.resetFields()
      roleForm.setFieldsValue({
        ...getDefaultRoleFormValues(),
        name: detail.name,
        level: detail.level,
        dataScope: detail.dataScope,
        depts: getIdList(detail.depts),
        description: detail.description
      })
      setModalOpen(true)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const submit = async (values) => {
    const deptIds = Array.isArray(values.depts) ? values.depts : []

    if (values.dataScope === '自定义' && deptIds.length === 0) {
      message.warning('自定义数据权限不能为空！')
      return
    }

    const submitForm = {
      id: editingId,
      name: values.name,
      level: values.level,
      dataScope: values.dataScope,
      description: values.description,
      depts: values.dataScope === '自定义' ? deptIds.map((id) => ({ id })) : []
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

      setModalOpen(false)
      await queryPage(queryParams)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleMenuCheck = async (_, info) => {
    if (!currentRole) {
      return
    }

    const menuId = info.node.id ?? info.node.key
    const res = await getMenuList(menuId)
    const menuIds = getIdList(getRecords(res))

    setCurrentRoleMenuIds((current) => {
      const menuIdSet = new Set(menuIds)

      if (current.includes(menuId)) {
        return current.filter((id) => !menuIdSet.has(id))
      }

      const nextIds = new Set(current)
      menuIds.forEach((id) => nextIds.add(id))

      return Array.from(nextIds)
    })
  }

  const refreshCurrentRole = async (roleId) => {
    const detail = await getRole(roleId)
    const nextMenuIds = getRoleMenuIds(detail)

    setCurrentRole(detail)
    setCurrentRoleMenuIds(nextMenuIds)
    setRecords((current) => current.map((item) => (item.id === roleId ? { ...item, ...detail } : item)))
  }

  const saveRoleMenu = async () => {
    if (currentRole?.id === undefined || currentRole?.id === null) {
      return
    }

    const role = {
      id: currentRole.id,
      menus: currentRoleMenuIds.map((id) => ({ id }))
    }

    setMenuLoading(true)

    try {
      await updateRoleMenu(role)
      message.success('保存成功')
      await refreshCurrentRole(currentRole.id)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setMenuLoading(false)
    }
  }

  const handleDelete = (record) => {
    const targets = record ? [record] : selectedRows
    const ids = targets.map((item) => item.id).filter((id) => id !== undefined && id !== null)

    if (!ids.length) {
      message.warning('请选择要删除的角色！')
      return
    }

    modal.confirm({
      title: '警告',
      content: '是否确认删除？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        danger: true
      },
      onOk: async () => {
        setDeleteLoading(true)

        try {
          await del(ids)
          message.success('删除成功')
          await queryPage(queryParams)
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
      title: '名称',
      dataIndex: 'name',
      fixed: 'left',
      width: 150,
      render: formatValue
    },
    {
      title: '数据权限',
      dataIndex: 'dataScope',
      width: 120,
      render: formatValue
    },
    {
      title: '角色级别',
      dataIndex: 'level',
      width: 120,
      render: formatValue
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: formatValue
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      ellipsis: true,
      render: formatValue
    }
  ]

  if (canEdit || canDel) {
    columns.push({
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          {canEdit ? (
            <Button
              icon={<EditOutlined />}
              loading={formLoading}
              onClick={(event) => {
                event.stopPropagation()
                handleUpdate(record)
              }}
              size="small"
              type="link"
            >
              修改
            </Button>
          ) : null}
          {canDel ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleteLoading}
              onClick={(event) => {
                event.stopPropagation()
                handleDelete(record)
              }}
              size="small"
              type="link"
            >
              删除
            </Button>
          ) : null}
        </Space>
      )
    })
  }

  const handleTableChange = (pagination) => {
    queryPage({
      ...queryParams,
      pageNum: pagination.current || defaultQueryParams.pageNum,
      pageSize: pagination.pageSize || defaultQueryParams.pageSize
    })
  }

  const handleCurrentChange = (record) => {
    setCurrentRole(record)
    setCurrentRoleMenuIds(getRoleMenuIds(record))
  }

  const handleSelectionChange = (keys, rows) => {
    setSelectedRowKeys(keys)
    setSelectedRows(rows)
  }

  const resetQuery = () => {
    searchForm.resetFields()
    queryPage(defaultQueryParams)
  }

  return (
    <main className="system-role-page">
      <section className="system-role-toolbar">
        <Form
          className="system-role-filter-form"
          form={searchForm}
          initialValues={{
            name: undefined,
            dataScope: undefined
          }}
          layout="inline"
          onFinish={(values) => {
            const name = values.name?.trim()

            queryPage({
              ...queryParams,
              pageNum: 1,
              name: name || undefined,
              dataScope: values.dataScope
            })
          }}
        >
          <Form.Item label="角色名称" name="name">
            <Input allowClear placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item label="权限范围" name="dataScope">
            <Select allowClear options={dataScopeOptions} placeholder="权限范围" />
          </Form.Item>

          <Form.Item className="system-role-filter-actions">
            <Space size={8}>
              <Button htmlType="submit" icon={<SearchOutlined />} type="primary">
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={resetQuery}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </section>

      <section className="system-role-main">
        <section className="system-role-table-panel">
          <div className="system-role-panel-header">
            <span className="system-role-panel-title">角色列表</span>
            <span className="system-role-selection-count">已选 {selectedRows.length} 项</span>
          </div>

          {canAdd || canEdit || canDel ? (
            <div className="system-role-table-actions">
              <Space size={8}>
                {canAdd ? (
                  <Button icon={<PlusOutlined />} loading={formLoading} onClick={handleAdd} type="primary">
                    新增
                  </Button>
                ) : null}
                {canEdit ? (
                  <Button
                    disabled={selectedRowKeys.length !== 1}
                    icon={<EditOutlined />}
                    loading={formLoading}
                    onClick={() => handleUpdate()}
                  >
                    修改
                  </Button>
                ) : null}
                {canDel ? (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteLoading}
                    onClick={() => handleDelete()}
                  >
                    删除
                  </Button>
                ) : null}
              </Space>
            </div>
          ) : null}

          <Table
            columns={columns}
            dataSource={records}
            loading={loading}
            onChange={handleTableChange}
            onRow={(record) => ({
              onClick: () => handleCurrentChange(record)
            })}
            pagination={{
              current: queryParams.pageNum,
              pageSize: queryParams.pageSize,
              pageSizeOptions: ['10', '20', '30', '50'],
              showSizeChanger: true,
              showTotal: (value) => `共 ${value} 条`,
              total
            }}
            rowClassName={(record) => (record.id === currentRole?.id ? 'system-role-current-row' : '')}
            rowKey={(record) => record.id ?? record.name}
            rowSelection={{
              selectedRowKeys,
              onChange: handleSelectionChange
            }}
            scroll={{ x: 960 }}
          />
        </section>

        <aside className="system-role-menu-panel">
          <div className="system-role-panel-header">
            <span className="system-role-panel-title">菜单分配</span>
            {canRoleMenuEdit ? (
              <Button
                disabled={!currentRole}
                icon={<CheckOutlined />}
                loading={menuLoading}
                onClick={saveRoleMenu}
                size="small"
                type="primary"
              >
                保存
              </Button>
            ) : null}
          </div>

          <Spin spinning={menuTreeLoading}>
            {menuTreeData.length ? (
              <Tree
                blockNode
                checkStrictly
                checkable
                checkedKeys={{ checked: currentRoleMenuIds, halfChecked: [] }}
                className="system-role-menu-tree"
                disabled={!currentRole}
                expandedKeys={expandedMenuKeys}
                loadData={loadMenuTree}
                onCheck={handleMenuCheck}
                onExpand={(keys) => setExpandedMenuKeys(keys)}
                selectable={false}
                treeData={menuTreeData}
              />
            ) : (
              <Empty className="system-role-empty" description="暂无菜单数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Spin>
        </aside>
      </section>

      <Modal
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnHidden
        okText="确定"
        onCancel={() => setModalOpen(false)}
        onOk={() => roleForm.submit()}
        open={modalOpen}
        title={modalTitle}
        width={640}
      >
        <Form
          className="system-role-form"
          disabled={submitLoading}
          form={roleForm}
          initialValues={getDefaultRoleFormValues()}
          labelCol={{ flex: '78px' }}
          labelWrap
          layout="horizontal"
          onFinish={submit}
        >
          <Row gutter={16}>
            <Col sm={12} xs={24}>
              <Form.Item
                label="角色名称"
                name="name"
                rules={[
                  { required: true, message: '请输入角色名称' },
                  { min: 3, max: 10, message: '长度在 3 到 10 个字符' }
                ]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </Col>

            <Col sm={12} xs={24}>
              <Form.Item label="角色级别" name="level">
                <InputNumber min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col sm={12} xs={24}>
              <Form.Item
                label="数据范围"
                name="dataScope"
                rules={[{ required: true, message: '请选择数据范围' }]}
              >
                <Select
                  options={dataScopeOptions}
                  placeholder="请选择数据范围"
                  onChange={(value) => {
                    if (value !== '自定义') {
                      roleForm.setFieldValue('depts', [])
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col sm={12} xs={24}>
              {dataScope === '自定义' ? (
                <Form.Item label="数据权限" name="depts">
                  <TreeSelect
                    allowClear
                    maxTagCount="responsive"
                    multiple
                    placeholder="请选择部门"
                    treeCheckable
                    treeData={deptTreeData}
                  />
                </Form.Item>
              ) : null}
            </Col>
          </Row>

          <Form.Item label="描述信息" name="description">
            <Input.TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}

export default RoleManagement
