import request from '@/utils/request'

/**
 * 分页查询候诊队列。
 */
export function getQueuePage (params) {
	return request.get('/api/bizQueue/page', { params })
}

/**
 * 叫号台视图：当前叫号 + 候诊队列 + 状态计数。
 */
export function getQueueDesk (params) {
	return request.get('/api/bizQueue/desk', { params })
}

/**
 * 呼叫下一位 / 重呼过号患者。
 */
export function callQueue (id) {
	return request.put('/api/bizQueue/call', null, { params: { id } })
}

/**
 * 过号。
 */
export function passQueue (id) {
	return request.put('/api/bizQueue/pass', null, { params: { id } })
}

/**
 * 完成就诊。
 */
export function finishQueue (id) {
	return request.put('/api/bizQueue/finish', null, { params: { id } })
}

/**
 * 取消候诊。
 */
export function cancelQueue (id) {
	return request.put('/api/bizQueue/cancel', null, { params: { id } })
}

/**
 * 科室下拉。
 */
export function getQueueOptions () {
	return request.get('/api/bizQueue/options')
}
