<template>
	<div class="triage-page">
		<el-row :gutter="12">
			<el-col :span="14">
				<el-card shadow="hover">
					<div class="toolbar">
						<el-form :inline="true" :model="waitingParams" @submit.prevent>
							<el-form-item label="日期">
								<el-date-picker
									v-model="waitingParams.triageDate"
									type="date"
									value-format="YYYY-MM-DD"
									style="width: 150px"
									@change="loadWaiting" />
							</el-form-item>
							<el-form-item label="科室">
								<el-select v-model="waitingParams.deptId" placeholder="全部" clearable style="width: 140px" @change="loadWaiting">
									<el-option
										v-for="item in deptOptions"
										:key="item.id"
										:label="item.deptName"
										:value="item.id" />
								</el-select>
							</el-form-item>
							<el-form-item label="患者">
								<el-input
									v-model="waitingParams.patientName"
									placeholder="姓名"
									clearable
									style="width: 120px"
									@keyup.enter="loadWaiting" />
							</el-form-item>
							<el-form-item>
								<el-button type="primary" plain @click="loadWaiting">查询</el-button>
							</el-form-item>
						</el-form>
					</div>

					<div class="section-title">
						待分诊挂号单 <el-tag type="warning" effect="plain">共 {{ waitingList.length }} 人</el-tag>
					</div>
					<el-table
						v-loading="waitingLoading"
						:data="waitingList"
						border
						stripe
						highlight-current-row
						empty-text="暂无待分诊患者"
						@current-change="handleSelect">
						<el-table-column label="挂号时间" width="90">
							<template #default="{ row }">{{ formatTime(row.registerTime) }}</template>
						</el-table-column>
						<el-table-column label="挂号单号" prop="regNo" min-width="150" class-name="num-col" />
						<el-table-column label="姓名" prop="patientName" width="90" />
						<el-table-column label="性别/年龄" width="95">
							<template #default="{ row }">{{ genderLabel(row.gender) }} / {{ row.age ?? '-' }}</template>
						</el-table-column>
						<el-table-column label="挂号科室" prop="deptName" min-width="110" />
						<el-table-column label="医生" prop="doctorName" width="90" />
						<el-table-column label="号别" width="80" align="center">
							<template #default="{ row }">{{ row.regType === '2' ? '专家' : '普通' }}</template>
						</el-table-column>
						<el-table-column label="来源" width="70" align="center">
							<template #default="{ row }">
								<el-tag v-if="row.recommendSource" size="small" :type="row.recommendSource === 'AI' ? 'success' : 'info'">
									{{ row.recommendSource }}
								</el-tag>
								<span v-else>-</span>
							</template>
						</el-table-column>
					</el-table>
				</el-card>
			</el-col>

			<el-col :span="10">
				<el-card shadow="hover">
					<div class="section-title">分诊登记</div>
					<el-empty v-if="!selected" description="请先在左侧选择待分诊患者" :image-size="70" />
					<template v-else>
						<el-descriptions :column="2" border size="small" class="patient-desc">
							<el-descriptions-item label="姓名">{{ selected.patientName }}</el-descriptions-item>
							<el-descriptions-item label="性别/年龄">
								{{ genderLabel(selected.gender) }} / {{ selected.age ?? '-' }}
							</el-descriptions-item>
							<el-descriptions-item label="挂号单号" :span="2">{{ selected.regNo }}</el-descriptions-item>
							<el-descriptions-item label="挂号科室">{{ selected.deptName }}</el-descriptions-item>
							<el-descriptions-item label="挂号医生">{{ selected.doctorName || '未指定' }}</el-descriptions-item>
							<el-descriptions-item label="症状" :span="2">{{ selected.symptomDesc || '-' }}</el-descriptions-item>
						</el-descriptions>

						<el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="triage-form">
							<el-form-item label="分诊级别" prop="triageLevel">
								<el-select v-model="form.triageLevel" style="width: 100%">
									<el-option
										v-for="item in levelOptions"
										:key="item.value"
										:label="item.label"
										:value="item.value" />
								</el-select>
							</el-form-item>
							<el-form-item label="分诊科室" prop="deptId">
								<el-select v-model="form.deptId" style="width: 100%" @change="form.doctorId = ''">
									<el-option
										v-for="item in deptOptions"
										:key="item.id"
										:label="item.deptName"
										:value="item.id" />
								</el-select>
							</el-form-item>
							<el-form-item label="分诊医生">
								<el-select v-model="form.doctorId" placeholder="可暂不指定" clearable style="width: 100%">
									<el-option
										v-for="item in filterDoctors(form.deptId)"
										:key="item.id"
										:label="item.realName"
										:value="item.id" />
								</el-select>
							</el-form-item>
							<el-form-item label="体温(℃)">
								<el-input-number v-model="form.temperature" :min="30" :max="45" :step="0.1" :precision="1" style="width: 150px" />
							</el-form-item>
							<el-form-item label="脉搏">
								<el-input-number v-model="form.pulse" :min="20" :max="250" style="width: 150px" />
							</el-form-item>
							<el-form-item label="呼吸">
								<el-input-number v-model="form.breathing" :min="5" :max="80" style="width: 150px" />
							</el-form-item>
							<el-form-item label="血压">
								<div class="bp-row">
									<el-input-number v-model="form.systolic" :min="40" :max="300" controls-position="right" style="width: 110px" />
									<span class="bp-sep">/</span>
									<el-input-number v-model="form.diastolic" :min="20" :max="200" controls-position="right" style="width: 110px" />
								</div>
							</el-form-item>
							<el-form-item label="血氧(%)">
								<el-input-number v-model="form.spo2" :min="50" :max="100" style="width: 150px" />
							</el-form-item>
							<el-form-item label="备注">
								<el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit />
							</el-form-item>
							<el-form-item>
								<el-button type="primary" :loading="submitting" @click="submitForm">提交分诊</el-button>
								<el-button @click="clearSelection">取消选择</el-button>
							</el-form-item>
						</el-form>
					</template>
				</el-card>
			</el-col>
		</el-row>

		<el-card shadow="hover" class="history-card">
			<div class="toolbar">
				<div class="section-title">已分诊记录</div>
				<el-form :inline="true" :model="pageParams" @submit.prevent>
					<el-form-item label="状态">
						<el-select v-model="pageParams.status" placeholder="全部" clearable style="width: 120px" @change="handleSearch">
							<el-option label="已分诊" value="1" />
							<el-option label="已撤销" value="9" />
						</el-select>
					</el-form-item>
				</el-form>
			</div>
			<el-table v-loading="loading" :data="tableData" border stripe>
				<el-table-column label="分诊时间" width="150" class-name="num-col">
					<template #default="{ row }">{{ formatDateTime(row.triageTime) }}</template>
				</el-table-column>
				<el-table-column label="挂号单号" prop="regNo" min-width="150" class-name="num-col" />
				<el-table-column label="姓名" prop="patientName" width="100" />
				<el-table-column label="科室" prop="deptName" min-width="110" />
				<el-table-column label="医生" prop="doctorName" width="100" />
				<el-table-column label="级别" width="90" align="center">
					<template #default="{ row }">
						<el-tag :type="levelTagType(row.triageLevel)" size="small">{{ levelLabel(row.triageLevel) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="排队号" width="90" align="center" class-name="num-col">
					<template #default="{ row }">{{ formatNo(row.queueNo) }}</template>
				</el-table-column>
				<el-table-column label="状态" width="90" align="center">
					<template #default="{ row }">
						<el-tag :type="row.status === '1' ? 'success' : 'info'" size="small">
							{{ row.status === '1' ? '已分诊' : '已撤销' }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="110" align="center">
					<template #default="{ row }">
						<el-button v-if="row.status === '1'" type="danger" link @click="handleRevoke(row)">撤销</el-button>
						<span v-else>-</span>
					</template>
				</el-table-column>
			</el-table>
			<el-pagination
				v-model:current-page="pageParams.pageNo"
				v-model:page-size="pageParams.pageSize"
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addTriage, getTriageOptions, getTriagePage, getTriageWaiting, revokeTriage } from '@/api/triage'
import { triageLevelLabel as levelLabel, triageLevelType as levelTagType } from '@/utils/status'

const waitingLoading = ref(false)
const loading = ref(false)
const submitting = ref(false)
const waitingList = ref([])
const tableData = ref([])
const total = ref(0)
const deptOptions = ref([])
const doctorOptions = ref([])
const levelOptions = ref([])
const selected = ref(null)
const formRef = ref(null)

function today () {
	const now = new Date()
	const pad = value => String(value).padStart(2, '0')
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const waitingParams = reactive({
	triageDate: today(),
	deptId: '',
	patientName: ''
})

const pageParams = reactive({
	pageNo: 1,
	pageSize: 10,
	triageDate: '',
	deptId: '',
	status: ''
})

const form = reactive({
	registrationId: null,
	triageLevel: '4',
	deptId: '',
	doctorId: '',
	temperature: undefined,
	pulse: undefined,
	breathing: undefined,
	systolic: undefined,
	diastolic: undefined,
	spo2: undefined,
	remark: ''
})

const rules = {
	triageLevel: [{ required: true, message: '请选择分诊级别', trigger: 'change' }],
	deptId: [{ required: true, message: '请选择分诊科室', trigger: 'change' }]
}

function filterDoctors (deptId) {
	if (!deptId) {
		return doctorOptions.value
	}
	return doctorOptions.value.filter(item => item.deptId === deptId)
}

function genderLabel (gender) {
	if (gender === '1') return '男'
	if (gender === '2') return '女'
	return '未知'
}

function formatTime (value) {
	if (!value) return '-'
	return String(value).substring(11, 16)
}

function formatDateTime (value) {
	if (!value) return '-'
	return String(value).replace('T', ' ').substring(0, 19)
}

function formatNo (no) {
	if (no === null || no === undefined) {
		return '-'
	}
	return `A${String(no).padStart(3, '0')}`
}

async function loadOptions () {
	try {
		const res = await getTriageOptions()
		const data = res.data || {}
		deptOptions.value = data.depts || []
		doctorOptions.value = data.doctors || []
		levelOptions.value = data.levels || [
			{ value: '1', label: '危重' },
			{ value: '2', label: '急' },
			{ value: '3', label: '亚急' },
			{ value: '4', label: '非急' }
		]
	} catch (e) {
		// 拦截器已提示
	}
}

async function loadWaiting () {
	waitingLoading.value = true
	try {
		const res = await getTriageWaiting({ ...waitingParams })
		waitingList.value = res.data || []
	} finally {
		waitingLoading.value = false
	}
}

async function loadData () {
	loading.value = true
	try {
		const res = await getTriagePage({
			...pageParams,
			triageDate: waitingParams.triageDate || '',
			deptId: waitingParams.deptId || ''
		})
		tableData.value = res.data?.records || []
		total.value = res.data?.totalRow || 0
	} finally {
		loading.value = false
	}
}

function handleSearch () {
	pageParams.pageNo = 1
	loadData()
}

function handleSizeChange () {
	pageParams.pageNo = 1
	loadData()
}

function handleSelect (row) {
	if (!row) {
		return
	}
	selected.value = row
	resetForm()
	form.registrationId = row.registrationId
	form.deptId = row.deptId
	form.doctorId = row.doctorId || ''
}

function resetForm () {
	form.registrationId = null
	form.triageLevel = '4'
	form.deptId = ''
	form.doctorId = ''
	form.temperature = undefined
	form.pulse = undefined
	form.breathing = undefined
	form.systolic = undefined
	form.diastolic = undefined
	form.spo2 = undefined
	form.remark = ''
}

function clearSelection () {
	selected.value = null
	resetForm()
}

async function submitForm () {
	if (!selected.value) {
		ElMessage.warning('请先选择待分诊患者')
		return
	}
	if (!formRef.value) {
		return
	}
	const valid = await formRef.value.validate().catch(() => false)
	if (!valid) {
		return
	}
	submitting.value = true
	try {
		const res = await addTriage({ ...form })
		const queueNo = res.data?.queueNo
		ElMessage.success(`分诊成功，排队号 ${formatNo(queueNo)}`)
		clearSelection()
		await loadWaiting()
		await loadData()
	} catch (e) {
		// 拦截器已提示
	} finally {
		submitting.value = false
	}
}

async function handleRevoke (row) {
	try {
		await ElMessageBox.confirm(`确定撤销 ${row.patientName} 的分诊吗？撤销后将释放其候诊号。`, '提示', {
			type: 'warning'
		})
	} catch (e) {
		return
	}
	try {
		await revokeTriage(row.id)
		ElMessage.success('已撤销分诊')
		await loadWaiting()
		await loadData()
	} catch (e) {
		// 拦截器已提示
	}
}

onMounted(() => {
	loadOptions()
	loadWaiting()
	loadData()
})
</script>

<style scoped lang="scss">
.toolbar {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
}

.section-title {
	margin: 6px 0 10px;
	font-weight: 600;
	color: #303133;
}

.patient-desc {
	margin-bottom: 16px;
}

.triage-form {
	margin-top: 8px;
}

.bp-row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.bp-sep {
	color: #909399;
}

.history-card {
	margin-top: 16px;
}

.pagination {
	margin-top: 16px;
	justify-content: flex-end;
}
</style>
