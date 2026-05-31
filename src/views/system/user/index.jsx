import { useCallback, useEffect, useState } from 'react'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Col, Form, Input, Modal, Radio, Row, Select, Space, Table, Tag, TreeSelect } from 'antd'
import { getDeptChildList } from '@/api/system/dept.js'
import { getJobList } from '@/api/system/job.js'
import { list as listRoles } from '@/api/system/role.js'
import { add, del, getUser, page, update } from '@/api/system/user.js'
import useUserStore from '@/store/user.js'
import './index.scss'

const defaultQueryParams = {
  pageNum: 1,
  pageSize: 10,
  username: undefined,
  enabled: undefined
}

const getDefaultUserFormValues = () => ({
  deptId: undefined,
  deptName: undefined,
  username: undefined,
  nickName: undefined,
  sex: '男',
  phone: undefined,
  email: undefined,
  enabled: true,
  jobIds: [],
  roleIds: []
})

const statusOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false }
]

const sexOptions = [
  { label: '男', value: '男' },
  { label: '女', value: '女' }
]

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return value
}

const isEnabled = (value) => value === true || value === 'true'

const getListData = (res) => {
  if (Array.isArray(res?.records)) {
    return res.records
  }

  return Array.isArray(res) ? res : []
}

const normalizeId = (value) => {
  const numberValue = Number(value)

  return Number.isNaN(numberValue) ? value : numberValue
}

const parseIdList = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined && item !== null && item !== '').map(normalizeId)
  }

  if (value === undefined || value === null || value === '') {
    return []
  }

  return String(value)
    .split(',')
    .filter(Boolean)
    .map(normalizeId)
}

const toDeptTreeNodes = (list = []) =>
  list.map((item) => ({
    title: item.label || item.name || item.deptName || '-',
    value: item.id,
    key: item.id,
    isLeaf: item.leaf === true,
    raw: item,
    children: Array.isArray(item.children) ? toDeptTreeNodes(item.children) : undefined
  }))

const updateTreeData = (list, key, children) =>
  list.map((node) => {
    if (node.value === key) {
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

const findTreeNode = (list, value) => {
  for (const node of list) {
    if (node.value === value) {
      return node
    }

    const matched = node.children ? findTreeNode(node.children, value) : null
    if (matched) {
      return matched
    }
  }

  return null
}

function UserManagement() {
  const [searchForm] = Form.useForm()
  const [userForm] = Form.useForm()
  const { message, modal } = AntdApp.useApp()
  const permissions = useUserStore((state) => state.permissions)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [queryParams, setQueryParams] = useState(defaultQueryParams)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增用户')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingId, setEditingId] = useState(undefined)
  const [deptTreeData, setDeptTreeData] = useState([])
  const [jobOptions, setJobOptions] = useState([])
  const [roleOptions, setRoleOptions] = useState([])

  const hasPermission = (permission) => permissions.includes(permission) || permissions.includes('admin') || permissions.includes('*:*:*')
  const canAdd = hasPermission('user:add')
  const canEdit = hasPermission('user:edit')
  const canDel = hasPermission('user:del')

  const queryPage = useCallback(async (params = defaultQueryParams) => {
    const nextParams = {
      ...defaultQueryParams,
      ...params
    }

    setLoading(true)

    try {
      const res = await page(nextParams)

      setRecords(Array.isArray(res?.records) ? res.records : [])
      setTotal(Number(res?.total) || 0)
      setQueryParams(nextParams)
      setSelectedRowKeys([])
      setSelectedRows([])
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

  const loadDeptTree = async (node) => {
    const res = await getDeptChildList(node.value)
    const children = toDeptTreeNodes(getListData(res))

    setDeptTreeData((current) => updateTreeData(current, node.value, children))
  }

  const handleDeptSelected = (value) => {
    const deptId = value?.value ?? value
    const node = findTreeNode(deptTreeData, deptId)
    const hasValue = deptId !== undefined && deptId !== null && deptId !== ''

    userForm.setFieldsValue({
      deptName: hasValue ? node?.raw?.name || node?.title || value?.label : undefined
    })
  }

  const resetQuery = () => {
    searchForm.resetFields()
    queryPage(defaultQueryParams)
  }

  const handleTableChange = (pagination) => {
    queryPage({
      ...queryParams,
      pageNum: pagination.current || defaultQueryParams.pageNum,
      pageSize: pagination.pageSize || defaultQueryParams.pageSize
    })
  }

  const handleSelectionChange = (keys, rows) => {
    setSelectedRowKeys(keys)
    setSelectedRows(rows)
  }

  const handleAdd = async () => {
    setFormLoading(true)

    try {
      const [roles, jobs, depts] = await Promise.all([listRoles({}), getJobList(), getDeptChildList(0)])

      setRoleOptions(getListData(roles).map((item) => ({ label: item.name, value: item.id })))
      setJobOptions(getListData(jobs).map((item) => ({ label: item.name, value: item.id })))
      setDeptTreeData(toDeptTreeNodes(getListData(depts)))
      setEditingId(undefined)
      setModalTitle('新增用户')
      userForm.resetFields()
      userForm.setFieldsValue(getDefaultUserFormValues())
      setModalOpen(true)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async () => {
    const target = selectedRows[0]

    if (!target || target.id === undefined || target.id === null) {
      message.warning('请选择一条用户记录')
      return
    }

    setFormLoading(true)

    try {
      const [detail, roles, jobs, depts] = await Promise.all([
        getUser(target.id),
        listRoles({}),
        getJobList(),
        getDeptChildList(0)
      ])
      const nextDeptTreeData = toDeptTreeNodes(getListData(depts))
      const deptId = detail.deptId
      const deptName = detail.deptName
      const deptValue = deptId !== undefined && deptId !== null && deptId !== ''
        ? {
            value: deptId,
            label: deptName || String(deptId)
          }
        : undefined

      setRoleOptions(getListData(roles).map((item) => ({ label: item.name, value: item.id })))
      setJobOptions(getListData(jobs).map((item) => ({ label: item.name, value: item.id })))
      setDeptTreeData(nextDeptTreeData)
      setEditingId(detail.id)
      setModalTitle('修改用户')
      userForm.resetFields()
      userForm.setFieldsValue({
        ...getDefaultUserFormValues(),
        deptId: deptValue,
        deptName,
        username: detail.username,
        nickName: detail.nickName,
        sex: detail.sex || '男',
        phone: detail.phone,
        email: detail.email,
        enabled: detail.enabled,
        jobIds: parseIdList(detail.jobIds),
        roleIds: parseIdList(detail.roleIds)
      })
      setModalOpen(true)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const submit = async (values) => {
    const deptId = values.deptId?.value ?? values.deptId

    const submitForm = {
      ...values,
      deptId,
      id: editingId,
      jobIds: values.jobIds.join(','),
      roleIds: values.roleIds.join(',')
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

  const handleDelete = () => {
    const ids = selectedRows.map((item) => item.id).filter((id) => id !== undefined && id !== null)

    if (!ids.length) {
      message.warning('请选择要删除的用户！')
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
      title: '用户名',
      dataIndex: 'username',
      fixed: 'left',
      width: 140,
      render: formatValue
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      width: 120,
      render: formatValue
    },
    {
      title: '性别',
      dataIndex: 'sex',
      width: 100,
      render: formatValue
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 140,
      render: formatValue
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '部门',
      dataIndex: 'deptName',
      width: 160,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (value) => (
        <Tag color={isEnabled(value) ? 'success' : 'default'}>
          {isEnabled(value) ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      ellipsis: true,
      render: formatValue
    }
  ]

  return (
    <main className="system-user-page">
      <section className="system-user-toolbar">
        <Form
          className="system-user-filter-form"
          form={searchForm}
          initialValues={{
            username: undefined,
            enabled: undefined
          }}
          layout="inline"
          onFinish={(values) => {
            const username = values.username?.trim()

            queryPage({
              ...queryParams,
              pageNum: 1,
              username: username || undefined,
              enabled: values.enabled
            })
          }}
        >
          <Form.Item label="用户名称" name="username">
            <Input allowClear placeholder="请输入用户名称" />
          </Form.Item>

          <Form.Item label="状态" name="enabled">
            <Select allowClear options={statusOptions} placeholder="用户状态" />
          </Form.Item>

          <Form.Item className="system-user-filter-actions">
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

      <section className="system-user-table-panel">
        <div className="system-user-table-meta">
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
                onClick={handleUpdate}
              >
                修改
              </Button>
            ) : null}
            {canDel ? (
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleteLoading}
                onClick={handleDelete}
              >
                删除
              </Button>
            ) : null}
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={records}
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: queryParams.pageNum,
            pageSize: queryParams.pageSize,
            pageSizeOptions: ['10', '20', '30', '50'],
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            total
          }}
          rowKey={(record) => record.id ?? record.username}
          rowSelection={{
            selectedRowKeys,
            onChange: handleSelectionChange
          }}
          scroll={{ x: 1110 }}
        />
      </section>

      <Modal
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnHidden
        okText="确定"
        onCancel={() => setModalOpen(false)}
        onOk={() => userForm.submit()}
        open={modalOpen}
        title={modalTitle}
        width={720}
      >
        <Form
          className="system-user-form"
          disabled={submitLoading}
          form={userForm}
          initialValues={getDefaultUserFormValues()}
          labelCol={{ flex: '78px' }}
          labelWrap
          layout="horizontal"
          onFinish={submit}
        >
          <Row gutter={16}>
            <Col sm={12} xs={24}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, max: 10, message: '长度在 3 到 10 个字符' }
                ]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col sm={12} xs={24}>
              <Form.Item
                label="昵称"
                name="nickName"
                rules={[
                  { required: true, message: '请输入昵称' },
                  { min: 3, max: 10, message: '长度在 3 到 10 个字符' }
                ]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col sm={12} xs={24}>
              <Form.Item label="电话" name="phone">
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col sm={12} xs={24}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入正确的邮箱' }
                ]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col sm={12} xs={24}>
              <Form.Item label="部门" name="deptId" rules={[{ required: true, message: '请选择部门' }]}>
                <TreeSelect
                  allowClear
                  labelInValue
                  loadData={loadDeptTree}
                  onChange={handleDeptSelected}
                  placeholder="请选择部门"
                  treeData={deptTreeData}
                />
              </Form.Item>
              <Form.Item hidden name="deptName">
                <Input />
              </Form.Item>
            </Col>
            <Col sm={12} xs={24}>
              <Form.Item
                label="岗位"
                name="jobIds"
                rules={[{ required: true, type: 'array', message: '请选择岗位' }]}
              >
                <Select maxTagCount="responsive" mode="multiple" options={jobOptions} placeholder="请选择岗位" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col sm={12} xs={24}>
              <Form.Item label="性别" name="sex">
                <Radio.Group options={sexOptions} />
              </Form.Item>
            </Col>
            <Col sm={12} xs={24}>
              <Form.Item label="状态" name="enabled">
                <Radio.Group options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col sm={12} xs={24}>
              <Form.Item
                label="角色"
                name="roleIds"
                rules={[{ required: true, type: 'array', message: '请选择角色' }]}
              >
                <Select maxTagCount="responsive" mode="multiple" options={roleOptions} placeholder="请选择角色" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </main>
  )
}

export default UserManagement
