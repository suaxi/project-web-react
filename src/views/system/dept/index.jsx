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
import { add, childList, del, getDept, tree, update } from '@/api/system/dept.js'
import useUserStore from '@/store/user.js'
import './index.scss'

const defaultQueryParams = {
  name: undefined,
  enabled: undefined
}

const rootDeptValue = {
  value: 0,
  label: '根目录'
}

const getDefaultDeptFormValues = () => ({
  pid: rootDeptValue,
  name: undefined,
  sort: 999,
  enabled: true
})

const statusOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false }
]

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

const getDeptName = (item) => item.name || item.label || item.deptName || '-'

const isEnabled = (value) => value === true || value === 'true' || value === 1 || value === '1'

const hasQuery = (params = {}) => params.name !== undefined || params.enabled !== undefined

const toDeptRows = (list = []) =>
  list.map((item) => {
    const children = Array.isArray(item.children) && item.children.length ? toDeptRows(item.children) : undefined
    const isLeaf = item.leaf === true

    return {
      ...item,
      key: item.id,
      displayName: getDeptName(item),
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

const findDeptRow = (list = [], id) => {
  for (const item of list) {
    if (item.id === id || item.key === id) {
      return item
    }

    const matched = item.children?.length ? findDeptRow(item.children, id) : null

    if (matched) {
      return matched
    }
  }

  return null
}

const getParentDeptValue = (pid, label) => {
  if (pid === undefined || pid === null || pid === 0) {
    return rootDeptValue
  }

  return {
    value: pid,
    label: label || String(pid)
  }
}

const getParentDeptRootNode = () => [
  {
    title: '根目录',
    value: 0,
    key: 0,
    isLeaf: false
  }
]

const toParentDeptTreeNodes = (list = [], disabledId, parentDisabled = false) =>
  list.map((item) => {
    const disabled = parentDisabled || item.id === disabledId
    const children = Array.isArray(item.children) && item.children.length
      ? toParentDeptTreeNodes(item.children, disabledId, disabled)
      : undefined

    return {
      title: getDeptName(item),
      value: item.id,
      key: item.id,
      disabled,
      isLeaf: item.leaf === true,
      children
    }
  })

const updateParentTreeData = (list, key, children) =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        isLeaf: children.length === 0,
        children: children.length ? children : undefined
      }
    }

    if (node.children?.length) {
      return {
        ...node,
        children: updateParentTreeData(node.children, key, children)
      }
    }

    return node
  })

function DeptManagement() {
  const [searchForm] = Form.useForm()
  const [deptForm] = Form.useForm()
  const { message, modal } = AntdApp.useApp()
  const permissions = useUserStore((state) => state.permissions)
  const [loading, setLoading] = useState(false)
  const [deptList, setDeptList] = useState([])
  const [expandedRowKeys, setExpandedRowKeys] = useState([])
  const [loadingRowKeys, setLoadingRowKeys] = useState([])
  const [queryParams, setQueryParams] = useState(defaultQueryParams)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增部门')
  const [editingId, setEditingId] = useState(undefined)
  const [parentDeptTreeData, setParentDeptTreeData] = useState(getParentDeptRootNode)
  const [parentDisabledId, setParentDisabledId] = useState(undefined)
  const [formLoading, setFormLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const hasPermission = (permission) => permissions.includes(permission) || permissions.includes('admin') || permissions.includes('*:*:*')
  const canAdd = hasPermission('dept:add')
  const canEdit = hasPermission('dept:edit')
  const canDel = hasPermission('dept:del')

  const loadRootDeptTree = useCallback(async () => {
    setLoading(true)

    try {
      const res = await childList(0)

      setDeptList(toDeptRows(getRecords(res)))
      setExpandedRowKeys([])
      setQueryParams(defaultQueryParams)
    } catch (error) {
      setDeptList([])
      setExpandedRowKeys([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRootDeptTree()
  }, [loadRootDeptTree])

  const fuzzyQuery = useCallback(
    async (values = searchForm.getFieldsValue()) => {
      const nextParams = {
        name: values.name?.trim() || undefined,
        enabled: values.enabled
      }

      if (!hasQuery(nextParams)) {
        await loadRootDeptTree()
        return
      }

      setLoading(true)

      try {
        const res = await tree(nextParams)
        const rows = toDeptRows(getRecords(res))

        setDeptList(rows)
        setExpandedRowKeys(getExpandableKeys(rows))
        setQueryParams(nextParams)
      } catch (error) {
        setDeptList([])
        setExpandedRowKeys([])
      } finally {
        setLoading(false)
      }
    },
    [loadRootDeptTree, searchForm]
  )

  const resetQuery = () => {
    searchForm.resetFields()
    loadRootDeptTree()
  }

  const refreshDeptTree = useCallback(() => {
    if (hasQuery(queryParams)) {
      return fuzzyQuery(queryParams)
    }

    return loadRootDeptTree()
  }, [fuzzyQuery, loadRootDeptTree, queryParams])

  const refreshWholeDeptTree = useCallback(async () => {
    setLoading(true)

    try {
      const res = await tree(queryParams)
      const rows = toDeptRows(getRecords(res))

      setDeptList(rows)
      setExpandedRowKeys(getExpandableKeys(rows))
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setLoading(false)
    }
  }, [queryParams])

  const loadDeptChildren = async (record) => {
    if (record.isLeaf || record.childrenLoaded || loadingRowKeys.includes(record.key)) {
      return
    }

    setLoadingRowKeys((current) => [...current, record.key])

    try {
      const res = await childList(record.id)
      const children = toDeptRows(getRecords(res))

      setDeptList((current) => updateTreeData(current, record.key, children))
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
      loadDeptChildren(record)
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
      const rows = toDeptRows(getRecords(res))

      setDeptList(rows)
      setExpandedRowKeys(getExpandableKeys(rows))
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setLoading(false)
    }
  }

  const loadParentDeptTree = useCallback(
    async (node) => {
      if (node.isLeaf || node.children) {
        return
      }

      const res = await childList(node.value ?? 0)
      const children = toParentDeptTreeNodes(getRecords(res), parentDisabledId)

      setParentDeptTreeData((current) => updateParentTreeData(current, node.key, children))
    },
    [parentDisabledId]
  )

  const handleAdd = (record) => {
    setFormLoading(true)
    setParentDisabledId(undefined)
    setParentDeptTreeData(getParentDeptRootNode())
    setEditingId(undefined)
    setModalTitle('新增部门')
    deptForm.resetFields()
    deptForm.setFieldsValue({
      ...getDefaultDeptFormValues(),
      pid: record?.id ? getParentDeptValue(record.id, record.displayName) : rootDeptValue
    })
    setModalOpen(true)
    setFormLoading(false)
  }

  const handleUpdate = async (record) => {
    if (!record?.id) {
      message.warning('请选择一条部门记录')
      return
    }

    setFormLoading(true)

    try {
      const detail = await getDept(record.id)
      const parentRow = findDeptRow(deptList, detail.pid)

      setParentDisabledId(detail.id)
      setParentDeptTreeData(getParentDeptRootNode())
      setEditingId(detail.id)
      setModalTitle('修改部门')
      deptForm.resetFields()
      deptForm.setFieldsValue({
        ...getDefaultDeptFormValues(),
        pid: getParentDeptValue(detail.pid, parentRow?.displayName),
        name: detail.name,
        sort: detail.sort ?? 999,
        enabled: detail.enabled ?? true
      })
      setModalOpen(true)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const submit = async (values) => {
    const pidValue = values.pid?.value ?? values.pid
    const submitForm = {
      id: editingId,
      pid: pidValue === undefined || pidValue === null ? 0 : pidValue,
      name: values.name?.trim(),
      sort: values.sort ?? 999,
      enabled: values.enabled
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
      await refreshWholeDeptTree()
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = (record) => {
    if (!record?.id) {
      message.warning('请选择一条部门记录')
      return
    }

    modal.confirm({
      title: '警告',
      content: `是否确认删除 ${record.name || record.displayName}？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: {
        danger: true
      },
      onOk: async () => {
        setDeleteLoading(true)

        try {
          await del([record.id])
          message.success('删除成功')
          await refreshWholeDeptTree()
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
      title: '部门名称',
      dataIndex: 'displayName',
      key: 'name',
      fixed: 'left',
      width: 260,
      ellipsis: true,
      render: (text, record) => (
        <Space size={6}>
          <span>{formatValue(text)}</span>
          {loadingRowKeys.includes(record.key) ? <Spin size="small" /> : null}
        </Space>
      )
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      align: 'center',
      width: 100,
      render: formatValue
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      align: 'center',
      width: 100,
      render: (value) => (
        <Tag color={isEnabled(value) ? 'success' : 'default'}>
          {isEnabled(value) ? '启用' : '禁用'}
        </Tag>
      )
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
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleteLoading}
              onClick={() => handleDelete(record)}
              type="link"
            >
              删除
            </Button>
          ) : null}
        </Space>
      )
    })
  }

  return (
    <main className="system-dept-page">
      <section className="system-dept-table-panel">
        <Form
          className="system-dept-filter-form"
          form={searchForm}
          initialValues={defaultQueryParams}
          layout="inline"
          onFinish={fuzzyQuery}
        >
          <Form.Item label="部门名称" name="name">
            <Input allowClear placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item label="状态" name="enabled">
            <Select allowClear options={statusOptions} placeholder="状态" />
          </Form.Item>
          <Form.Item className="system-dept-filter-actions">
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

        <div className="system-dept-toolbar">
          <Space wrap>
            {canAdd ? (
              <Button icon={<PlusOutlined />} loading={formLoading} onClick={() => handleAdd()} type="primary">
                新增
              </Button>
            ) : null}
            <Button icon={<ApartmentOutlined />} onClick={handleExpanded}>
              展开/折叠
            </Button>
            <Button icon={<ReloadOutlined />} onClick={refreshDeptTree}>
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={deptList}
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
          scroll={{ x: canAdd || canEdit || canDel ? 990 : 770 }}
        />
      </section>

      <Modal
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnHidden
        okText="确定"
        onCancel={() => setModalOpen(false)}
        onOk={() => deptForm.submit()}
        open={modalOpen}
        title={modalTitle}
        width={600}
      >
        <Spin spinning={formLoading}>
          <Form
            className="system-dept-form"
            disabled={submitLoading}
            form={deptForm}
            initialValues={getDefaultDeptFormValues()}
            labelCol={{ flex: '78px' }}
            labelWrap
            layout="horizontal"
            onFinish={submit}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="上级部门" name="pid">
                  <TreeSelect
                    allowClear
                    labelInValue
                    loadData={loadParentDeptTree}
                    placeholder="请选择上级部门"
                    treeData={parentDeptTreeData}
                  />
                </Form.Item>
              </Col>
              <Col sm={12} xs={24}>
                <Form.Item
                  label="部门名称"
                  name="name"
                  rules={[{ required: true, message: '请输入部门名称' }]}
                >
                  <Input autoComplete="off" placeholder="请输入部门名称" />
                </Form.Item>
              </Col>
              <Col sm={12} xs={24}>
                <Form.Item label="排序" name="sort">
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              <Col sm={12} xs={24}>
                <Form.Item label="状态" name="enabled">
                  <Radio.Group options={statusOptions} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </main>
  )
}

export default DeptManagement
