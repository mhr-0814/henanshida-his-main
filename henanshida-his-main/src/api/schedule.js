import request from '@/utils/request'

/**
 * 分页查询排班（含已用/剩余号源）。
 */
export function getSchedulePage (params) {
	return request.get('/api/bizSchedule/page', { params })
}

/**
 * 查询某医生某日某时段的号源情况。
 */
export function getScheduleAvailability (params) {
	return request.get('/api/bizSchedule/availability', { params })
}

/**
 * 新增排班。
 */
export function addSchedule (data) {
	return request.post('/api/bizSchedule/add', data)
}

/**
 * 修改排班。
 */
export function updateSchedule (data) {
	return request.put('/api/bizSchedule/update', data)
}

/**
 * 停诊 / 恢复。
 */
export function changeScheduleStatus (id, status) {
	return request.put('/api/bizSchedule/changeStatus', null, { params: { id, status } })
}

/**
 * 删除排班（有挂号记录时后端会拒绝）。
 */
export function deleteSchedule (id) {
	return request.delete(`/api/bizSchedule/delete/${id}`)
}

/**
 * 排班表单下拉：科室 + 医生。
 */
export function getScheduleOptions () {
	return request.get('/api/bizSchedule/options')
}
