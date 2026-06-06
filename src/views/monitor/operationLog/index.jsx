import { useCallback, useEffect, useState } from 'react'
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, DatePicker, Descriptions, Form, Modal, Select, Space, Table, Tag } from 'antd'
import { page as queryOperationLogPage } from '@/api/monitor/log.js'
import './index.scss'

const defaultQueryParams = {
  pageNum: 1,
  pageSize: 10,
  logType: undefined,
  startTime: undefined,
  endTime: undefined
}

const { RangePicker } = DatePicker

const logTypeOptions = [
  { label: 'INFO', value: 'INFO' },
  { label: 'ERROR', value: 'ERROR' }
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

const formatTimeCost = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return `${value}ms`
}

const renderLogTypeTag = (value) => (
  <Tag color={value === 'INFO' ? 'success' : 'error'}>
    {formatValue(value)}
  </Tag>
)

const formatDateTime = (value) => {
  if (!value) {
    return undefined
  }

  if (typeof value.format === 'function') {
    return value.format('YYYY-MM-DD HH:mm:ss')
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  const pad = (number) => String(number).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function OperationLog() {
  const [searchForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [queryParams, setQueryParams] = useState(defaultQueryParams)
  const [detailRecord, setDetailRecord] = useState(null)

  const queryPage = useCallback(async (params = defaultQueryParams) => {
    const nextParams = {
      ...defaultQueryParams,
      ...params
    }

    setLoading(true)

    try {
      const res = await queryOperationLogPage(nextParams)

      setRecords(getRecords(res))
      setTotal(Number(res?.total) || 0)
      setQueryParams(nextParams)
    } catch {
      setRecords([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

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

  const resetQuery = () => {
    searchForm.resetFields()
    setDetailRecord(null)
    queryPage(defaultQueryParams)
  }

  const closeDetail = () => {
    setDetailRecord(null)
  }

  const renderLongText = (value) => (
    <div className="monitor-operation-log-long-text">
      {formatValue(value)}
    </div>
  )

  const columns = [
    {
      title: '日志编号',
      dataIndex: 'id',
      fixed: 'left',
      width: 100,
      render: formatValue
    },
    {
      title: '日志类型',
      dataIndex: 'logType',
      align: 'center',
      width: 120,
      render: renderLogTypeTag
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 140,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      width: 260,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '请求IP',
      dataIndex: 'requestIp',
      width: 130,
      render: formatValue
    },
    {
      title: '请求耗时',
      dataIndex: 'time',
      width: 120,
      render: formatTimeCost
    },
    {
      title: '操作用户',
      dataIndex: 'username',
      width: 120,
      render: formatValue
    },
    {
      title: '地址',
      dataIndex: 'address',
      width: 140,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      width: 140,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '操作时间',
      dataIndex: 'createTime',
      width: 180,
      ellipsis: true,
      render: formatValue
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => setDetailRecord(record)}
          size="small"
          type="link"
        >
          详细
        </Button>
      )
    }
  ]

  return (
    <main className="monitor-operation-log-page">
      <section className="monitor-operation-log-panel">
        <Form
          className="monitor-operation-log-filter-form"
          form={searchForm}
          initialValues={{
            logType: undefined,
            operationTime: undefined
          }}
          layout="inline"
          onFinish={(values) => {
            const [startTime, endTime] = values.operationTime || []

            queryPage({
              ...queryParams,
              pageNum: 1,
              logType: values.logType,
              startTime: formatDateTime(startTime),
              endTime: formatDateTime(endTime)
            })
          }}
        >
          <Form.Item label="日志类型" name="logType">
            <Select allowClear options={logTypeOptions} placeholder="日志类型" />
          </Form.Item>

          <Form.Item label="操作时间" name="operationTime">
            <RangePicker
              showTime
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>

          <Form.Item className="monitor-operation-log-filter-actions">
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
          rowKey={(record) => record.id ?? `${record.username}-${record.createTime}`}
          scroll={{ x: 1670 }}
        />
      </section>

      <Modal
        destroyOnHidden
        footer={(
          <Button onClick={closeDetail}>
            关 闭
          </Button>
        )}
        onCancel={closeDetail}
        open={Boolean(detailRecord)}
        title="操作日志详细信息"
        width={800}
      >
        {detailRecord ? (
          <Descriptions
            bordered
            className="monitor-operation-log-detail"
            column={1}
            size="small"
          >
            <Descriptions.Item label="日志类型">
              {renderLogTypeTag(detailRecord.logType)}
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              {formatValue(detailRecord.description)}
            </Descriptions.Item>
            <Descriptions.Item label="请求方法">
              {renderLongText(detailRecord.method)}
            </Descriptions.Item>
            <Descriptions.Item label="操作用户">
              {`${formatValue(detailRecord.username)} / ${formatValue(detailRecord.requestIp)} / ${formatValue(detailRecord.address)} / ${formatValue(detailRecord.browser)}`}
            </Descriptions.Item>
            <Descriptions.Item label="请求参数">
              {renderLongText(detailRecord.params)}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间">
              {formatValue(detailRecord.createTime)}
            </Descriptions.Item>
            <Descriptions.Item label="耗时">
              {formatTimeCost(detailRecord.time)}
            </Descriptions.Item>
            {detailRecord.logType === 'ERROR' ? (
              <Descriptions.Item label="异常信息">
                {renderLongText(detailRecord.exceptionDetail)}
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        ) : null}
      </Modal>
    </main>
  )
}

export default OperationLog
