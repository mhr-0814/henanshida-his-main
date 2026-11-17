import request from '@/utils/request'

/**
 * 分页查询科室。
 * 返回 { code, msg, data: { records, totalRow, totalPage } }
 */
export function getDeptPage (params) {
	return request.get('/api/sysDept/list', { params })
}

/**
 * 新增科室。
 */
export function addDept (data) {
	return request.post('/api/sysDept/add', data)
}

/**
 * 修改科室。
 */
export function updateDept (data) {
	return request.put('/api/sysDept/update', data)
}

/**
 * 删除科室。
 */
export function deleteDept (id) {
	return request.delete(`/api/sysDept/delete/${id}`)
}
