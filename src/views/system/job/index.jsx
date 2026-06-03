import { useCallback, useEffect, useState } from 'react'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
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
  Table,
  Tag
} from 'antd'
import { add, del, getJob, page, update } from '@/api/system/job.js'
import useUserStore from '@/store/user.js'
import './index.scss'

const defaultQueryParams = {
  pageNum: 1,
  pageSize: 10,
  name: undefined,
  enabled: undefined
}

const statusOptions = [
  { label: '启用', value: true },
  { label: '禁用', value: false }
]

const getDefaultJobFormValues = () => ({
  name: undefined,
  enabled: true,
  sort: 999
})

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

const isEnabled = (value) => value === true || value === 'true' || value === 1 || value === '1'

function JobManagement() {
  const [searchForm] = Form.useForm()
  const [jobForm] = Form.useForm()
  const { message, modal } = AntdApp.useApp()
  const permissions = useUserStore((state) => state.permissions)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [queryParams, setQueryParams] = useState(defaultQueryParams)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增岗位')
  const [editingId, setEditingId] = useState(undefined)
  const [formLoading, setFormLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const hasPermission = (permission) => permissions.includes(permission) || permissions.includes('admin') || permissions.includes('*:*:*')
  const canAdd = hasPermission('job:add')
  const canEdit = hasPermission('job:edit')
  const canDel = hasPermission('job:del')

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

  const handleAdd = () => {
    setEditingId(undefined)
    setModalTitle('新增岗位')
    jobForm.resetFields()
    jobForm.setFieldsValue(getDefaultJobFormValues())
    setModalOpen(true)
  }

  const handleUpdate = async (record) => {
    const target = record || selectedRows[0]

    if (!target || target.id === undefined || target.id === null) {
      message.warning('请选择一条岗位记录')
      return
    }

    setFormLoading(true)

    try {
      const detail = await getJob(target.id)

      setEditingId(detail.id)
      setModalTitle('修改岗位')
      jobForm.resetFields()
      jobForm.setFieldsValue({
        ...getDefaultJobFormValues(),
        name: detail.name,
        enabled: detail.enabled ?? true,
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
    const submitForm = {
      id: editingId,
      name: values.name?.trim(),
      enabled: values.enabled,
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

      setModalOpen(false)
      await queryPage(queryParams)
    } catch (error) {
      // Request errors are displayed by the shared request handler.
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = (record) => {
    const targets = record ? [record] : selectedRows
    const ids = targets.map((item) => item.id).filter((id) => id !== undefined && id !== null)

    if (!ids.length) {
      message.warning('请选择要删除的岗位！')
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
      width: 220,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '排序',
      dataIndex: 'sort',
      align: 'center',
      width: 100,
      render: formatValue
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      align: 'center',
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

  if (canEdit || canDel) {
    columns.push({
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          {canEdit ? (
            <Button
              icon={<EditOutlined />}
              loading={formLoading}
              onClick={() => handleUpdate(record)}
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
              onClick={() => handleDelete(record)}
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

  return (
    <main className="system-job-page">
      <section className="system-job-table-panel">
        <Form
          className="system-job-filter-form"
          form={searchForm}
          initialValues={{
            name: undefined,
            enabled: undefined
          }}
          layout="inline"
          onFinish={(values) => {
            const name = values.name?.trim()

            queryPage({
              ...queryParams,
              pageNum: 1,
              name: name || undefined,
              enabled: values.enabled
            })
          }}
        >
          <Form.Item label="岗位名称" name="name">
            <Input allowClear placeholder="请输入岗位名称" />
          </Form.Item>

          <Form.Item label="状态" name="enabled">
            <Select allowClear options={statusOptions} placeholder="状态" />
          </Form.Item>

          <Form.Item className="system-job-filter-actions">
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

        <div className="system-job-table-meta">
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
          rowKey={(record) => record.id ?? record.name}
          rowSelection={{
            selectedRowKeys,
            onChange: handleSelectionChange
          }}
          scroll={{ x: canEdit || canDel ? 850 : 700 }}
        />
      </section>

      <Modal
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnHidden
        okText="确定"
        onCancel={() => setModalOpen(false)}
        onOk={() => jobForm.submit()}
        open={modalOpen}
        title={modalTitle}
        width={600}
      >
        <Form
          className="system-job-form"
          disabled={submitLoading}
          form={jobForm}
          initialValues={getDefaultJobFormValues()}
          labelCol={{ flex: '68px' }}
          labelWrap
          layout="horizontal"
          onFinish={submit}
        >
          <Row gutter={16}>
            <Col sm={12} xs={24}>
              <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col sm={12} xs={24}>
              <Form.Item label="状态" name="enabled">
                <Radio.Group options={statusOptions} />
              </Form.Item>
            </Col>
            <Col sm={12} xs={24}>
              <Form.Item label="排序" name="sort">
                <InputNumber min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </main>
  )
}

export default JobManagement
