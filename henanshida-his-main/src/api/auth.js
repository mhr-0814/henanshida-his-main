import request from '@/utils/request'

/**
 * 登录，入参 { username, password }
 */
export function login (data) {
	return request.post('/api/auth/login', data)
}

/**
 * 退出登录
 */
export function logout () {
	return request.post('/api/auth/logout')
}

/**
 * 当前登录用户信息
 */
export function getMe () {
	return request.get('/api/auth/me')
}

/**
 * 当前登录用户可见的菜单树
 */
export function getMenus () {
	return request.get('/api/auth/menus')
}
