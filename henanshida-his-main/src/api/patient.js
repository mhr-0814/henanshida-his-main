import request from '@/utils/request'

/**
 * 按身份证号查询患者档案。
 * 命中返回档案对象，未命中 data 为 null。
 */
export function getPatientByIdCard (idCard) {
	return request.get('/api/sysPatient/getByIdCard', { params: { idCard } })
}

/**
 * 新增患者档案（身份证重复时后端自动复用已有档案并返回）。
 */
export function addPatient (data) {
	return request.post('/api/sysPatient/add', data)
}

/**
 * 姓名 / 手机号 / 身份证号模糊搜索患者档案。
 * 返回 { code, msg, data: { records, totalRow, totalPage, pageNumber, pageSize } }，分页只认 pageNo。
 */
export function listPatients (params) {
	return request.get('/api/sysPatient/list', { params })
}

/**
 * 修改患者档案。
 */
export function updatePatient (data) {
	return request.put('/api/sysPatient/update', data)
}
