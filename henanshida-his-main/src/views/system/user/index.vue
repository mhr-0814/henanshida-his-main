<template>
	<div class="user-page">
		<el-card shadow="hover">
			<div class="toolbar">
				<el-form :inline="true" :model="params" class="query-form" @submit.prevent>
					<el-form-item label="姓名">
						<el-input
							v-model="params.realName"
							placeholder="请输入姓名"
							clearable
							style="width: 150px"
							@keyup.enter="handleSearch" />
					</el-form-item>
					<el-form-item label="岗位">
						<el-select v-model="params.post" placeholder="全部" clearable style="width: 130px">
							<el-option
								v-for="item in POST_OPTIONS"
								:key="item.value"
								:label="item.label"
								:value="item.value" />
						</el-select>
					</el-form-item>
					<el-form-item label="科室">
						<el-select v-model="params.deptId" placeholder="全部" clearable style="width: 150px">
							<el-option
								v-for="item in deptOptions"
								:key="item.id"
								:label="item.deptName"
								:value="item.id" />
						</el-select>
					</el-form-item>
					<el-form-item label="状态">
						<el-select v-model="params.enabled" placeholder="全部" clearable style="width: 110px">
							<el-option label="启用" :value="true" />
							<el-option label="禁用" :value="false" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" plain @click="handleSearch">查询</el-button>
						<el-button @click="handleReset">重置</el-button>
					</el-form-item>
				</el-form>
				<el-button type="primary" @click="openCreate">新增用户</el-button>
			</div>

			<el-table v-loading="loading" :data="tableData" border stripe empty-text="暂无数据">
				<el-table-column label="工号" prop="employeeNo" width="110" />
				<el-table-column label="账号" prop="username" min-width="120" />
				<el-table-column label="姓名" prop="realName" min-width="100" />
				<el-table-column label="性别" width="75" align="center">
					<template #default="{ row }">{{ genderLabel(row.gender) }}</template>
				</el-table-column>
				<el-table-column label="科室" prop="deptName" min-width="110" />
				<el-table-column label="岗位" width="110" align="center">
					<template #default="{ row }">{{ postLabel(row.post) }}</template>
				</el-table-column>
				<el-table-column label="职称" min-width="110">
					<template #default="{ row }">{{ titleLabel(row.title) }}</template>
				</el-table-column>
				<el-table-column label="手机号" prop="phone" min-width="125" />
				<el-table-column label="角色" prop="roleNames" min-width="150" show-overflow-tooltip>
					<template #default="{ row }">{{ row.roleNames || '未分配' }}</template>
				</el-table-column>
				<el-table-column label="状态" width="85" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.enabled" type="success">启用</el-tag>
						<el-tag v-else type="danger">禁用</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="210" fixed="right" align="center">
					<template #default="{ row }">
						<el-button type="primary" link @click="openRoleDialog(row)">分配角色</el-button>
						<el-button type="primary" link @click="openEdit(row)">编辑</el-button>
						<el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

		<el-dialog
			v-model="dialogVisible"
			:title="isEdit ? '编辑用户' : '新增用户'"
			width="560px"
			:close-on-click-modal="false"
			@closed="resetForm">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
				<el-form-item label="账号" prop="username">
					<el-input v-model="form.username" maxlength="50" show-word-limit placeholder="请输入登录账号" />
				</el-form-item>
				<el-form-item label="密码" prop="password">
					<el-input
						v-model="form.password"
						type="password"
						show-password
						maxlength="72"
						:placeholder="isEdit ? '编辑时留空表示不修改密码' : '请输入密码'" />
				</el-form-item>
				<el-form-item label="姓名" prop="realName">
					<el-input v-model="form.realName" maxlength="50" show-word-limit placeholder="请输入姓名" />
				</el-form-item>
				<el-form-item label="性别" prop="gender">
					<el-radio-group v-model="form.gender">
						<el-radio value="1">男</el-radio>
						<el-radio value="2">女</el-radio>
						<el-radio value="0">未知</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="岗位" prop="post">
					<el-select v-model="form.post" placeholder="请选择岗位" style="width: 100%">
						<el-option
							v-for="item in POST_OPTIONS"
							:key="item.value"
							:label="item.label"
							:value="item.value" />
					</el-select>
				</el-form-item>
				<el-form-item label="科室" prop="deptId">
					<el-select v-model="form.deptId" placeholder="请选择科室" style="width: 100%">
						<el-option
							v-for="item in deptOptions"
							:key="item.id"
							:label="item.deptName"
							:value="item.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="职称" prop="title">
					<el-select
						v-model="form.titleId"
						placeholder="请选择职称"
						clearable
						filterable
						style="width: 100%"
						@change="handleTitleChange">
						<el-option
							v-for="item in titleOptions"
							:key="item.id"
							:label="item.titleName"
							:value="item.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="手机号" prop="phone">
					<el-input v-model="form.phone" maxlength="20" placeholder="请输入手机号" />
				</el-form-item>
				<el-form-item label="邮箱" prop="email">
					<el-input v-model="form.email" maxlength="100" placeholder="请输入邮箱" />
				</el-form-item>
				<el-form-item label="工号" prop="employeeNo">
					<el-input v-model="form.employeeNo" maxlength="50" placeholder="请输入工号" />
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

		<el-dialog
			v-model="roleDialogVisible"
			title="分配角色"
			width="480px"
			:close-on-click-modal="false">
			<div class="role-tip">为「{{ roleTarget?.realName || '' }}」选择角色，可多选：</div>
			<el-checkbox-group v-model="selectedRoleIds" class="role-group">
				<el-checkbox v-for="item in roleOptions" :key="item.id" :value="item.id">
					{{ item.roleName }}（{{ item.roleCode }}）
				</el-checkbox>
			</el-checkbox-group>
			<template #footer>
				<el-button @click="roleDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="roleSubmitting" @click="submitRoles">保存</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeptPage } from '@/api/dept'
import { getAllRoles } from '@/api/role'
import { addSysUser, deleteSysUser, getSysUserPage, getUserRoles, saveUserRoles, updateSysUser } from '@/api/user'
import { getTitleListAll } from '@/api/title'

/* 岗位枚举，与 sys_dict_type=sys_post_type 保持一致 */
const POST_OPTIONS = [
	{ value: 'ADMIN', label: '管理员' },
	{ value: 'DOCTOR', label: '医生' },
	{ value: 'NURSE', label: '护士' },
	{ value: 'CASHIER', label: '收费员' },
	{ value: 'PHARMACIST', label: '药师' },
	{ value: 'TECHNICIAN', label: '技师' }
]

/* 职称字典 sys_title 的 dict_value -> dict_label，历史数据存的是键值 */
const TITLE_LABELS = {
	1: '主任医师',
	2: '副主任医师',
	3: '主治医师',
	4: '住院医师',
	5: '护士长',
	6: '主管护师',
	7: '护师',
	8: '护士',
	9: '主任药师',
	10: '主管药师',
	11: '药师'
}

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const deptOptions = ref([])
const params = reactive({
	pageNo: 1,
	pageSize: 10,
	realName: '',
	post: '',
	deptId: '',
	enabled: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = reactive({
	id: null,
	username: '',
	password: '',
	realName: '',
	gender: '1',
	post: '',
	deptId: '',
	titleId: null,
	title: '',
	phone: '',
	email: '',
	employeeNo: '',
	enabled: true
})

// 职称下拉数据源：sys_title
const titleOptions = ref([])

async function ensureTitleOptions () {
	if (titleOptions.value.length) {
		return
	}
	try {
		const body = await getTitleListAll()
		titleOptions.value = body.data || []
	} catch {
		titleOptions.value = []
	}
}

function handleTitleChange (titleId) {
	const hit = titleOptions.value.find(item => item.id === titleId)
	form.title = hit ? hit.titleName : ''
}

const rules = {
	username: [
		{ required: true, message: '请输入登录账号', trigger: 'blur' },
		{ max: 50, message: '登录账号不能超过 50 个字符', trigger: 'blur' }
	],
	realName: [
		{ required: true, message: '请输入姓名', trigger: 'blur' },
		{ max: 50, message: '姓名不能超过 50 个字符', trigger: 'blur' }
	],
	gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
	post: [{ required: true, message: '请选择岗位', trigger: 'change' }],
	deptId: [{ required: true, message: '请选择科室', trigger: 'change' }],
	password: [
		{
			validator: (rule, value, callback) => {
				if (!isEdit.value && !value) {
					callback(new Error('请输入密码'))
				} else {
					callback()
				}
			},
			trigger: 'blur'
		}
	]
}

function genderLabel (value) {
	return { 0: '未知', 1: '男', 2: '女' }[value] || '未知'
}

function postLabel (value) {
	const hit = POST_OPTIONS.find(item => item.value === value)
	return hit ? hit.label : (value || '-')
}

function titleLabel (value) {
	if (!value) {
		return '-'
	}
	return TITLE_LABELS[value] || value
}

const roleDialogVisible = ref(false)
const roleSubmitting = ref(false)
const roleTarget = ref(null)
const roleOptions = ref([])
const selectedRoleIds = ref([])

async function openRoleDialog (row) {
	roleTarget.value = row
	selectedRoleIds.value = []
	roleDialogVisible.value = true
	if (!roleOptions.value.length) {
		try {
			const body = await getAllRoles()
			roleOptions.value = body.data || []
		} catch {
			roleOptions.value = []
		}
	}
	try {
		const body = await getUserRoles(row.id)
		selectedRoleIds.value = (body.data || []).map(item => item.id)
	} catch {
		selectedRoleIds.value = []
	}
}

async function submitRoles () {
	if (!roleTarget.value) {
		return
	}
	roleSubmitting.value = true
	try {
		await saveUserRoles(roleTarget.value.id, selectedRoleIds.value)
		ElMessage.success('角色分配成功')
		roleDialogVisible.value = false
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		roleSubmitting.value = false
	}
}

async function loadDeptOptions () {
	try {
		const body = await getDeptPage({ pageNo: 1, pageSize: 100 })
		deptOptions.value = body.data?.records || []
	} catch {
		deptOptions.value = []
	}
}

function buildQuery () {
	const query = { pageNo: params.pageNo, pageSize: params.pageSize }
	if (params.realName) {
		query.realName = params.realName.trim()
	}
	if (params.post) {
		query.post = params.post
	}
	if (params.deptId) {
		query.deptId = params.deptId
	}
	if (typeof params.enabled === 'boolean') {
		query.enabled = params.enabled
	}
	return query
}

async function loadData () {
	loading.value = true
	try {
		const body = await getSysUserPage(buildQuery())
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
	params.realName = ''
	params.post = ''
	params.deptId = ''
	params.enabled = ''
	params.pageNo = 1
	loadData()
}

function openCreate () {
	isEdit.value = false
	Object.assign(form, {
		id: null,
		username: '',
		password: '',
		realName: '',
		gender: '1',
		post: '',
		deptId: '',
		titleId: null,
		title: '',
		phone: '',
		email: '',
		employeeNo: '',
		enabled: true
	})
	dialogVisible.value = true
	ensureTitleOptions()
}

function openEdit (row) {
	isEdit.value = true
	const legacyTitleName = TITLE_LABELS[row.title] || row.title || ''
	Object.assign(form, {
		id: row.id,
		username: row.username,
		password: '',
		realName: row.realName,
		gender: row.gender || '0',
		post: row.post || '',
		deptId: row.deptId,
		titleId: row.titleId || null,
		title: legacyTitleName,
		phone: row.phone || '',
		email: row.email || '',
		employeeNo: row.employeeNo || '',
		enabled: row.enabled !== false
	})
	dialogVisible.value = true
	// 历史数据只有职称名称（或字典键值）时，按名称反查 titleId，避免编辑后提交不上职称
	ensureTitleOptions().then(() => {
		if (form.titleId || !form.title || form.id !== row.id) {
			return
		}
		const hit = titleOptions.value.find(item => item.titleName === form.title)
		if (hit) {
			form.titleId = hit.id
		}
	})
}

function resetForm () {
	Object.assign(form, {
		id: null,
		username: '',
		password: '',
		realName: '',
		gender: '1',
		post: '',
		deptId: '',
		titleId: null,
		title: '',
		phone: '',
		email: '',
		employeeNo: '',
		enabled: true
	})
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
			username: form.username.trim(),
			realName: form.realName.trim(),
			gender: form.gender,
			post: form.post,
			deptId: form.deptId,
			titleId: form.titleId || null,
			title: form.title?.trim() || null,
			phone: form.phone.trim(),
			email: form.email.trim(),
			employeeNo: form.employeeNo.trim(),
			enabled: form.enabled
		}
		if (form.password) {
			payload.password = form.password
		}
		if (isEdit.value) {
			await updateSysUser({ id: form.id, ...payload })
		} else {
			await addSysUser(payload)
		}
		ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
		dialogVisible.value = false
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		submitting.value = false
	}
}

async function handleDelete (row) {
	try {
		await ElMessageBox.confirm(`确定删除用户“${row.realName}”吗？`, '删除确认', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		})
	} catch {
		return
	}
	try {
		await deleteSysUser(row.id)
		ElMessage.success('删除成功')
		if (tableData.value.length === 1 && params.pageNo > 1) {
			params.pageNo -= 1
		}
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	}
}

loadDeptOptions()
loadData()
</script>

<style scoped lang="scss">
.user-page {
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
	.role-tip {
		margin-bottom: 12px;
		color: #606266;
		font-size: 13px;
	}
	.role-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 320px;
		overflow-y: auto;
	}
}
</style>
