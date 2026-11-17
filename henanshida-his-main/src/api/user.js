import request from '@/utils/request'

/**
 * 分页查询用户，支持 realName/post/deptId/enabled 过滤。
 * 返回 { code, msg, data: { records, totalRow, totalPage } }
 */
export function getSysUserPage (params) {
	return request.get('/api/sysUser/list', { params })
}

/**
 * 新增用户。
 */
export function addSysUser (data) {
	return request.post('/api/sysUser/add', data)
}

/**
 * 修改用户。
 */
export function updateSysUser (data) {
	return request.put('/api/sysUser/update', data)
}

/**
 * 删除用户。
 */
export function deleteSysUser (id) {
	return request.delete(`/api/sysUser/delete/${id}`)
}

/**
 * 查询用户已绑定角色。
 */
export function getUserRoles (userId) {
	return request.get(`/api/sysUser/roles/${userId}`)
}

/**
 * 全量覆盖用户的角色绑定。
 */
export function saveUserRoles (userId, roleIds) {
	return request.put(`/api/sysUser/roles/${userId}`, roleIds)
}
