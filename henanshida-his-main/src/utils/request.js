import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 全局 axios 实例。
 * 约定：
 *  1. 所有请求使用相对路径（/api/...），由 Vite 代理转发到后端，禁止硬编码主机地址；
 *  2. 登录鉴权已撤掉，不再携带 Authorization 令牌，也不再处理 401 跳转；
 *  3. 响应统一为 { code, msg, data }，拦截器统一判断 code 并提示错误。
 */

// 创建一个 axios 实例，单独配置：15 秒超时，15 秒后端没返回直接判定请求失败。
const request = axios.create({
	timeout: 15000
})
// 响应拦截器
request.interceptors.response.use(
	response => {
		const body = response.data
		if (body && typeof body.code !== 'undefined' && body.code !== 200) {
			ElMessage.error(body.msg || '请求失败')
			return Promise.reject(new Error(body.msg || '请求失败'))
		}
		return body
	},
	error => {
		// 优先使用后端返回的 msg；超时/断网等无响应场景给出可读提示，不直接暴露原始异常信息
		const responseMsg = error.response?.data?.msg
		const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')
		const msg = responseMsg || (isTimeout ? '请求超时，请稍后重试' : '网络异常，请检查网络后重试')
		ElMessage.error(msg)
		return Promise.reject(error)
	}
)

export default request
