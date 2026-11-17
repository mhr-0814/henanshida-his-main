<template>
	<div class="dict-page">
		<el-row :gutter="16">
			<el-col :span="7">
				<el-card shadow="hover" class="type-card">
					<template #header>
						<div class="card-header">
							<span>字典类型</span>
							<el-button type="primary" size="small" @click="openTypeCreate">新增类型</el-button>
						</div>
					</template>
					<el-table
						:data="typeList"
						highlight-current-row
						empty-text="暂无数据"
						@current-change="handleTypeChange">
						<el-table-column label="字典名称" prop="dictName" min-width="110" />
						<el-table-column label="字典类型" prop="dictType" min-width="130" show-overflow-tooltip />
						<el-table-column label="状态" width="80" align="center">
							<template #default="{ row }">
								<el-tag v-if="row.enabled" type="success">启用</el-tag>
								<el-tag v-else type="danger">禁用</el-tag>
							</template>
						</el-table-column>
					</el-table>
				</el-card>
			</el-col>

			<el-col :span="17">
				<el-card shadow="hover" class="data-card">
					<template #header>
						<div class="card-header">
							<span>字典数据{{ selectedType ? '（' + selectedType.dictType + '）' : '' }}</span>
							<div>
								<el-button
									size="small"
									:disabled="!selectedType"
									@click="openTypeEdit">编辑类型</el-button>
								<el-button
									size="small"
									type="danger"
									:disabled="!selectedType"
									@click="handleTypeDelete">删除类型</el-button>
								<el-button
									size="small"
									type="primary"
									:disabled="!selectedType"
									@click="openDataCreate">新增数据</el-button>
							</div>
						</div>
					</template>

					<el-form :inline="true" :model="params" class="query-form" @submit.prevent>
						<el-form-item label="字典标签">
							<el-input
								v-model="params.dictLabel"
								placeholder="请输入字典标签"
								clearable
								style="width: 170px"
								@keyup.enter="handleSearch" />
						</el-form-item>
						<el-form-item label="状态">
							<el-select v-model="params.enabled" placeholder="全部" clearable style="width: 120px">
								<el-option label="启用" :value="true" />
								<el-option label="禁用" :value="false" />
							</el-select>
						</el-form-item>
						<el-form-item>
							<el-button type="primary" plain @click="handleSearch">查询</el-button>
							<el-button @click="handleReset">重置</el-button>
						</el-form-item>
					</el-form>

					<el-table v-loading="dataLoading" :data="dataList" border stripe empty-text="暂无数据">
						<el-table-column label="字典标签" prop="dictLabel" min-width="140" />
						<el-table-column label="字典键值" prop="dictValue" min-width="120" />
						<el-table-column label="回显样式" prop="listClass" min-width="100" />
						<el-table-column label="排序" prop="orderNum" width="70" align="center" />
						<el-table-column label="默认" width="80" align="center">
							<template #default="{ row }">{{ row.isDefault ? '是' : '否' }}</template>
						</el-table-column>
						<el-table-column label="状态" width="90" align="center">
							<template #default="{ row }">
								<el-tag v-if="row.enabled" type="success">启用</el-tag>
								<el-tag v-else type="danger">禁用</el-tag>
							</template>
						</el-table-column>
						<el-table-column label="操作" width="150" fixed="right" align="center">
							<template #default="{ row }">
								<el-button type="primary" link @click="openDataEdit(row)">编辑</el-button>
								<el-button type="danger" link @click="handleDataDelete(row)">删除</el-button>
							</template>
						</el-table-column>
					</el-table>

					<div class="pagination-bar">
						<span class="total-text">共 {{ total }} 条</span>
						<el-pagination
							v-model:current-page="params.pageNo"
							:page-size="params.pageSize"
							background
							layout="prev, pager, next"
							:total="total"
							@current-change="loadData" />
					</div>
				</el-card>
			</el-col>
		</el-row>

		<!-- 字典类型弹窗 -->
		<el-dialog
			v-model="typeDialogVisible"
			:title="typeIsEdit ? '编辑字典类型' : '新增字典类型'"
			width="480px"
			:close-on-click-modal="false"
			@closed="resetTypeForm">
			<el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="100px">
				<el-form-item label="字典名称" prop="dictName">
					<el-input v-model="typeForm.dictName" maxlength="100" show-word-limit placeholder="如：用户性别" />
				</el-form-item>
				<el-form-item label="字典类型" prop="dictType">
					<el-input v-model="typeForm.dictType" maxlength="100" placeholder="如：sys_user_sex" />
				</el-form-item>
				<el-form-item label="备注" prop="remark">
					<el-input
						v-model="typeForm.remark"
						type="textarea"
						:rows="2"
						maxlength="500"
						show-word-limit
						placeholder="请输入备注" />
				</el-form-item>
				<el-form-item label="状态" prop="enabled">
					<el-switch v-model="typeForm.enabled" active-text="启用" inactive-text="禁用" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="typeDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="typeSubmitting" @click="submitTypeForm">确定</el-button>
			</template>
		</el-dialog>

		<!-- 字典数据弹窗 -->
		<el-dialog
			v-model="dataDialogVisible"
			:title="dataIsEdit ? '编辑字典数据' : '新增字典数据'"
			width="560px"
			:close-on-click-modal="false"
			@closed="resetDataForm">
			<el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="100px">
				<el-form-item label="字典类型">
					<el-input :model-value="dataForm.dictType" disabled />
				</el-form-item>
				<el-form-item label="字典标签" prop="dictLabel">
					<el-input v-model="dataForm.dictLabel" maxlength="100" show-word-limit placeholder="如：男" />
				</el-form-item>
				<el-form-item label="字典键值" prop="dictValue">
					<el-input v-model="dataForm.dictValue" maxlength="100" placeholder="如：1" />
				</el-form-item>
				<el-form-item label="回显样式" prop="listClass">
					<el-select v-model="dataForm.listClass" placeholder="请选择" clearable style="width: 100%">
						<el-option label="默认" value="default" />
						<el-option label="主要" value="primary" />
						<el-option label="成功" value="success" />
						<el-option label="信息" value="info" />
						<el-option label="警告" value="warning" />
						<el-option label="危险" value="danger" />
					</el-select>
				</el-form-item>
				<el-form-item label="排序" prop="orderNum">
					<el-input-number v-model="dataForm.orderNum" :min="0" :max="9999" controls-position="right" />
				</el-form-item>
				<el-form-item label="是否默认" prop="isDefault">
					<el-switch v-model="dataForm.isDefault" active-text="是" inactive-text="否" />
				</el-form-item>
				<el-form-item label="状态" prop="enabled">
					<el-switch v-model="dataForm.enabled" active-text="启用" inactive-text="禁用" />
				</el-form-item>
				<el-form-item label="备注" prop="remark">
					<el-input
						v-model="dataForm.remark"
						type="textarea"
						:rows="2"
						maxlength="500"
						show-word-limit
						placeholder="请输入备注" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="dataDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="dataSubmitting" @click="submitDataForm">确定</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
	addDictData,
	addDictType,
	deleteDictData,
	deleteDictType,
	getAllDictTypes,
	getDictDataPage,
	updateDictData,
	updateDictType
} from '@/api/dict'

const typeList = ref([])
const selectedType = ref(null)

const dataLoading = ref(false)
const dataList = ref([])
const total = ref(0)
const params = reactive({
	pageNo: 1,
	pageSize: 10,
	dictLabel: '',
	enabled: ''
})

const typeDialogVisible = ref(false)
const typeIsEdit = ref(false)
const typeSubmitting = ref(false)
const typeFormRef = ref()
const typeForm = reactive({
	id: null,
	dictName: '',
	dictType: '',
	remark: '',
	enabled: true
})
const typeRules = {
	dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
	dictType: [{ required: true, message: '请输入字典类型编码', trigger: 'blur' }]
}

const dataDialogVisible = ref(false)
const dataIsEdit = ref(false)
const dataSubmitting = ref(false)
const dataFormRef = ref()
const dataForm = reactive({
	id: null,
	dictType: '',
	dictLabel: '',
	dictValue: '',
	listClass: '',
	orderNum: 0,
	isDefault: false,
	remark: '',
	enabled: true
})
const dataRules = {
	dictLabel: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
	dictValue: [{ required: true, message: '请输入字典键值', trigger: 'blur' }]
}

async function loadTypes () {
	try {
		const body = await getAllDictTypes()
		typeList.value = body.data || []
		const current = typeList.value.find(item => item.dictType === selectedType.value?.dictType)
		selectedType.value = current || typeList.value[0] || null
	} catch {
		typeList.value = []
		selectedType.value = null
	}
}

function handleTypeChange (row) {
	if (!row) {
		return
	}
	selectedType.value = row
	params.pageNo = 1
	loadData()
}

function buildQuery () {
	const query = { pageNo: params.pageNo, pageSize: params.pageSize }
	if (selectedType.value) {
		query.dictType = selectedType.value.dictType
	}
	if (params.dictLabel) {
		query.dictLabel = params.dictLabel.trim()
	}
	if (typeof params.enabled === 'boolean') {
		query.enabled = params.enabled
	}
	return query
}

async function loadData () {
	if (!selectedType.value) {
		dataList.value = []
		total.value = 0
		return
	}
	dataLoading.value = true
	try {
		const body = await getDictDataPage(buildQuery())
		dataList.value = body.data?.records || []
		total.value = body.data?.totalRow || 0
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		dataLoading.value = false
	}
}

function handleSearch () {
	params.pageNo = 1
	loadData()
}

function handleReset () {
	params.dictLabel = ''
	params.enabled = ''
	params.pageNo = 1
	loadData()
}

/* ---------------------------- 字典类型操作 ---------------------------- */

function openTypeCreate () {
	typeIsEdit.value = false
	Object.assign(typeForm, { id: null, dictName: '', dictType: '', remark: '', enabled: true })
	typeDialogVisible.value = true
}

function openTypeEdit () {
	if (!selectedType.value) {
		return
	}
	typeIsEdit.value = true
	Object.assign(typeForm, {
		id: selectedType.value.id,
		dictName: selectedType.value.dictName,
		dictType: selectedType.value.dictType,
		remark: selectedType.value.remark || '',
		enabled: selectedType.value.enabled !== false
	})
	typeDialogVisible.value = true
}

function resetTypeForm () {
	Object.assign(typeForm, { id: null, dictName: '', dictType: '', remark: '', enabled: true })
	typeFormRef.value?.clearValidate()
}

async function submitTypeForm () {
	const valid = await typeFormRef.value.validate().catch(() => false)
	if (!valid) {
		return
	}
	typeSubmitting.value = true
	try {
		const payload = {
			dictName: typeForm.dictName.trim(),
			dictType: typeForm.dictType.trim(),
			remark: typeForm.remark.trim(),
			enabled: typeForm.enabled
		}
		if (typeIsEdit.value) {
			await updateDictType({ id: typeForm.id, ...payload })
		} else {
			await addDictType(payload)
		}
		ElMessage.success(typeIsEdit.value ? '修改成功' : '新增成功')
		typeDialogVisible.value = false
		await loadTypes()
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		typeSubmitting.value = false
	}
}

async function handleTypeDelete () {
	if (!selectedType.value) {
		return
	}
	try {
		await ElMessageBox.confirm(`确定删除字典类型“${selectedType.value.dictName}”吗？`, '删除确认', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		})
	} catch {
		return
	}
	try {
		await deleteDictType(selectedType.value.id)
		ElMessage.success('删除成功')
		selectedType.value = null
		await loadTypes()
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	}
}

/* ---------------------------- 字典数据操作 ---------------------------- */

function openDataCreate () {
	if (!selectedType.value) {
		return
	}
	dataIsEdit.value = false
	Object.assign(dataForm, {
		id: null,
		dictType: selectedType.value.dictType,
		dictLabel: '',
		dictValue: '',
		listClass: '',
		orderNum: 0,
		isDefault: false,
		remark: '',
		enabled: true
	})
	dataDialogVisible.value = true
}

function openDataEdit (row) {
	dataIsEdit.value = true
	Object.assign(dataForm, {
		id: row.id,
		dictType: row.dictType,
		dictLabel: row.dictLabel,
		dictValue: row.dictValue,
		listClass: row.listClass || '',
		orderNum: row.orderNum ?? 0,
		isDefault: row.isDefault === true,
		remark: row.remark || '',
		enabled: row.enabled !== false
	})
	dataDialogVisible.value = true
}

function resetDataForm () {
	Object.assign(dataForm, {
		id: null,
		dictType: '',
		dictLabel: '',
		dictValue: '',
		listClass: '',
		orderNum: 0,
		isDefault: false,
		remark: '',
		enabled: true
	})
	dataFormRef.value?.clearValidate()
}

async function submitDataForm () {
	const valid = await dataFormRef.value.validate().catch(() => false)
	if (!valid) {
		return
	}
	dataSubmitting.value = true
	try {
		const payload = {
			dictType: dataForm.dictType,
			dictLabel: dataForm.dictLabel.trim(),
			dictValue: dataForm.dictValue.trim(),
			listClass: dataForm.listClass,
			orderNum: dataForm.orderNum ?? 0,
			isDefault: dataForm.isDefault,
			remark: dataForm.remark.trim(),
			enabled: dataForm.enabled
		}
		if (dataIsEdit.value) {
			await updateDictData({ id: dataForm.id, ...payload })
		} else {
			await addDictData(payload)
		}
		ElMessage.success(dataIsEdit.value ? '修改成功' : '新增成功')
		dataDialogVisible.value = false
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		dataSubmitting.value = false
	}
}

async function handleDataDelete (row) {
	try {
		await ElMessageBox.confirm(`确定删除字典数据“${row.dictLabel}”吗？`, '删除确认', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		})
	} catch {
		return
	}
	try {
		await deleteDictData(row.id)
		ElMessage.success('删除成功')
		if (dataList.value.length === 1 && params.pageNo > 1) {
			params.pageNo -= 1
		}
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	}
}

loadTypes().then(() => loadData())
</script>

<style scoped lang="scss">
.dict-page {
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.query-form {
		margin-bottom: 4px;
	}
	.pagination-bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 16px;
		.total-text {
			color: #606266;
			font-size: 13px;
		}
	}
}
</style>
