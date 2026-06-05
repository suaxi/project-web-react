import { useCallback, useEffect, useState } from 'react'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Typography
} from 'antd'
import {
  add,
  del,
  getDictDetail,
  page,
  update
} from '@/api/system/dictDetail.js'

const defaultQueryParams = {
  pageNum: 1,
  pageSize: 10,
  dictId: undefined,
  dictName: undefined
}

const getDefaultFormValues = () => ({
  label: undefined,
  value: undefined,
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

function DictDetail({ canAdd, canDel, canEdit, dict }) {
  const [form] = Form.useForm()
  const { message } = AntdApp.useApp()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [queryParams, setQueryParams] = useState(defaultQueryParams)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增数据字典详情')
  const [editingId, setEditingId] = useState(undefined)
  const [formLoading, setFormLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const resetForm = useCallback(() => {
    form.resetFields()
    form.setFieldsValue(getDefaultFormValues())
    setEditingId(undefined)
  }, [form])

  const resetDetail = useCallback(() => {
    setRecords([])
    setTotal(0)
    setQueryParams(defaultQueryParams)
    resetForm()
  }, [resetForm])

  const queryPage = useCallback(async (params = defaultQueryParams) => {
    if (!dict?.id) {
      resetDetail()
      return
    }

    const nextParams = {
      ...defaultQueryParams,
      ...params,
      dictId: dict.id,
      dictName: dict.name
    }

    setLoading(true)

    try {
      const res = await page(nextParams)

      setRecords(getRecords(res))
      setTotal(Number(res?.total) || 0)
      setQueryParams(nextParams)
    } catch {
      setRecords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [dict, resetDetail])

  useEffect(() => {
    queryPage(defaultQueryParams)
  }, [queryPage])

  const handleTableChange = (pagination) => {
    queryPage({
      ...queryParams,
      pageNum: pagination.current || defaultQueryParams.pageNum,
      pageSize: pagination.pageSize || defaultQueryParams.pageSize
    })
  }

  const handleAdd = () => {
    if (!dict?.id) {
      message.warning('请先选择字典')
      return
    }

    resetForm()
    setModalTitle('新增数据字典详情')
    setModalOpen(true)
  }

  const handleUpdate = async (record) => {
    if (!record?.id) {
      message.warning('请选择要修改的数据字典详情信息！')
      return
    }

    setFormLoading(true)

    try {
      const detail = await getDictDetail(record.id)

      setEditingId(detail.id)
      setModalTitle('修改数据字典详情')
      form.resetFields()
      form.setFieldsValue({
        ...getDefaultFormValues(),
        label: detail.label,
        value: detail.value,
        sort: detail.sort ?? 999
      })
      setModalOpen(true)
    } catch {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const submit = async (values) => {
    if (!dict?.id) {
      message.warning('请先选择字典')
      return
    }

    const submitForm = {
      id: editingId,
      dictId: dict.id,
      label: values.label?.trim(),
      value: values.value?.trim(),
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
    } catch {
      // Request errors are displayed by the shared request handler.
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (record) => {
    if (!record?.id) {
      message.warning('请选择要删除的数据字典详情信息！')
      return
    }

    setDeleteLoading(true)

    try {
      await del([record.id])
      message.success('删除成功')
      await queryPage(queryParams)
    } catch {
      // Request errors are displayed by the shared request handler.
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns = [
    {
      title: '所属字典',
      key: 'dictName',
      width: 160,
      ellipsis: true,
      render: () => formatValue(queryParams.dictName || dict?.name)
    },
    {
      title: '字典标签',
      dataIndex: 'label',
      width: 140,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '字典值',
      dataIndex: 'value',
      width: 140,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '排序',
      dataIndex: 'sort',
      align: 'center',
      width: 90,
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
            <Button icon={<EditOutlined />} loading={formLoading} onClick={() => handleUpdate(record)} size="small" type="link">
              修改
            </Button>
          ) : null}
          {canDel ? (
            <Popconfirm
              cancelText="取消"
              okText="确定"
              onConfirm={() => handleDelete(record)}
              title="确定删除本条数据吗？"
            >
              <Button danger icon={<DeleteOutlined />} loading={deleteLoading} size="small" type="link">
                删除
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      )
    })
  }

  return (
    <section className="system-dict-panel system-dict-detail-panel">
      {!dict ? (
        <Empty description="点击字典查看详情" />
      ) : (
        <Spin spinning={loading}>
          <div className="system-dict-detail-header">
            <div>
              <Typography.Title level={5}>字典详情</Typography.Title>
              <Typography.Text type="secondary">当前字典：{queryParams.dictName || dict.name || '-'}</Typography.Text>
            </div>
            {canAdd ? (
              <Button icon={<PlusOutlined />} loading={formLoading} onClick={handleAdd} type="primary">
                新增
              </Button>
            ) : null}
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
            rowKey={(record) => record.id ?? `${record.label}-${record.value}`}
            scroll={{ x: canEdit || canDel ? 680 : 530 }}
          />

          <Modal
            cancelText="取消"
            confirmLoading={submitLoading}
            destroyOnHidden
            okText="确定"
            onCancel={() => setModalOpen(false)}
            onOk={() => form.submit()}
            open={modalOpen}
            title={modalTitle}
            width={500}
          >
            <Spin spinning={formLoading}>
              <Form
                className="system-dict-form"
                disabled={submitLoading}
                form={form}
                initialValues={getDefaultFormValues()}
                labelCol={{ flex: '70px' }}
                labelWrap
                layout="horizontal"
                onFinish={submit}
              >
                <Form.Item label="字典标签" name="label" rules={[{ required: true, message: '请输入字典标签' }]}>
                  <Input autoComplete="off" />
                </Form.Item>
                <Form.Item label="字典值" name="value" rules={[{ required: true, message: '请输入字典值' }]}>
                  <Input autoComplete="off" />
                </Form.Item>
                <Form.Item label="排序" name="sort">
                  <InputNumber min={0} />
                </Form.Item>
              </Form>
            </Spin>
          </Modal>
        </Spin>
      )}
    </section>
  )
}

export default DictDetail
