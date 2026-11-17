<template>
	<div class="queue-page">
		<el-card shadow="hover">
			<div class="toolbar">
				<el-form :inline="true" :model="params" class="query-form" @submit.prevent>
					<el-form-item label="日期">
						<el-date-picker
							v-model="params.queueDate"
							type="date"
							value-format="YYYY-MM-DD"
							style="width: 160px"
							@change="loadDesk" />
					</el-form-item>
					<el-form-item label="科室">
						<el-select v-model="params.deptId" placeholder="全部" clearable style="width: 160px" @change="loadDesk">
							<el-option
								v-for="item in deptOptions"
								:key="item.id"
								:label="item.deptName"
								:value="item.id" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button @click="loadDesk">刷新</el-button>
					</el-form-item>
				</el-form>
				<el-tag type="info" effect="plain">每 30 秒自动刷新</el-tag>
			</div>

			<el-row :gutter="12" class="stat-row">
				<el-col :span="6"><el-card shadow="never" class="stat-card"><div class="stat-label">候诊</div><div class="stat-value">{{ counts.waiting }}</div></el-card></el-col>
				<el-col :span="6"><el-card shadow="never" class="stat-card"><div class="stat-label">已叫号</div><div class="stat-value">{{ counts.called }}</div></el-card></el-col>
				<el-col :span="6"><el-card shadow="never" class="stat-card"><div class="stat-label">已过号</div><div class="stat-value">{{ counts.passed }}</div></el-card></el-col>
				<el-col :span="6"><el-card shadow="never" class="stat-card"><div class="stat-label">已完成</div><div class="stat-value">{{ counts.finished }}</div></el-card></el-col>
			</el-row>

			<el-card shadow="never" class="current-card">
				<div class="current-head">
					<span class="current-title">当前叫号</span>
					<span v-if="current" class="current-no">{{ formatNo(current.queueNo) }}</span>
					<span v-else class="current-empty">暂无叫号</span>
				</div>
				<div v-if="current" class="current-body">
					<span>{{ current.patientName }}</span>
					<span>{{ genderLabel(current.gender) }} / {{ current.age ?? '-' }} 岁</span>
					<span>{{ current.deptName }}</span>
					<span>{{ current.doctorName || '未指定医生' }}</span>
					<span>诊室：{{ current.deskNo || '-' }}</span>
					<span>已呼叫 {{ current.callCount }} 次</span>
				</div>
				<div class="current-actions">
					<el-button type="primary" :disabled="!current" @click="handleAction(current, 'call')">重呼</el-button>
					<el-button type="warning" :disabled="!current" @click="handleAction(current, 'pass')">过号</el-button>
					<el-button type="success" :disabled="!current" @click="handleAction(current, 'finish')">完成就诊</el-button>
				</div>
			</el-card>

			<div class="section-title">候诊队列（危重优先，同级别按排队号）</div>
			<el-table :data="waiting" border stripe empty-text="暂无候诊患者">
				<el-table-column label="排队号" width="100" align="center" class-name="num-col">
					<template #default="{ row }">{{ formatNo(row.queueNo) }}</template>
				</el-table-column>
				<el-table-column label="姓名" prop="patientName" width="110" />
				<el-table-column label="性别/年龄" width="110">
					<template #default="{ row }">{{ genderLabel(row.gender) }} / {{ row.age ?? '-' }}</template>
				</el-table-column>
				<el-table-column label="分诊级别" width="100" align="center">
					<template #default="{ row }">
						<el-tag :type="levelTagType(row.triageLevel)" size="small">{{ levelLabel(row.triageLevel) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="科室" prop="deptName" min-width="120" />
				<el-table-column label="医生" prop="doctorName" min-width="100" />
				<el-table-column label="诊室" prop="deskNo" width="90" />
				<el-table-column label="操作" width="170" align="center">
					<template #default="{ row }">
						<el-button type="primary" link @click="handleAction(row, 'call')">呼叫</el-button>
						<el-button type="danger" link @click="handleAction(row, 'cancel')">取消</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="section-title">当日队列明细</div>
			<div class="toolbar">
				<el-form :inline="true" :model="params" @submit.prevent>
					<el-form-item label="状态">
						<el-select v-model="params.status" placeholder="全部" clearable style="width: 130px" @change="handleSearch">
							<el-option label="候诊" value="0" />
							<el-option label="已叫号" value="1" />
							<el-option label="已过号" value="2" />
							<el-option label="已完成" value="3" />
							<el-option label="已取消" value="9" />
						</el-select>
					</el-form-item>
				</el-form>
			</div>
			<el-table v-loading="loading" :data="tableData" border stripe>
				<el-table-column label="日期" prop="queueDate" width="115" class-name="num-col" />
				<el-table-column label="排队号" width="100" align="center" class-name="num-col">
					<template #default="{ row }">{{ formatNo(row.queueNo) }}</template>
				</el-table-column>
				<el-table-column label="姓名" prop="patientName" width="110" />
				<el-table-column label="科室" prop="deptName" min-width="120" />
				<el-table-column label="医生" prop="doctorName" min-width="100" />
				<el-table-column label="级别" width="90" align="center">
					<template #default="{ row }">{{ levelLabel(row.triageLevel) }}</template>
				</el-table-column>
				<el-table-column label="状态" width="100" align="center">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="叫号次数" prop="callCount" width="90" align="center" class-name="num-col" />
				<el-table-column label="操作" width="160" align="center">
					<template #default="{ row }">
						<el-button v-if="row.status === '2'" type="primary" link @click="handleAction(row, 'call')">重呼</el-button>
						<el-button v-if="row.status === '1'" type="success" link @click="handleAction(row, 'finish')">完成</el-button>
						<el-button v-if="row.status === '0'" type="danger" link @click="handleAction(row, 'cancel')">取消</el-button>
					</template>
				</el-table-column>
			</el-table>

			<el-pagination
				v-model:current-page="params.pageNo"
				v-model:page-size="params.pageSize"
				class="pagination"
				background
				layout="total, sizes, prev, pager, next"
				:total="total"
				:page-sizes="[10, 20, 50]"
				@size-change="handleSizeChange"
				@current-change="loadData" />
		</el-card>
	</div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
	callQueue,
	cancelQueue,
	finishQueue,
	getQueueDesk,
	getQueueOptions,
	getQueuePage,
	passQueue
} from '@/api/queue'
import {
	queueStatusLabel as statusLabel,
	queueStatusType as statusTagType,
	triageLevelLabel as levelLabel,
	triageLevelType as levelTagType
} from '@/utils/status'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const waiting = ref([])
const current = ref(null)
const counts = reactive({ waiting: 0, called: 0, passed: 0, finished: 0 })
const deptOptions = ref([])
let timer = null

const params = reactive({
	pageNo: 1,
	pageSize: 10,
	queueDate: '',
	deptId: '',
	status: ''
})

function today () {
	const now = new Date()
	const pad = value => String(value).padStart(2, '0')
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function formatNo (no) {
	if (no === null || no === undefined) {
		return '-'
	}
	return `A${String(no).padStart(3, '0')}`
}

function genderLabel (gender) {
	if (gender === '1') return '男'
	if (gender === '2') return '女'
	return '未知'
}

async function loadOptions () {
	try {
		const res = await getQueueOptions()
		deptOptions.value = res.data?.depts || []
	} catch (e) {
		// 拦截器已提示
	}
}

async function loadDesk () {
	if (!params.queueDate) {
		params.queueDate = today()
	}
	try {
		const res = await getQueueDesk({
			queueDate: params.queueDate,
			deptId: params.deptId || ''
		})
		const data = res.data || {}
		current.value = data.current || null
		waiting.value = data.waiting || []
		const c = data.counts || {}
		counts.waiting = c.waiting || 0
		counts.called = c.called || 0
		counts.passed = c.passed || 0
		counts.finished = c.finished || 0
	} catch (e) {
		// 拦截器已提示
	}
}

async function loadData () {
	loading.value = true
	try {
		const res = await getQueuePage({
			...params,
			queueDate: params.queueDate || '',
			deptId: params.deptId || ''
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

function handleSizeChange () {
	params.pageNo = 1
	loadData()
}

async function handleAction (row, action) {
	if (!row) {
		return
	}
	const labels = { call: '呼叫', pass: '过号', finish: '完成就诊', cancel: '取消候诊' }
	try {
		await ElMessageBox.confirm(`确定要对 ${row.patientName} 执行「${labels[action]}」吗？`, '提示', {
			type: 'warning'
		})
	} catch (e) {
		return
	}
	const actions = { call: callQueue, pass: passQueue, finish: finishQueue, cancel: cancelQueue }
	try {
		await actions[action](row.id)
		ElMessage.success(`${labels[action]}成功`)
		await loadDesk()
		await loadData()
	} catch (e) {
		// 拦截器已提示
	}
}

function refreshAll () {
	loadDesk()
	loadData()
}

onMounted(() => {
	params.queueDate = today()
	loadOptions()
	refreshAll()
	timer = setInterval(() => {
		loadDesk()
	}, 30000)
})

onBeforeUnmount(() => {
	if (timer) {
		clearInterval(timer)
	}
})
</script>

<style scoped lang="scss">
.toolbar {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
}

.query-form {
	flex: 1;
}

.stat-row {
	margin-bottom: 12px;
}

.stat-card {
	text-align: center;
	padding: 4px 0;
}

.stat-label {
	color: #909399;
	font-size: 13px;
}

.stat-value {
	font-size: 24px;
	font-weight: 600;
	color: #303133;
}

.current-card {
	margin-bottom: 16px;
	background: var(--el-color-primary-light-9);
}

.current-head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.current-title {
	font-weight: 600;
	color: #606266;
}

.current-no {
	font-size: 28px;
	font-weight: 700;
	color: var(--el-color-primary);
	letter-spacing: 2px;
}

.current-empty {
	color: #909399;
}

.current-body {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	margin: 12px 0;
	color: #303133;
}

.current-actions {
	display: flex;
	gap: 8px;
}

.section-title {
	margin: 16px 0 8px;
	font-weight: 600;
	color: #303133;
}

.pagination {
	margin-top: 16px;
	justify-content: flex-end;
}
</style>
