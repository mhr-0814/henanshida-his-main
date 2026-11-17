<template>
	<div class="dept-page">
		<el-card shadow="hover">
			<div class="toolbar">
				<el-form :inline="true" :model="params" class="query-form" @submit.prevent>
					<el-form-item label="科室名称">
						<el-input
							v-model="params.deptName"
							placeholder="请输入科室名称"
							clearable
							style="width: 180px"
							@keyup.enter="handleSearch" />
					</el-form-item>
					<el-form-item label="科室类别">
						<el-select v-model="params.deptType" placeholder="全部" clearable style="width: 140px">
							<el-option
								v-for="item in deptTypeOptions"
								:key="item.value"
								:label="item.label"
								:value="item.value" />
						</el-select>
					</el-form-item>
					<el-form-item label="状态">
						<el-select v-model="params.enabled" placeholder="全部" clearable style="width: 120px">
							<el-option label="启用" :value="true" />
							<el-option label="禁用" :value="false" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" @click="handleSearch" plain>查询</el-button>
						<el-button @click="handleReset" >重置</el-button>
					</el-form-item>
				</el-form>
				<el-button type="primary" @click="openCreate">新增科室</el-button>
			</div>

			<el-table v-loading="loading" :data="tableData" border stripe>
				<el-table-column label="编号" prop="id" width="80" />
				<el-table-column label="科室名称" prop="deptName" min-width="150" />
				<el-table-column label="科室编码" prop="deptCode" min-width="120" />
				<el-table-column label="科室类别" width="120">
					<template #default="{ row }">{{ deptTypeLabel(row.deptType) }}</template>
				</el-table-column>
				<el-table-column label="状态" width="90" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.enabled" type="success">启用</el-tag>
						<el-tag v-else type="danger">禁用</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="创建日期" prop="createDate" width="120" />
				<el-table-column label="创建时间" prop="createTime" width="110" />
				<el-table-column label="修改日期" prop="updateDate" width="120" />
				<el-table-column label="修改时间" prop="updateTime" width="110" />
				<el-table-column label="操作" width="150" fixed="right" align="center">
					<template #default="{ row }">
						<el-button type="primary" link @click="openEdit(row)">编辑</el-button>
						<el-button type="danger" link @click="handleDelete(row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>

			<el-pagination
				v-model:current-page="params.pageNo"
				v-model:page-size="params.pageSize"
				class="pagination"
				background
				layout="total, sizes, prev, pager, next, jumper"
				:total="total"
				:page-sizes="[6, 10, 20, 50]"
				@size-change="handleSizeChange"
				@current-change="loadData" />
		</el-card>

		<el-dialog
			v-model="dialogVisible"
			:title="isEdit ? '编辑科室' : '新增科室'"
			width="520px"
			:close-on-click-modal="false"
			@closed="resetForm">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-form-item label="科室名称" prop="deptName">
					<el-input v-model="form.deptName" maxlength="100" show-word-limit placeholder="请输入科室名称" />
				</el-form-item>
				<el-form-item label="科室编码" prop="deptCode">
					<el-input v-model="form.deptCode" maxlength="50" show-word-limit placeholder="请输入科室编码" />
				</el-form-item>
				<el-form-item label="科室类别" prop="deptType">
					<el-select v-model="form.deptType" placeholder="请选择科室类别" style="width: 100%">
						<el-option
							v-for="item in deptTypeOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value" />
					</el-select>
				</el-form-item>
				<el-form-item label="状态" prop="enabled">
					<el-switch v-model="form.enabled" active-text="启用" inactive-text="禁用" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addDept, deleteDept, getDeptPage, updateDept } from '@/api/dept'

const deptTypeOptions = [
	{ value: '1', label: '临床科室' },
	{ value: '2', label: '行政科室' },
	{ value: '3', label: '医技科室' }
]

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const params = reactive({
	pageNo: 1,
	pageSize: 10,
	deptName: '',
	deptType: '',
	enabled: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = reactive({
	id: null,
	deptName: '',
	deptCode: '',
	deptType: '1',
	enabled: true
})
const rules = {
	deptName: [
		{ required: true, message: '请输入科室名称', trigger: 'blur' },
		{ max: 100, message: '科室名称不能超过 100 个字符', trigger: 'blur' }
	],
	deptCode: [
		{ required: true, message: '请输入科室编码', trigger: 'blur' },
		{ max: 50, message: '科室编码不能超过 50 个字符', trigger: 'blur' }
	],
	deptType: [{ required: true, message: '请选择科室类别', trigger: 'change' }]
}

function deptTypeLabel (value) {
	return deptTypeOptions.find(item => item.value === value)?.label || '未知'
}

function buildQuery () {
	const query = {
		pageNo: params.pageNo,
		pageSize: params.pageSize
	}
	if (params.deptName) {
		query.deptName = params.deptName.trim()
	}
	if (params.deptType) {
		query.deptType = params.deptType
	}
	if (typeof params.enabled === 'boolean') {
		query.enabled = params.enabled
	}
	return query
}

async function loadData () {
	loading.value = true
	try {
		const body = await getDeptPage(buildQuery())
		tableData.value = body.data?.records || []
		total.value = body.data?.totalRow || 0
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		loading.value = false
	}
}

function handleSearch () {
	params.pageNo = 1
	loadData()
}

function handleReset () {
	params.deptName = ''
	params.deptType = ''
	params.enabled = ''
	params.pageNo = 1
	loadData()
}

function handleSizeChange () {
	params.pageNo = 1
	loadData()
}

function openCreate () {
	isEdit.value = false
	Object.assign(form, { id: null, deptName: '', deptCode: '', deptType: '1', enabled: true })
	dialogVisible.value = true
}

function openEdit (row) {
	isEdit.value = true
	Object.assign(form, {
		id: row.id,
		deptName: row.deptName,
		deptCode: row.deptCode,
		deptType: row.deptType || '1',
		enabled: row.enabled !== false
	})
	dialogVisible.value = true
}

function resetForm () {
	Object.assign(form, { id: null, deptName: '', deptCode: '', deptType: '1', enabled: true })
	formRef.value?.clearValidate()
}

async function submitForm () {
	const valid = await formRef.value.validate().catch(() => false)
	if (!valid) {
		return
	}
	submitting.value = true
	try {
		const payload = {
			deptName: form.deptName.trim(),
			deptCode: form.deptCode.trim(),
			deptType: form.deptType,
			enabled: form.enabled
		}
		if (isEdit.value) {
			await updateDept({ id: form.id, ...payload })
		} else {
			await addDept(payload)
		}
		ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
		dialogVisible.value = false
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理（含后端重复编码等业务提示）
	} finally {
		submitting.value = false
	}
}

async function handleDelete (row) {
	try {
		await ElMessageBox.confirm(`确定删除科室“${row.deptName}”吗？`, '删除确认', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		})
	} catch {
		return
	}
	try {
		await deleteDept(row.id)
		ElMessage.success('删除成功')
		if (tableData.value.length === 1 && params.pageNo > 1) {
			params.pageNo -= 1
		}
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	}
}

loadData()
</script>

<style scoped lang="scss">
.dept-page {
	.toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 12px;
	}
	.query-form {
		flex: 1 1 600px;
		min-width: 0;
	}
	.pagination {
		margin-top: 16px;
		justify-content: flex-end;
	}
}
</style>
