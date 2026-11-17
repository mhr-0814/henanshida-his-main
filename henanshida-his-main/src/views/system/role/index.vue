<template>
	<div class="role-page">
		<el-card shadow="hover">
			<div class="toolbar">
				<el-form :inline="true" :model="params" class="query-form" @submit.prevent>
					<el-form-item label="角色名称">
						<el-input
							v-model="params.roleName"
							placeholder="请输入角色名称"
							clearable
							style="width: 170px"
							@keyup.enter="handleSearch" />
					</el-form-item>
					<el-form-item label="角色编码">
						<el-input
							v-model="params.roleCode"
							placeholder="请输入角色编码"
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
				<el-button type="primary" @click="openCreate">新增角色</el-button>
			</div>

			<el-table v-loading="loading" :data="tableData" border stripe empty-text="暂无数据">
				<el-table-column label="角色编码" prop="roleCode" min-width="140" />
				<el-table-column label="角色名称" prop="roleName" min-width="120" />
				<el-table-column label="描述" prop="remark" min-width="170" show-overflow-tooltip />
				<el-table-column label="排序" prop="roleSort" width="80" align="center" />
				<el-table-column label="权限数" width="90" align="center">
					<template #default="{ row }">{{ row.permissionCount ?? 0 }}</template>
				</el-table-column>
				<el-table-column label="状态" width="90" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.enabled" type="success">启用</el-tag>
						<el-tag v-else type="danger">禁用</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="创建时间" min-width="170" align="center">
					<template #default="{ row }">{{ formatDateTime(row.createDate, row.createTime) }}</template>
				</el-table-column>
				<el-table-column label="操作" width="210" fixed="right" align="center">
					<template #default="{ row }">
						<el-button type="primary" link @click="openPermissionDialog(row)">分配权限</el-button>
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
			:title="isEdit ? '编辑角色' : '新增角色'"
			width="520px"
			:close-on-click-modal="false"
			@closed="resetForm">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
				<el-form-item label="角色编码" prop="roleCode">
					<el-input v-model="form.roleCode" maxlength="50" show-word-limit placeholder="如：DOCTOR" />
				</el-form-item>
				<el-form-item label="角色名称" prop="roleName">
					<el-input v-model="form.roleName" maxlength="50" show-word-limit placeholder="请输入角色名称" />
				</el-form-item>
				<el-form-item label="描述" prop="remark">
					<el-input
						v-model="form.remark"
						type="textarea"
						:rows="3"
						maxlength="200"
						show-word-limit
						placeholder="请输入角色描述" />
				</el-form-item>
				<el-form-item label="排序" prop="roleSort">
					<el-input-number v-model="form.roleSort" :min="0" :max="9999" controls-position="right" />
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
			v-model="permDialogVisible"
			:title="`分配权限${permTarget ? ' - ' + permTarget.roleName : ''}`"
			width="560px"
			:close-on-click-modal="false">
			<div class="perm-tip">勾选父级会联动子级，保存时同时记录半选的父级节点。</div>
			<el-tree
				ref="treeRef"
				:data="permTree"
				show-checkbox
				node-key="id"
				:props="{ label: 'permName', children: 'children' }"
				default-expand-all
				class="perm-tree" />
			<template #footer>
				<el-button @click="permDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="permSubmitting" @click="submitPermissions">保存</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { nextTick, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addRole, deleteRole, getRolePage, getRolePermissions, saveRolePermissions, updateRole } from '@/api/role'
import { getAllMenus } from '@/api/menu'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const params = reactive({
	pageNo: 1,
	pageSize: 10,
	roleName: '',
	roleCode: '',
	enabled: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = reactive({
	id: null,
	roleCode: '',
	roleName: '',
	remark: '',
	roleSort: 0,
	enabled: true
})

const rules = {
	roleCode: [
		{ required: true, message: '请输入角色编码', trigger: 'blur' },
		{ max: 50, message: '角色编码不能超过 50 个字符', trigger: 'blur' }
	],
	roleName: [
		{ required: true, message: '请输入角色名称', trigger: 'blur' },
		{ max: 50, message: '角色名称不能超过 50 个字符', trigger: 'blur' }
	],
	remark: [{ max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }]
}

function formatDateTime (date, time) {
	if (!date) {
		return '-'
	}
	return time ? `${date} ${time}` : `${date}`
}

/* ---------------------------- 权限分配 ---------------------------- */

const permDialogVisible = ref(false)
const permSubmitting = ref(false)
const permTarget = ref(null)
const permTree = ref([])
const permLeafIds = ref(new Set())
const treeRef = ref()

function buildPermTree (list) {
	const map = new Map()
	list.forEach(item => {
		map.set(item.id, { ...item, children: [] })
	})
	const roots = []
	map.forEach(node => {
		const parent = map.get(node.parentId)
		let attachable = Boolean(parent) && parent.id !== node.id
		if (attachable && (parent.ancestors || '').split(',').includes(String(node.id))) {
			attachable = false
		}
		if (attachable) {
			parent.children.push(node)
		} else {
			roots.push(node)
		}
	})
	permLeafIds.value = new Set([...map.values()].filter(node => node.children.length === 0).map(node => node.id))
	return roots
}

async function openPermissionDialog (row) {
	permTarget.value = row
	permDialogVisible.value = true
	try {
		const body = await getAllMenus()
		permTree.value = buildPermTree(body.data || [])
	} catch {
		permTree.value = []
	}
	let checkedIds = []
	try {
		const body = await getRolePermissions(row.id)
		checkedIds = (body.data || []).filter(id => permLeafIds.value.has(id))
	} catch {
		checkedIds = []
	}
	await nextTick()
	treeRef.value?.setCheckedKeys(checkedIds, false)
}

async function submitPermissions () {
	if (!permTarget.value || !treeRef.value) {
		return
	}
	const ids = [...treeRef.value.getCheckedKeys(), ...treeRef.value.getHalfCheckedKeys()]
	permSubmitting.value = true
	try {
		await saveRolePermissions(permTarget.value.id, ids)
		ElMessage.success('权限分配成功')
		permDialogVisible.value = false
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		permSubmitting.value = false
	}
}

function buildQuery () {
	const query = { pageNo: params.pageNo, pageSize: params.pageSize }
	if (params.roleName) {
		query.roleName = params.roleName.trim()
	}
	if (params.roleCode) {
		query.roleCode = params.roleCode.trim()
	}
	if (typeof params.enabled === 'boolean') {
		query.enabled = params.enabled
	}
	return query
}

async function loadData () {
	loading.value = true
	try {
		const body = await getRolePage(buildQuery())
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
	params.roleName = ''
	params.roleCode = ''
	params.enabled = ''
	params.pageNo = 1
	loadData()
}

function openCreate () {
	isEdit.value = false
	Object.assign(form, {
		id: null,
		roleCode: '',
		roleName: '',
		remark: '',
		roleSort: 0,
		enabled: true
	})
	dialogVisible.value = true
}

function openEdit (row) {
	isEdit.value = true
	Object.assign(form, {
		id: row.id,
		roleCode: row.roleCode,
		roleName: row.roleName,
		remark: row.remark || '',
		roleSort: row.roleSort ?? 0,
		enabled: row.enabled !== false
	})
	dialogVisible.value = true
}

function resetForm () {
	Object.assign(form, {
		id: null,
		roleCode: '',
		roleName: '',
		remark: '',
		roleSort: 0,
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
			roleCode: form.roleCode.trim(),
			roleName: form.roleName.trim(),
			remark: form.remark.trim(),
			roleSort: form.roleSort ?? 0,
			enabled: form.enabled
		}
		if (isEdit.value) {
			await updateRole({ id: form.id, ...payload })
		} else {
			await addRole(payload)
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
		await ElMessageBox.confirm(`确定删除角色“${row.roleName}”吗？`, '删除确认', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		})
	} catch {
		return
	}
	try {
		await deleteRole(row.id)
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
.role-page {
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
	.perm-tip {
		margin-bottom: 10px;
		color: #909399;
		font-size: 13px;
	}
	.perm-tree {
		max-height: 420px;
		overflow-y: auto;
		border: 1px solid #ebeef5;
		border-radius: 4px;
		padding: 8px;
	}
}
</style>
