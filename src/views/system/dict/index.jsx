import { useCallback, useEffect, useState } from 'react'
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Table
} from 'antd'
import { add as addDict, del as delDict, getDict, page as queryDictPage, update as updateDict } from '@/api/system/dict.js'
import useUserStore from '@/store/user.js'
import DictDetail from './DictDetail.jsx'
import './index.scss'

const defaultQueryParams = {
  pageNum: 1,
  pageSize: 10,
  name: undefined
}

const getDefaultDictFormValues = () => ({
  name: undefined,
  description: undefined
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

function DictManagement() {
  const [searchForm] = Form.useForm()
  const [dictForm] = Form.useForm()
  const { message, modal } = AntdApp.useApp()
  const permissions = useUserStore((state) => state.permissions)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [queryParams, setQueryParams] = useState(defaultQueryParams)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [currentDict, setCurrentDict] = useState(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增字典')
  const [editingId, setEditingId] = useState(undefined)
  const [formLoading, setFormLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const hasPermission = (permission) => permissions.includes(permission) || permissions.includes('admin') || permissions.includes('*:*:*')
  const canAdd = hasPermission('dict:add')
  const canEdit = hasPermission('dict:edit')
  const canDel = hasPermission('dict:del')

  const resetDictDetail = useCallback(() => {
    setCurrentDict(undefined)
  }, [])

  const queryPage = useCallback(async (params = defaultQueryParams) => {
    const nextParams = {
      ...defaultQueryParams,
      ...params
    }

    setLoading(true)

    try {
      const res = await queryDictPage(nextParams)

      setRecords(getRecords(res))
      setTotal(Number(res?.total) || 0)
      setQueryParams(nextParams)
      setSelectedRowKeys([])
      setSelectedRows([])
      resetDictDetail()
    } catch {
      setRecords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [resetDictDetail])

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
    setModalTitle('新增字典')
    dictForm.resetFields()
    dictForm.setFieldsValue(getDefaultDictFormValues())
    setModalOpen(true)
  }

  const handleUpdate = async (record) => {
    const target = record || selectedRows[0]

    if (!target?.id) {
      message.warning('请选择一条字典记录')
      return
    }

    setFormLoading(true)

    try {
      const detail = await getDict(target.id)

      setEditingId(detail.id)
      setModalTitle('修改字典')
      dictForm.resetFields()
      dictForm.setFieldsValue({
        ...getDefaultDictFormValues(),
        name: detail.name,
        description: detail.description
      })
      setModalOpen(true)
    } catch {
      // Request errors are displayed by the shared request handler.
    } finally {
      setFormLoading(false)
    }
  }

  const submit = async (values) => {
    const submitForm = {
      id: editingId,
      name: values.name?.trim(),
      description: values.description
    }

    setSubmitLoading(true)

    try {
      if (editingId !== undefined && editingId !== null) {
        await updateDict(submitForm)
        message.success('修改成功')
      } else {
        await addDict(submitForm)
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

  const handleDelete = (record) => {
    const targets = record ? [record] : selectedRows
    const ids = targets.map((item) => item.id).filter((id) => id !== undefined && id !== null)

    if (!ids.length) {
      message.warning('请选择要删除的字典！')
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
          await delDict(ids)
          message.success('删除成功')
          await queryPage(queryParams)
        } catch {
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
      width: 180,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 220,
      ellipsis: true,
      render: formatValue
    }
  ]

  if (canEdit || canDel) {
    columns.push({
      title: '操作',
      key: 'action',
      align: 'center',
      width: 150,
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

  return (
    <div className="system-dict-page">
      <div className="system-dict-layout">
        <section className="system-dict-panel system-dict-master-panel">
          <Form
            className="system-dict-filter-form"
            form={searchForm}
            initialValues={{
              name: undefined
            }}
            layout="inline"
            onFinish={(values) => {
              const name = values.name?.trim()

              queryPage({
                ...queryParams,
                pageNum: 1,
                name: name || undefined
              })
            }}
          >
            <Form.Item label="字典名称" name="name">
              <Input allowClear placeholder="请输入字典名称" />
            </Form.Item>

            <Form.Item className="system-dict-filter-actions">
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

          {canAdd || canEdit || canDel ? (
            <div className="system-dict-table-meta">
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
              onClick: () => setCurrentDict(record)
            })}
            pagination={{
              current: queryParams.pageNum,
              pageSize: queryParams.pageSize,
              pageSizeOptions: ['10', '20', '30', '50'],
              showSizeChanger: true,
              showTotal: (value) => `共 ${value} 条`,
              total
            }}
            rowClassName={(record) => (record.id === currentDict?.id ? 'system-dict-current-row' : '')}
            rowKey={(record) => record.id ?? record.name}
            rowSelection={{
              selectedRowKeys,
              onChange: handleSelectionChange
            }}
            scroll={{ x: canEdit || canDel ? 690 : 540 }}
          />
        </section>

        <DictDetail canAdd={canAdd} canDel={canDel} canEdit={canEdit} dict={currentDict} />
      </div>

      <Modal
        cancelText="取消"
        confirmLoading={submitLoading}
        destroyOnHidden
        okText="确定"
        onCancel={() => setModalOpen(false)}
        onOk={() => dictForm.submit()}
        open={modalOpen}
        title={modalTitle}
        width={500}
      >
        <Spin spinning={formLoading}>
          <Form
            className="system-dict-form"
            disabled={submitLoading}
            form={dictForm}
            initialValues={getDefaultDictFormValues()}
            labelCol={{ flex: '66px' }}
            labelWrap
            layout="horizontal"
            onFinish={submit}
          >
            <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
              <Input autoComplete="off" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={5} />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

    </div>
  )
}

export default DictManagement
