import request from '@/utils/request'

/**
 * 分页查询菜单/权限。
 */
export function getMenuPage (params) {
	return request.get('/api/sysPermission/list', { params })
}

/**
 * 查询全部菜单（用于父级下拉）。
 */
export function getAllMenus () {
	return request.get('/api/sysPermission/all')
}

/**
 * 新增菜单。
 */
export function addMenu (data) {
	return request.post('/api/sysPermission/add', data)
}

/**
 * 修改菜单。
 */
export function updateMenu (data) {
	return request.put('/api/sysPermission/update', data)
}

/**
 * 删除菜单。
 */
export function deleteMenu (id) {
	return request.delete(`/api/sysPermission/delete/${id}`)
}
