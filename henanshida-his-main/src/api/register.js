import request from '@/utils/request'

/**
 * 分页查询挂号记录。
 * 返回 { code, msg, data: { records, totalRow, totalPage } }
 */
export function getRegistrationPage (params) {
	return request.get('/api/bizRegistration/list', { params })
}

/**
 * 科室与在岗医生下拉数据，可按就诊日期+时段带出号源余量。
 */
export function getRegisterOptions (params) {
	return request.get('/api/bizRegistration/options', { params })
}

/**
 * 症状推荐科室与医生。
 */
export function recommendDoctors (data) {
	// AI 推荐平均耗时 10–13 秒，单独放宽超时，避免被全局 15 秒截断
	return request.post('/api/bizRegistration/recommend', data, { timeout: 60000 })
}

/**
 * AI 多轮问诊对话（记忆按 sessionId 存 Redis）。
 * 首轮 8–13 秒，单独放宽超时到 60 秒。
 */
export function sendChat (data) {
	return request.post('/api/bizRegistration/chat', data, { timeout: 60000 })
}

/**
 * 新增挂号。
 */
export function addRegistration (data) {
	return request.post('/api/bizRegistration/add', data)
}

/**
 * 修改挂号。
 */
export function updateRegistration (data) {
	return request.put('/api/bizRegistration/update', data)
}

/**
 * 取消挂号（仅待就诊可取消）。
 */
export function cancelRegistration (id) {
	return request.put(`/api/bizRegistration/cancel/${id}`)
}

/**
 * 删除挂号记录。
 */
export function deleteRegistration (id) {
	return request.delete(`/api/bizRegistration/delete/${id}`)
}
