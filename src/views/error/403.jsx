import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

function Forbidden() {
  const navigate = useNavigate()

  return (
    <Result
      status="403"
      title="403"
      subTitle="当前账号没有访问该页面的权限"
      extra={
        <Button type="primary" onClick={() => navigate('/index')}>
          返回首页
        </Button>
      }
    />
  )
}

export default Forbidden
