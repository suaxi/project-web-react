import { useCallback, useEffect, useMemo, useState } from 'react'
import { LockOutlined, ReloadOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { App as AntdApp, Button, Checkbox, Form, Input } from 'antd'
import JSEncrypt from 'jsencrypt'
import { useLocation, useNavigate } from 'react-router-dom'
import Background from '@/assets/images/background.jpg'
import { captcha } from '@/api/login.js'
import useUserStore from '@/store/user.js'
import './index.scss'

const publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC84DsWrQDLvVXVCS01kmeMqFYqmi1z5zfsFOcHECRSyDnGMllGivuuY8boS5OlEkFckhGJsqKEZwOHTvNQV4mltBosyi/X9qi7lRYg0dzG5Fj2Ytgtp24w11TnNx32ZV6/7/tkHNUakSZ6f4yJ8lFcA3Nin9TtIHuDj/Y6hSBGCQIDAQAB'

function Login() {
  const [form] = Form.useForm()
  const location = useLocation()
  const navigate = useNavigate()
  const login = useUserStore((state) => state.login)
  const { message } = AntdApp.useApp()
  const [loading, setLoading] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [captchaInfo, setCaptchaInfo] = useState({
    img: '',
    uuid: ''
  })
  const redirect = useMemo(() => {
    const value = new URLSearchParams(location.search).get('redirect')

    return value?.startsWith('/') && !value.startsWith('//') ? value : '/index'
  }, [location.search])

  const getCode = useCallback(async () => {
    setCaptchaLoading(true)

    try {
      const res = await captcha()

      if (!res?.img || !res?.uuid) {
        throw new Error('验证码返回结构异常')
      }

      setCaptchaInfo({
        img: res.img,
        uuid: res.uuid
      })
      form.setFieldValue('code', '')
    } catch (error) {
      setCaptchaInfo({
        img: '',
        uuid: ''
      })
      form.setFieldValue('code', '')
      message.error(error.message || '验证码获取失败')
    } finally {
      setCaptchaLoading(false)
    }
  }, [form, message])

  useEffect(() => {
    getCode()
  }, [getCode])

  const encryptPassword = (password) => {
    const encryptor = new JSEncrypt()

    encryptor.setPublicKey(publicKey)
    return encryptor.encrypt(password)
  }

  const handleLogin = async (values) => {
    if (!captchaInfo.uuid) {
      message.error('验证码未加载完成')
      return
    }

    const password = encryptPassword(values.password)

    if (!password) {
      message.error('密码加密失败')
      return
    }

    setLoading(true)

    try {
      await login({
        ...values,
        password,
        uuid: captchaInfo.uuid
      })
      navigate(redirect, { replace: true })
    } catch (error) {
      message.error(error.message || '登录失败')
      getCode()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page" style={{ backgroundImage: `url(${Background})` }}>
      <section className="login-panel">
        <div className="login-title">
          <h1>Project Web React</h1>
        </div>

        <Form
          autoComplete="off"
          form={form}
          initialValues={{
            username: 'admin',
            password: '123456',
            code: '',
            rememberMe: false
          }}
          onFinish={handleLogin}
          size="large"
        >
          <Form.Item name="username" rules={[{ required: true, message: '用户名不能为空' }]}>
            <Input autoComplete="username" placeholder="账号" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '密码不能为空' }]}>
            <Input.Password autoComplete="current-password" placeholder="密码" prefix={<LockOutlined />} />
          </Form.Item>

          <div className="login-code-row">
            <Form.Item name="code" rules={[{ required: true, message: '验证码不能为空' }]}>
              <Input placeholder="验证码" prefix={<SafetyCertificateOutlined />} />
            </Form.Item>

            <div
              aria-label="刷新验证码"
              className={`login-code-image${captchaLoading ? ' is-loading' : ''}`}
              onClick={captchaLoading ? undefined : getCode}
            >
              {captchaInfo.img ? <img alt="验证码" src={captchaInfo.img} /> : <ReloadOutlined />}
            </div>
          </div>

          <Form.Item className="login-options" name="rememberMe" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>

          <Button block htmlType="submit" loading={loading} type="primary">
            登录
          </Button>
        </Form>
      </section>
    </main>
  )
}

export default Login
