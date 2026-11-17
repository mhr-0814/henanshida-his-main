import request from '@/utils/request'

/**
 * 分页查询角色。
 * 返回 { code, msg, data: { records, totalRow, totalPage } }
 */
export function getRolePage (params) {
	return request.get('/api/sysRole/list', { params })
}

/**
 * 新增角色。
 */
export function addRole (data) {
	return request.post('/api/sysRole/add', data)
}

/**
 * 修改角色。
 */
export function updateRole (data) {
	return request.put('/api/sysRole/update', data)
}

/**
 * 删除角色。
 */
export function deleteRole (id) {
	return request.delete(`/api/sysRole/delete/${id}`)
}

/**
 * 查询全部角色（分配角色用）。
 */
export function getAllRoles () {
	return request.get('/api/sysRole/all')
}

/**
 * 查询角色已绑定权限ID。
 */
export function getRolePermissions (roleId) {
	return request.get(`/api/sysRole/permissions/${roleId}`)
}

/**
 * 全量覆盖角色权限绑定。
 */
export function saveRolePermissions (roleId, permissionIds) {
	return request.put(`/api/sysRole/permissions/${roleId}`, permissionIds)
}
