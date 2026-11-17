import request from '@/utils/request'

/**
 * 全量查询职称。
 * 返回 [{ id, titleName, regLevel, regFee }]
 */
export function getTitleListAll () {
	return request.get('/api/sysTitle/listAll')
}
