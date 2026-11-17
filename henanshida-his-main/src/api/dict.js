import request from '@/utils/request'

/* ---------------------------- 字典类型 ---------------------------- */

export function getDictTypePage (params) {
	return request.get('/api/sysDictType/list', { params })
}

export function getAllDictTypes () {
	return request.get('/api/sysDictType/all')
}

export function addDictType (data) {
	return request.post('/api/sysDictType/add', data)
}

export function updateDictType (data) {
	return request.put('/api/sysDictType/update', data)
}

export function deleteDictType (id) {
	return request.delete(`/api/sysDictType/delete/${id}`)
}

/* ---------------------------- 字典数据 ---------------------------- */

export function getDictDataPage (params) {
	return request.get('/api/sysDictData/list', { params })
}

export function addDictData (data) {
	return request.post('/api/sysDictData/add', data)
}

export function updateDictData (data) {
	return request.put('/api/sysDictData/update', data)
}

export function deleteDictData (id) {
	return request.delete(`/api/sysDictData/delete/${id}`)
}
