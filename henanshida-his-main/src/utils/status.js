/**
 * 全站统一的状态 / 分诊级别语义映射。
 * 颜色统一走 Element Plus 语义 type：primary=蓝、warning=橙、success=绿、info=灰、danger=红。
 */

const REG_STATUS = {
	0: { label: '待就诊', type: 'primary' },
	1: { label: '已就诊', type: 'success' },
	2: { label: '已取消', type: 'danger' }
}

const PAY_STATUS = {
	0: { label: '未支付', type: 'warning' },
	1: { label: '已支付', type: 'success' }
}

const QUEUE_STATUS = {
	0: { label: '候诊', type: 'primary' },
	1: { label: '已叫号', type: 'warning' },
	2: { label: '已过号', type: 'info' },
	3: { label: '已完成', type: 'success' },
	9: { label: '已取消', type: 'danger' }
}

const SCHEDULE_STATUS = {
	1: { label: '正常', type: 'success' },
	0: { label: '停诊', type: 'danger' }
}

const TRIAGE_LEVEL = {
	1: { label: '危重', type: 'danger' },
	2: { label: '急', type: 'warning' },
	3: { label: '亚急', type: 'primary' },
	4: { label: '非急', type: 'info' }
}

function pick (map, value, fallbackLabel) {
	return map[value] || { label: fallbackLabel, type: 'info' }
}

export function regStatusLabel (value) {
	return pick(REG_STATUS, value, '未知').label
}

export function regStatusType (value) {
	return pick(REG_STATUS, value, '未知').type
}

export function payStatusLabel (value) {
	return pick(PAY_STATUS, value, '未支付').label
}

export function payStatusType (value) {
	return pick(PAY_STATUS, value, '未支付').type
}

export function queueStatusLabel (value) {
	return pick(QUEUE_STATUS, value, '-').label
}

export function queueStatusType (value) {
	return pick(QUEUE_STATUS, value, '-').type
}

export function scheduleStatusLabel (value) {
	return pick(SCHEDULE_STATUS, value, '-').label
}

export function scheduleStatusType (value) {
	return pick(SCHEDULE_STATUS, value, '-').type
}

export function triageLevelLabel (value) {
	return pick(TRIAGE_LEVEL, value, '未分诊').label
}

export function triageLevelType (value) {
	return pick(TRIAGE_LEVEL, value, '未分诊').type
}
