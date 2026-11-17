import request from '@/utils/request'

/**
 * 待分诊列表（只读挂号单）。
 */
export function getTriageWaiting (params) {
	return request.get('/api/bizTriage/waiting', { params })
}

/**
 * 分页查询已分诊记录。
 */
export function getTriagePage (params) {
	return request.get('/api/bizTriage/page', { params })
}

/**
 * 提交分诊并生成候诊号。
 */
export function addTriage (data) {
	return request.post('/api/bizTriage/add', data)
}

/**
 * 撤销分诊（仅未叫号可撤销）。
 */
export function revokeTriage (id) {
	return request.put('/api/bizTriage/revoke', null, { params: { id } })
}

/**
 * 分诊下拉：科室 + 医生 + 分诊级别。
 */
export function getTriageOptions () {
	return request.get('/api/bizTriage/options')
}
