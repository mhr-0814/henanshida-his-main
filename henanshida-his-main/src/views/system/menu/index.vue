<template>
	<div class="menu-page">
		<el-card shadow="hover">
			<div class="toolbar">
				<el-form :inline="true" :model="params" class="query-form" @submit.prevent>
					<el-form-item label="菜单名称">
						<el-input
							v-model="params.permName"
							placeholder="请输入菜单名称"
							clearable
							style="width: 170px"
							@keyup.enter="handleSearch" />
					</el-form-item>
					<el-form-item label="类型">
						<el-select v-model="params.permType" placeholder="全部" clearable style="width: 130px">
							<el-option label="目录" value="M" />
							<el-option label="菜单" value="C" />
							<el-option label="按钮" value="F" />
						</el-select>
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
				<el-button type="primary" @click="openCreate">新增菜单</el-button>
			</div>

			<el-table v-loading="loading" :data="tableData" border stripe empty-text="暂无数据">
				<el-table-column label="菜单名称" min-width="160">
					<template #default="{ row }">
						<span :style="{ paddingLeft: indentOf(row) + 'px' }">{{ row.permName }}</span>
					</template>
				</el-table-column>
				<el-table-column label="父级菜单" min-width="130">
					<template #default="{ row }">{{ row.parentName || '顶级' }}</template>
				</el-table-column>
				<el-table-column label="类型" width="90" align="center">
					<template #default="{ row }">
						<el-tag :type="typeTag(row.permType)">{{ typeLabel(row.permType) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="路由路径" prop="path" min-width="110" />
				<el-table-column label="权限标识" prop="permCode" min-width="170" show-overflow-tooltip />
				<el-table-column label="排序" prop="orderNum" width="70" align="center" />
				<el-table-column label="状态" width="90" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.enabled" type="success">启用</el-tag>
						<el-tag v-else type="danger">禁用</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="150" fixed="right" align="center">
					<template #default="{ row }">
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
			:title="isEdit ? '编辑菜单' : '新增菜单'"
			width="620px"
			:close-on-click-modal="false"
			@closed="resetForm">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-form-item label="父级菜单" prop="parentId">
					<el-select v-model="form.parentId" placeholder="请选择父级菜单" style="width: 100%">
						<el-option label="顶级" :value="0" />
						<el-option
							v-for="item in parentOptions"
							:key="item.id"
							:label="item.permName"
							:value="item.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="菜单类型" prop="permType">
					<el-radio-group v-model="form.permType">
						<el-radio value="M">目录</el-radio>
						<el-radio value="C">菜单</el-radio>
						<el-radio value="F">按钮</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="菜单名称" prop="permName">
					<el-input v-model="form.permName" maxlength="100" show-word-limit placeholder="请输入菜单名称" />
				</el-form-item>
				<el-form-item label="权限标识" prop="permCode">
					<el-input v-model="form.permCode" maxlength="100" placeholder="如：system:user:add" />
				</el-form-item>
				<el-form-item label="路由路径" prop="path">
					<el-input v-model="form.path" maxlength="200" placeholder="如：/user" />
				</el-form-item>
				<el-form-item label="组件路径" prop="component">
					<el-input v-model="form.component" maxlength="200" placeholder="如：system/user/index" />
				</el-form-item>
				<el-form-item label="图标" prop="icon">
					<el-input v-model="form.icon" maxlength="100" placeholder="如：icon-user" />
				</el-form-item>
				<el-form-item label="排序" prop="orderNum">
					<el-input-number v-model="form.orderNum" :min="0" :max="9999" controls-position="right" />
				</el-form-item>
				<el-form-item label="菜单可见" prop="visible">
					<el-switch v-model="form.visible" active-text="显示" inactive-text="隐藏" />
				</el-form-item>
				<el-form-item label="是否外链" prop="isExternal">
					<el-switch v-model="form.isExternal" active-text="是" inactive-text="否" />
				</el-form-item>
				<el-form-item label="状态" prop="enabled">
					<el-switch v-model="form.enabled" active-text="启用" inactive-text="禁用" />
				</el-form-item>
				<el-form-item label="备注" prop="remark">
					<el-input
						v-model="form.remark"
						type="textarea"
						:rows="2"
						maxlength="500"
						show-word-limit
						placeholder="请输入备注" />
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
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addMenu, deleteMenu, getAllMenus, getMenuPage, updateMenu } from '@/api/menu'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const allMenus = ref([])
const params = reactive({
	pageNo: 1,
	pageSize: 10,
	permName: '',
	permType: '',
	enabled: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = reactive({
	id: null,
	parentId: 0,
	permType: 'C',
	permName: '',
	permCode: '',
	path: '',
	component: '',
	icon: '',
	orderNum: 0,
	visible: true,
	isExternal: false,
	enabled: true,
	remark: ''
})

const rules = {
	permName: [
		{ required: true, message: '请输入菜单名称', trigger: 'blur' },
		{ max: 100, message: '菜单名称不能超过 100 个字符', trigger: 'blur' }
	],
	permType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
	remark: [{ max: 500, message: '备注不能超过 500 个字符', trigger: 'blur' }]
}

const parentOptions = computed(() =>
	allMenus.value.filter(item => !isEdit.value || item.id !== form.id)
)

function typeLabel (value) {
	return { M: '目录', C: '菜单', F: '按钮' }[value] || value
}

function typeTag (value) {
	return { M: 'warning', C: 'success', F: 'info' }[value] || 'info'
}

function indentOf (row) {
	if (!row.ancestors) {
		return 0
	}
	const depth = row.ancestors.split(',').filter(Boolean).length
	return Math.max(0, depth - 1) * 16
}

function buildQuery () {
	const query = { pageNo: params.pageNo, pageSize: params.pageSize }
	if (params.permName) {
		query.permName = params.permName.trim()
	}
	if (params.permType) {
		query.permType = params.permType
	}
	if (typeof params.enabled === 'boolean') {
		query.enabled = params.enabled
	}
	return query
}

async function loadAllMenus () {
	try {
		const body = await getAllMenus()
		allMenus.value = body.data || []
	} catch {
		allMenus.value = []
	}
}

async function loadData () {
	loading.value = true
	try {
		const body = await getMenuPage(buildQuery())
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
	params.permName = ''
	params.permType = ''
	params.enabled = ''
	params.pageNo = 1
	loadData()
}

function openCreate () {
	isEdit.value = false
	Object.assign(form, {
		id: null,
		parentId: 0,
		permType: 'C',
		permName: '',
		permCode: '',
		path: '',
		component: '',
		icon: '',
		orderNum: 0,
		visible: true,
		isExternal: false,
		enabled: true,
		remark: ''
	})
	dialogVisible.value = true
}

function openEdit (row) {
	isEdit.value = true
	Object.assign(form, {
		id: row.id,
		parentId: row.parentId ?? 0,
		permType: row.permType || 'C',
		permName: row.permName,
		permCode: row.permCode || '',
		path: row.path || '',
		component: row.component || '',
		icon: row.icon || '',
		orderNum: row.orderNum ?? 0,
		visible: row.visible !== false,
		isExternal: row.isExternal === true,
		enabled: row.enabled !== false,
		remark: row.remark || ''
	})
	dialogVisible.value = true
}

function resetForm () {
	Object.assign(form, {
		id: null,
		parentId: 0,
		permType: 'C',
		permName: '',
		permCode: '',
		path: '',
		component: '',
		icon: '',
		orderNum: 0,
		visible: true,
		isExternal: false,
		enabled: true,
		remark: ''
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
			parentId: form.parentId ?? 0,
			permType: form.permType,
			permName: form.permName.trim(),
			permCode: form.permCode.trim(),
			path: form.path.trim(),
			component: form.component.trim(),
			icon: form.icon.trim(),
			orderNum: form.orderNum ?? 0,
			visible: form.visible,
			isExternal: form.isExternal,
			enabled: form.enabled,
			remark: form.remark.trim()
		}
		if (isEdit.value) {
			await updateMenu({ id: form.id, ...payload })
		} else {
			await addMenu(payload)
		}
		ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
		dialogVisible.value = false
		await Promise.all([loadData(), loadAllMenus()])
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		submitting.value = false
	}
}

async function handleDelete (row) {
	try {
		await ElMessageBox.confirm(`确定删除菜单“${row.permName}”吗？`, '删除确认', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		})
	} catch {
		return
	}
	try {
		await deleteMenu(row.id)
		ElMessage.success('删除成功')
		if (tableData.value.length === 1 && params.pageNo > 1) {
			params.pageNo -= 1
		}
		await Promise.all([loadData(), loadAllMenus()])
	} catch {
		// 错误提示由 request 拦截器统一处理
	}
}

loadAllMenus()
loadData()
</script>

<style scoped lang="scss">
.menu-page {
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
}
</style>
