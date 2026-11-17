<template>
	<div class="schedule-page">
		<el-card shadow="hover">
			<div class="toolbar">
				<el-form :inline="true" :model="params" class="query-form" @submit.prevent>
					<el-form-item label="科室">
						<el-select
							v-model="params.deptId"
							placeholder="全部"
							clearable
							style="width: 150px"
							@change="handleDeptChange">
							<el-option
								v-for="item in deptOptions"
								:key="item.id"
								:label="item.deptName"
								:value="item.id" />
						</el-select>
					</el-form-item>
					<el-form-item label="医生">
						<el-select v-model="params.doctorId" placeholder="全部" clearable style="width: 150px">
							<el-option
								v-for="item in filterDoctors(params.deptId)"
								:key="item.id"
								:label="item.realName"
								:value="item.id" />
						</el-select>
					</el-form-item>
					<el-form-item label="日期">
						<el-date-picker
							v-model="dateRange"
							type="daterange"
							value-format="YYYY-MM-DD"
							range-separator="至"
							start-placeholder="开始日期"
							end-placeholder="结束日期"
							style="width: 240px" />
					</el-form-item>
					<el-form-item label="状态">
						<el-select v-model="params.status" placeholder="全部" clearable style="width: 120px">
							<el-option label="正常" value="1" />
							<el-option label="停诊" value="2" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" plain @click="handleSearch">查询</el-button>
						<el-button @click="handleReset">重置</el-button>
					</el-form-item>
				</el-form>
				<el-button type="primary" @click="openCreate">新增排班</el-button>
			</div>

			<el-table v-loading="loading" :data="tableData" border stripe>
				<el-table-column label="日期" prop="scheduleDate" width="115" class-name="num-col" />
				<el-table-column label="时段" width="80" align="center">
					<template #default="{ row }">{{ periodLabel(row.period) }}</template>
				</el-table-column>
				<el-table-column label="科室" prop="deptName" min-width="120" />
				<el-table-column label="医生" prop="doctorName" width="100" />
				<el-table-column label="职称" prop="titleName" width="100" />
				<el-table-column label="诊室" prop="clinicRoom" width="90" />
				<el-table-column label="挂号费" width="90" align="right" class-name="num-col">
					<template #default="{ row }">{{ formatFee(row.regFee) }}</template>
				</el-table-column>
				<el-table-column label="号源" width="150" align="center" class-name="num-col">
					<template #default="{ row }">
						<span>{{ row.usedQuota }} / {{ row.totalQuota }}</span>
						<el-tag :type="row.remaining > 0 ? 'success' : 'danger'" size="small" style="margin-left: 6px">
							余 {{ row.remaining }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="状态" width="80" align="center">
					<template #default="{ row }">
						<el-tag :type="scheduleStatusType(row.status)">{{ scheduleStatusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="210" fixed="right" align="center">
					<template #default="{ row }">
						<el-button type="primary" link @click="openEdit(row)">编辑</el-button>
						<el-button
							:type="row.status === '1' ? 'warning' : 'success'"
							link
							@click="handleChangeStatus(row)">
							{{ row.status === '1' ? '停诊' : '恢复' }}
						</el-button>
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
				:page-sizes="[10, 20, 50]"
				@size-change="handleSizeChange"
				@current-change="loadData" />
		</el-card>

		<el-dialog
			v-model="dialogVisible"
			:title="isEdit ? '编辑排班' : '新增排班'"
			width="560px"
			:close-on-click-modal="false"
			@closed="resetForm">
			<el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
				<el-form-item label="排班日期" prop="scheduleDate">
					<el-date-picker
						v-model="form.scheduleDate"
						type="date"
						value-format="YYYY-MM-DD"
						placeholder="请选择日期"
						style="width: 100%" />
				</el-form-item>
				<el-form-item label="时段" prop="period">
					<el-radio-group v-model="form.period">
						<el-radio value="1">上午</el-radio>
						<el-radio value="2">下午</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="科室" prop="deptId">
					<el-select v-model="form.deptId" placeholder="请选择科室" style="width: 100%" @change="handleFormDeptChange">
						<el-option
							v-for="item in deptOptions"
							:key="item.id"
							:label="item.deptName"
							:value="item.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="医生" prop="doctorId">
					<el-select v-model="form.doctorId" placeholder="请选择医生" style="width: 100%">
						<el-option
							v-for="item in filterDoctors(form.deptId)"
							:key="item.id"
							:label="item.realName"
							:value="item.id" />
					</el-select>
				</el-form-item>
				<el-form-item v-if="selectedDoctor" label="职称/挂号费">
					<span>{{ selectedDoctor.title || '未配置' }} / {{ formatFee(selectedDoctor.regFee) }}</span>
				</el-form-item>
				<el-form-item label="号源数量" prop="totalQuota">
					<el-input-number v-model="form.totalQuota" :min="0" :max="999" style="width: 180px" />
				</el-form-item>
				<el-form-item label="诊室">
					<el-input v-model="form.clinicRoom" maxlength="50" placeholder="如 3 楼 302" />
				</el-form-item>
				<el-form-item label="备注">
					<el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
	addSchedule,
	changeScheduleStatus,
	deleteSchedule,
	getScheduleOptions,
	getSchedulePage,
	updateSchedule
} from '@/api/schedule'
import { scheduleStatusLabel, scheduleStatusType } from '@/utils/status'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const deptOptions = ref([])
const doctorOptions = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const params = reactive({
	pageNo: 1,
	pageSize: 10,
	deptId: '',
	doctorId: '',
	status: ''
})

const form = reactive({
	id: null,
	scheduleDate: '',
	period: '1',
	deptId: '',
	doctorId: '',
	totalQuota: 20,
	clinicRoom: '',
	remark: ''
})

const rules = {
	scheduleDate: [{ required: true, message: '请选择排班日期', trigger: 'change' }],
	period: [{ required: true, message: '请选择时段', trigger: 'change' }],
	deptId: [{ required: true, message: '请选择科室', trigger: 'change' }],
	doctorId: [{ required: true, message: '请选择医生', trigger: 'change' }],
	totalQuota: [{ required: true, message: '请填写号源数量', trigger: 'blur' }]
}

const selectedDoctor = computed(() => {
	if (!form.doctorId) {
		return null
	}
	return doctorOptions.value.find(item => item.id === form.doctorId) || null
})

function filterDoctors (deptId) {
	if (!deptId) {
		return doctorOptions.value
	}
	return doctorOptions.value.filter(item => item.deptId === deptId)
}

function periodLabel (period) {
	return period === '2' ? '下午' : '上午'
}

function formatFee (fee) {
	if (fee === null || fee === undefined || fee === '') {
		return '-'
	}
	return `¥${Number(fee).toFixed(2)}`
}

async function loadOptions () {
	try {
		const res = await getScheduleOptions()
		const data = res.data || {}
		deptOptions.value = data.depts || []
		doctorOptions.value = data.doctors || []
	} catch (e) {
		// 拦截器已提示
	}
}

async function loadData () {
	loading.value = true
	try {
		const res = await getSchedulePage({
			...params,
			startDate: dateRange.value?.[0] || '',
			endDate: dateRange.value?.[1] || ''
		})
		tableData.value = res.data?.records || []
		total.value = res.data?.totalRow || 0
	} finally {
		loading.value = false
	}
}

function handleSearch () {
	params.pageNo = 1
	loadData()
}

function handleReset () {
	params.deptId = ''
	params.doctorId = ''
	params.status = ''
	dateRange.value = []
	handleSearch()
}

function handleDeptChange () {
	params.doctorId = ''
}

function handleSizeChange () {
	params.pageNo = 1
	loadData()
}

function resetForm () {
	form.id = null
	form.scheduleDate = ''
	form.period = '1'
	form.deptId = ''
	form.doctorId = ''
	form.totalQuota = 20
	form.clinicRoom = ''
	form.remark = ''
}

function openCreate () {
	isEdit.value = false
	resetForm()
	dialogVisible.value = true
}

function openEdit (row) {
	isEdit.value = true
	form.id = row.id
	form.scheduleDate = row.scheduleDate
	form.period = row.period
	form.deptId = row.deptId
	form.doctorId = row.doctorId
	form.totalQuota = row.totalQuota
	form.clinicRoom = row.clinicRoom || ''
	form.remark = row.remark || ''
	dialogVisible.value = true
}

function handleFormDeptChange () {
	form.doctorId = ''
}

async function submitForm () {
	if (!formRef.value) {
		return
	}
	const valid = await formRef.value.validate().catch(() => false)
	if (!valid) {
		return
	}
	submitting.value = true
	try {
		const payload = { ...form }
		if (isEdit.value) {
			await updateSchedule(payload)
			ElMessage.success('排班已更新')
		} else {
			await addSchedule(payload)
			ElMessage.success('排班已新增')
		}
		dialogVisible.value = false
		loadData()
	} catch (e) {
		// 拦截器已提示
	} finally {
		submitting.value = false
	}
}

async function handleChangeStatus (row) {
	const next = row.status === '1' ? '2' : '1'
	const label = next === '2' ? '停诊' : '恢复'
	try {
		await ElMessageBox.confirm(`确定要${label} ${row.doctorName} ${row.scheduleDate} 的排班吗？`, '提示', {
			type: 'warning'
		})
	} catch (e) {
		return
	}
	try {
		await changeScheduleStatus(row.id, next)
		ElMessage.success(`${label}成功`)
		loadData()
	} catch (e) {
		// 拦截器已提示
	}
}

async function handleDelete (row) {
	try {
		await ElMessageBox.confirm('删除后不可恢复，确定删除该排班吗？', '提示', { type: 'warning' })
	} catch (e) {
		return
	}
	try {
		await deleteSchedule(row.id)
		ElMessage.success('删除成功')
		loadData()
	} catch (e) {
		// 拦截器已提示
	}
}

onMounted(() => {
	loadOptions()
	loadData()
})
</script>

<style scoped lang="scss">
.toolbar {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 12px;
}

.query-form {
	flex: 1;
}

.pagination {
	margin-top: 16px;
	justify-content: flex-end;
}
</style>
