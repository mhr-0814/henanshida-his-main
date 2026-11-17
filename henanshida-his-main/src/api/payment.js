import request from '@/utils/request'

/**
 * 创建（或复用）挂号费支付单，返回 { payNo, amount, qrContent, expireTime, status }。
 * status: 0-待支付 1-已支付 2-已关闭
 */
export function createPayment (data) {
	return request.post('/api/bizPayment/create', data)
}

/**
 * 查询支付状态（前端轮询），已过期的待支付单会被后端置为已关闭。
 */
export function getPaymentStatus (payNo) {
	return request.get(`/api/bizPayment/status/${payNo}`)
}

/**
 * 模拟扫码支付成功（演示环境；真实网关下由支付回调更新状态）。
 */
export function simulatePayment (payNo) {
	return request.post(`/api/bizPayment/simulate/${payNo}`)
}

/**
 * 关闭待支付单（离开支付弹窗时调用）。
 */
export function closePayment (payNo) {
	return request.post(`/api/bizPayment/close/${payNo}`)
}
