<template>
	<div class="register-page">
		<el-card shadow="hover" class="register-form-card">
			<template #header>
				<div class="card-header">
					<span>门诊挂号登记</span>
					<el-tag
						v-if="recommendResult"
						:type="recommendResult.source === 'AI' ? 'success' : 'info'"
						effect="plain">
						{{ recommendResult.source === 'AI' ? 'AI 智能推荐' : '规则匹配推荐' }}
					</el-tag>
				</div>
			</template>

			<el-form ref="patientFormRef" :model="patientForm" :rules="patientRules" label-width="90px">
				<el-row :gutter="16">
					<el-col :xs="24" :sm="12" :md="8">
						<el-form-item label="患者姓名" prop="patientName">
							<el-input
								v-model="patientForm.patientName"
								maxlength="50"
								placeholder="请输入患者姓名"
								:disabled="profileLocked" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8">
						<el-form-item label="性别" prop="gender">
							<el-radio-group v-model="patientForm.gender" :disabled="profileLocked">
								<el-radio value="1">男</el-radio>
								<el-radio value="2">女</el-radio>
								<el-radio value="0">未知</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8">
						<el-form-item label="年龄">
							<el-input-number
								v-model="patientForm.age"
								:min="0"
								:max="150"
								:disabled="profileLocked"
								controls-position="right"
								placeholder="请输入年龄"
								style="width: 100%" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8">
						<el-form-item label="手机号" prop="phone">
							<el-input
								v-model="patientForm.phone"
								maxlength="20"
								placeholder="请输入手机号"
								:disabled="profileLocked" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="8">
						<el-form-item label="身份证号">
							<el-input
								v-model="patientForm.idCard"
								maxlength="20"
								placeholder="选填，失焦后自动匹配档案"
								:disabled="profileLocked"
								@blur="handleIdCardBlur" />
						</el-form-item>
					</el-col>
				</el-row>
				<div v-if="checkingPatient || patientMatched || newPatient" class="patient-hint">
					<template v-if="checkingPatient">
						<span class="hint-spinner"></span>
						<span>正在匹配患者档案…</span>
					</template>
					<template v-else-if="patientMatched && profileLocked">
						<el-tag type="success" size="small" effect="plain">
							已匹配到已有患者档案<template v-if="patientBirthday">（生日 {{ patientBirthday }}）</template>
						</el-tag>
						<el-button link type="primary" size="small" @click="unlockPatientProfile">修改信息</el-button>
					</template>
					<template v-else-if="patientMatched">
						<el-tag type="warning" size="small" effect="plain">
							已解除锁定，修改仅对本次挂号生效，不会更新患者档案
						</el-tag>
					</template>
					<template v-else>
						<el-tag type="info" size="small" effect="plain">新患者，提交挂号时将自动建档</el-tag>
					</template>
				</div>
				<el-form-item label="病状描述" prop="symptomDesc">
					<el-input
						v-model="patientForm.symptomDesc"
						type="textarea"
						:rows="3"
						maxlength="2000"
						show-word-limit
						placeholder="请描述患者主要症状，如：咳嗽发烧三天，伴有鼻塞流涕" />
				</el-form-item>
				<div class="form-actions">
					<el-button link type="primary" @click="openPatientDialog">选择已有患者</el-button>
					<el-button
						type="primary"
						:loading="recommending"
						:disabled="recommending"
						@click="handleRecommend">
						{{ recommending ? '正在分析症状…' : '智能推荐科室 / 医生' }}
					</el-button>
					<el-button :disabled="recommending" @click="resetPatientForm">重置</el-button>
				</div>
				<div v-if="recommending" class="recommend-hint">
					<span class="hint-spinner"></span>
					正在分析症状，通常需要 10 秒左右，已等待 {{ waitedSeconds }} 秒…
				</div>
			</el-form>

			<div v-if="recommendResult" class="recommend-result">
				<el-alert type="success" :closable="false" show-icon>
					<template #title>
						推荐科室：<strong>{{ recommendResult.deptName }}</strong>
						<el-tag
							size="small"
							:type="recommendResult.source === 'AI' ? 'success' : 'info'"
							style="margin-left: 8px">
							{{ recommendResult.source === 'AI' ? 'AI 推荐' : '规则推荐' }}
						</el-tag>
					</template>
					<div>{{ recommendResult.reason }}</div>
				</el-alert>

				<div v-if="recommendResult.doctors && recommendResult.doctors.length" class="doctor-cards">
					<el-card
						v-for="doctor in recommendResult.doctors"
						:key="doctor.doctorId"
						shadow="hover"
						class="doctor-card"
						:class="{ selected: actualDoctorId === doctor.doctorId }">
						<div class="doctor-head">
							<span class="doctor-name">{{ doctor.doctorName }}</span>
							<el-tag size="small" type="success">{{ doctor.title || '医师' }}</el-tag>
						</div>
						<div class="doctor-dept">{{ doctor.deptName }}</div>
						<el-progress :percentage="doctor.matchScore" :stroke-width="8" :color="progressColor" />
						<div class="doctor-reason">{{ doctor.matchReason }}</div>
						<el-button size="small" type="primary" plain @click="chooseDoctor(doctor)">
							{{ actualDoctorId === doctor.doctorId ? '已选择' : '选择该医生' }}
						</el-button>
					</el-card>
				</div>
				<el-empty v-else description="该科室暂无在岗医生，可直接挂科室号" :image-size="60" />
			</div>

			<div class="chat-panel">
				<div class="chat-head">
					<span class="chat-title">AI 问诊助手</span>
					<el-button link type="primary" size="small" @click="resetChatSession">新对话</el-button>
				</div>
				<div ref="chatScrollRef" class="chat-messages">
					<div v-if="!chatMessages.length" class="chat-empty">
						描述一下哪里不舒服，我会帮您判断该挂哪个科
					</div>
					<div
						v-for="(item, index) in chatMessages"
						:key="index"
						class="chat-row"
						:class="item.role">
						<div class="chat-bubble" :class="{ 'chat-error': item.error }">
							{{ item.content }}
						</div>
					</div>
				</div>
				<div class="chat-input">
					<el-input
						v-model="chatInput"
						maxlength="500"
						placeholder="说说哪里不舒服…（回车发送）"
						:disabled="chatSending"
						@keyup.enter="sendChatMessage" />
					<el-button
						type="primary"
						:loading="chatSending"
						:disabled="chatSending || !chatInput.trim()"
						@click="sendChatMessage">
						{{ chatSending ? '思考中…' : '发送' }}
					</el-button>
				</div>
				<div class="chat-actions">
					<span class="chat-tip">
						<template v-if="chatSending">首轮较慢，已等待 {{ chatWaitedSeconds }} 秒…</template>
						<template v-else>对话仅用于本次分诊参考，不替代医生诊断</template>
					</span>
					<el-button
						size="small"
						type="success"
						plain
						:disabled="!chatMessages.length || chatSending"
						@click="recommendFromChat">按这段对话推荐科室 / 医生</el-button>
				</div>
			</div>

			<div class="confirm-bar">
				<el-form :inline="true" class="confirm-form" @submit.prevent>
					<el-form-item label="就诊时段">
						<el-select v-model="regPeriod" style="width: 110px" @change="handlePeriodChange">
							<el-option label="上午" value="1" />
							<el-option label="下午" value="2" />
						</el-select>
					</el-form-item>
					<el-form-item label="挂号科室">
						<el-select
							v-model="actualDeptId"
							placeholder="请选择科室"
							filterable
							style="width: 160px"
							@change="handleDeptChange">
							<el-option
								v-for="dept in options.depts"
								:key="dept.id"
								:label="dept.deptName"
								:value="dept.id" />
						</el-select>
					</el-form-item>
					<el-form-item label="接诊医生">
						<el-select
							v-model="actualDoctorId"
							placeholder="可不指定"
							clearable
							filterable
							style="width: 220px"
							@change="handleDoctorChange">
							<el-option
								v-for="doctor in availableDoctors"
								:key="doctor.id"
								:label="doctorOptionLabel(doctor)"
								:value="doctor.id"
								:disabled="doctor.bookable === false" />
						</el-select>
					</el-form-item>
					<el-form-item label="挂号费">
						<div class="fee-display">
							<span class="fee-amount">{{ formatFee(fee) }} 元</span>
							<span class="fee-tip">
								<template v-if="feeTitle">按职称标准：{{ feeTitle }}</template>
								<template v-else>选择医生后按职称标准带出</template>
							</span>
						</div>
					</el-form-item>
					<el-form-item>
						<el-button type="success" :loading="registering" @click="submitRegistration">确认挂号</el-button>
					</el-form-item>
				</el-form>
			</div>
		</el-card>

		<el-card shadow="hover" class="record-card">
			<div class="toolbar">
				<el-form :inline="true" :model="params" class="query-form" @submit.prevent>
					<el-form-item label="患者姓名">
						<el-input
							v-model="params.patientName"
							placeholder="请输入患者姓名"
							clearable
							style="width: 160px"
							@keyup.enter="handleSearch" />
					</el-form-item>
					<el-form-item label="挂号科室">
						<el-select v-model="params.deptId" placeholder="全部" clearable style="width: 140px">
							<el-option
								v-for="dept in options.depts"
								:key="dept.id"
								:label="dept.deptName"
								:value="dept.id" />
						</el-select>
					</el-form-item>
					<el-form-item label="状态">
						<el-select v-model="params.status" placeholder="全部" clearable style="width: 120px">
							<el-option
								v-for="item in statusOptions"
								:key="item.value"
								:label="item.label"
								:value="item.value" />
						</el-select>
					</el-form-item>
					<el-form-item label="挂号日期">
						<el-date-picker
							v-model="params.dateRange"
							type="daterange"
							value-format="YYYY-MM-DD"
							start-placeholder="开始日期"
							end-placeholder="结束日期"
							style="width: 250px" />
					</el-form-item>
					<el-form-item>
						<el-button type="primary" plain @click="handleSearch">查询</el-button>
						<el-button @click="handleReset">重置</el-button>
					</el-form-item>
				</el-form>
			</div>

			<el-table v-loading="loading" :data="tableData" border stripe>
				<el-table-column label="编号" prop="id" width="70" class-name="num-col" />
				<el-table-column label="患者姓名" prop="patientName" min-width="100" />
				<el-table-column label="性别" width="70" align="center">
					<template #default="{ row }">{{ genderLabel(row.gender) }}</template>
				</el-table-column>
				<el-table-column label="年龄" prop="age" width="70" align="center" class-name="num-col" />
				<el-table-column label="手机号" prop="phone" min-width="125" />
				<el-table-column label="挂号科室" prop="deptName" min-width="110" />
				<el-table-column label="医生" min-width="100">
					<template #default="{ row }">{{ row.doctorName || '未指定' }}</template>
				</el-table-column>
				<el-table-column label="病状描述" prop="symptomDesc" min-width="180" show-overflow-tooltip />
				<el-table-column label="推荐来源" width="100" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.recommendSource" size="small" :type="row.recommendSource === 'AI' ? 'success' : 'info'">
							{{ row.recommendSource === 'AI' ? 'AI 推荐' : '规则推荐' }}
						</el-tag>
						<span v-else>—</span>
					</template>
				</el-table-column>
				<el-table-column label="挂号时间" width="150" class-name="num-col">
					<template #default="{ row }">{{ formatDateTime(row.registerTime) }}</template>
				</el-table-column>
				<el-table-column label="挂号费(元)" width="100" align="right" class-name="num-col">
					<template #default="{ row }">{{ formatFee(row.fee) }}</template>
				</el-table-column>
				<el-table-column label="状态" width="90" align="center">
					<template #default="{ row }">
						<el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="支付状态" width="100" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.payStatus === '1'" type="success" effect="plain" size="small">已支付</el-tag>
						<el-tag v-else-if="Number(row.fee) > 0" type="warning" effect="plain" size="small">未支付</el-tag>
						<el-tag v-else type="info" effect="plain" size="small">无需支付</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="250" fixed="right" align="center">
					<template #default="{ row }">
						<el-button type="primary" link @click="openEdit(row)">编辑</el-button>
						<el-button
							v-if="row.status === '0' && row.payStatus !== '1' && Number(row.fee) > 0"
							type="success"
							link
							@click="openPayment(row)">
							去支付
						</el-button>
						<el-button
							type="warning"
							link
							:disabled="row.status !== '0'"
							@click="handleCancel(row)">
							取消
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
				:page-sizes="[6, 10, 20, 50]"
				@size-change="handleSizeChange"
				@current-change="loadData" />
		</el-card>

		<el-dialog
			v-model="dialogVisible"
			title="编辑挂号记录"
			width="640px"
			:close-on-click-modal="false"
			@closed="resetEditForm">
			<el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="90px">
				<el-row :gutter="16">
					<el-col :sm="12">
						<el-form-item label="患者姓名" prop="patientName">
							<el-input v-model="editForm.patientName" maxlength="50" />
						</el-form-item>
					</el-col>
					<el-col :sm="12">
						<el-form-item label="性别" prop="gender">
							<el-radio-group v-model="editForm.gender">
								<el-radio value="1">男</el-radio>
								<el-radio value="2">女</el-radio>
								<el-radio value="0">未知</el-radio>
							</el-radio-group>
						</el-form-item>
					</el-col>
					<el-col :sm="12">
						<el-form-item label="年龄">
							<el-input-number
								v-model="editForm.age"
								:min="0"
								:max="150"
								controls-position="right"
								style="width: 100%" />
						</el-form-item>
					</el-col>
					<el-col :sm="12">
						<el-form-item label="手机号" prop="phone">
							<el-input v-model="editForm.phone" maxlength="20" />
						</el-form-item>
					</el-col>
					<el-col :sm="12">
						<el-form-item label="身份证号">
							<el-input v-model="editForm.idCard" maxlength="20" />
						</el-form-item>
					</el-col>
					<el-col :sm="12">
						<el-form-item label="挂号费">
							<div class="fee-display">
								<span class="fee-amount">{{ formatFee(editForm.fee) }} 元</span>
								<span class="fee-tip">
									<template v-if="editForm.feeTitle">按职称标准：{{ editForm.feeTitle }}</template>
									<template v-else>选择医生后按职称标准带出</template>
								</span>
							</div>
						</el-form-item>
					</el-col>
					<el-col :sm="12">
						<el-form-item label="挂号科室" prop="deptId">
							<el-select v-model="editForm.deptId" placeholder="请选择科室" style="width: 100%" @change="handleEditDeptChange">
								<el-option
									v-for="dept in options.depts"
									:key="dept.id"
									:label="dept.deptName"
									:value="dept.id" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :sm="12">
						<el-form-item label="接诊医生">
							<el-select
								v-model="editForm.doctorId"
								placeholder="可不指定"
								clearable
								style="width: 100%"
								@change="handleEditDoctorChange">
								<el-option
									v-for="doctor in editDoctors"
									:key="doctor.id"
									:label="`${doctor.realName}（${doctor.title || '医师'}）`"
									:value="doctor.id" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :sm="12">
						<el-form-item label="状态">
							<el-select v-model="editForm.status" style="width: 100%">
								<el-option label="待就诊" value="0" />
								<el-option label="已就诊" value="1" />
							</el-select>
						</el-form-item>
					</el-col>
				</el-row>
				<el-form-item label="病状描述">
					<el-input v-model="editForm.symptomDesc" type="textarea" :rows="3" maxlength="2000" show-word-limit />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="editSubmitting" @click="submitEdit">确定</el-button>
			</template>
		</el-dialog>

		<el-dialog
			v-model="patientDialogVisible"
			title="选择已有患者"
			width="860px"
			:close-on-click-modal="false"
			@open="handlePatientDialogOpen">
			<el-form :inline="true" @submit.prevent>
				<el-form-item label="关键字">
					<el-input
						v-model="patientQuery.keyword"
						placeholder="姓名 / 手机号 / 身份证号，可留空查全部"
						clearable
						style="width: 280px"
						@keyup.enter="handlePatientSearch" />
				</el-form-item>
				<el-form-item>
					<el-button
						type="primary"
						plain
						:loading="patientLoading"
						:disabled="patientLoading"
						@click="handlePatientSearch">搜索</el-button>
				</el-form-item>
			</el-form>
			<el-table v-loading="patientLoading" :data="patientList" border stripe height="360">
				<el-table-column label="姓名" prop="patientName" min-width="100" />
				<el-table-column label="性别" width="70" align="center">
					<template #default="{ row }">{{ genderLabel(row.gender) }}</template>
				</el-table-column>
				<el-table-column label="出生日期" width="120">
					<template #default="{ row }">{{ row.birthday || '—' }}</template>
				</el-table-column>
				<el-table-column label="手机号" prop="phone" min-width="120" />
				<el-table-column label="身份证号" prop="idCard" min-width="170" />
				<el-table-column label="操作" width="90" align="center">
					<template #default="{ row }">
						<el-button type="primary" link @click="choosePatient(row)">选择</el-button>
					</template>
				</el-table-column>
			</el-table>
			<el-pagination
				v-model:current-page="patientQuery.pageNo"
				v-model:page-size="patientQuery.pageSize"
				background
				style="margin-top: 12px; justify-content: flex-end"
				layout="total, sizes, prev, pager, next"
				:total="patientTotal"
				:page-sizes="[10, 20, 50]"
				@size-change="handlePatientSizeChange"
				@current-change="loadPatients" />
		</el-dialog>

		<el-dialog
			v-model="payDialogVisible"
			title="扫码支付挂号费"
			width="420px"
			:close-on-click-modal="false"
			@closed="handlePayDialogClosed">
			<div v-loading="payCreating" class="pay-panel">
				<template v-if="payOrder && payOrder.status === '1'">
					<el-result icon="success" title="支付成功" :sub-title="`挂号单号 ${payOrder.regNo || '—'}`" />
				</template>
				<template v-else-if="payOrder">
					<div class="pay-amount">￥{{ formatFee(payOrder.amount) }}</div>
					<div class="pay-tip">请使用微信或支付宝扫描下方二维码支付挂号费</div>
					<img v-if="payQrImage" :src="payQrImage" class="pay-qr" alt="支付二维码" />
					<div v-else class="pay-qr pay-qr-empty">{{ payQrError || '二维码生成中…' }}</div>
					<div class="pay-meta">
						<span>挂号单号：{{ payOrder.regNo || '—' }}</span>
						<span>支付单号：{{ payOrder.payNo }}</span>
					</div>
					<div class="pay-expire" :class="{ expired: payExpired }">
						<template v-if="payExpired">二维码已过期，请重新发起支付</template>
						<template v-else>支付剩余时间 {{ payCountdownText }}</template>
					</div>
					<div class="pay-actions">
						<el-button v-if="payExpired" type="primary" @click="retryPayment">重新发起支付</el-button>
						<template v-else>
							<el-button :loading="payChecking" @click="refreshPayStatus">我已完成支付</el-button>
							<el-button type="success" plain :loading="paySimulating" @click="simulatePay">
								模拟支付成功
							</el-button>
						</template>
					</div>
					<div class="pay-note">
						演示环境未接入真实支付网关，扫码内容为本系统支付单号；点击“模拟支付成功”代替扫码回调。
					</div>
				</template>
				<template v-else>
					<div class="pay-loading">{{ payQrError || '正在创建支付单…' }}</div>
					<div v-if="payQrError" class="pay-actions">
						<el-button type="primary" @click="retryPayment">重新发起支付</el-button>
					</div>
				</template>
			</div>
		</el-dialog>
	</div>
</template>

<script setup>
import { computed, nextTick, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import QRCode from 'qrcode'
import {
	addRegistration,
	cancelRegistration,
	deleteRegistration,
	getRegisterOptions,
	getRegistrationPage,
	recommendDoctors,
	sendChat,
	updateRegistration
} from '@/api/register'
import {
	closePayment,
	createPayment,
	getPaymentStatus,
	simulatePayment
} from '@/api/payment'
import { getPatientByIdCard, listPatients } from '@/api/patient'
import { regStatusLabel as statusLabel, regStatusType as statusType } from '@/utils/status'

const statusOptions = [
	{ value: '0', label: '待就诊' },
	{ value: '1', label: '已就诊' },
	{ value: '2', label: '已取消' }
]

const genderMap = { 0: '未知', 1: '男', 2: '女' }

const options = reactive({ depts: [], doctors: [] })

const patientFormRef = ref()
const patientForm = reactive({
	patientName: '',
	gender: '1',
	age: null,
	phone: '',
	idCard: '',
	symptomDesc: ''
})
const patientRules = {
	patientName: [
		{ required: true, message: '请输入患者姓名', trigger: 'blur' },
		{ max: 50, message: '患者姓名不能超过 50 个字符', trigger: 'blur' }
	],
	gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
	phone: [
		{
			validator: (rule, value, callback) => {
				if (value && !/^[0-9+\- ]{6,20}$/.test(value)) {
					callback(new Error('手机号格式不正确'))
					return
				}
				callback()
			},
			trigger: 'blur'
		}
	]
}

const recommending = ref(false)
const waitedSeconds = ref(0)
let waitedTimer = null

// AI 多轮问诊：sessionId 决定后端 Redis 记忆归属，重置/换患者时重新生成
function createChatSessionId () {
	const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(16).slice(2)}`
	return `his-chat-${uuid}`
}

const chatSessionId = ref(createChatSessionId())
const chatMessages = ref([])
const chatInput = ref('')
const chatSending = ref(false)
const chatWaitedSeconds = ref(0)
const chatScrollRef = ref()
let chatTimer = null
let chatRequestToken = 0
const recommendResult = ref(null)
const selectedDoctor = ref(null)
const regPeriod = ref('1')
const actualDeptId = ref(null)
const actualDoctorId = ref(null)
const fee = ref(0)
const feeTitle = ref('')
const registering = ref(false)

// 扫码支付：确认挂号后按挂号费生成支付单，弹二维码并轮询支付结果
const payDialogVisible = ref(false)
const payCreating = ref(false)
const payChecking = ref(false)
const paySimulating = ref(false)
const payOrder = ref(null)
const payQrImage = ref('')
const payQrError = ref('')
const payRemaining = ref(0)
const payRegistration = ref(null)
let payCountdownTimer = null
let payPollTimer = null
let paySettled = false

const payExpired = computed(() =>
	payOrder.value?.status === '2' || (payOrder.value?.status === '0' && payRemaining.value <= 0)
)

const payCountdownText = computed(() => {
	const minutes = Math.floor(payRemaining.value / 60)
	const seconds = payRemaining.value % 60
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// 患者主索引：命中档案后锁定身份字段，patientId 用于提交挂号时关联
const patientId = ref(null)
const patientMatched = ref(false)
const newPatient = ref(false)
const profileLocked = ref(false)
const checkingPatient = ref(false)
const patientBirthday = ref('')
let lastQueriedIdCard = ''

// 选择已有患者弹窗
const patientDialogVisible = ref(false)
const patientLoading = ref(false)
const patientList = ref([])
const patientTotal = ref(0)
const patientQuery = reactive({
	keyword: '',
	pageNo: 1,
	pageSize: 10
})

const availableDoctors = computed(() =>
	options.doctors.filter(doctor => doctor.deptId === actualDeptId.value)
)

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const params = reactive({
	pageNo: 1,
	pageSize: 10,
	patientName: '',
	deptId: '',
	status: '',
	dateRange: []
})

const dialogVisible = ref(false)
const editFormRef = ref()
const editSubmitting = ref(false)
const editForm = reactive({
	id: null,
	patientName: '',
	gender: '1',
	age: null,
	phone: '',
	idCard: '',
	symptomDesc: '',
	deptId: null,
	doctorId: null,
	fee: 0,
	feeTitle: '',
	status: '0'
})
const editRules = {
	patientName: [
		{ required: true, message: '请输入患者姓名', trigger: 'blur' },
		{ max: 50, message: '患者姓名不能超过 50 个字符', trigger: 'blur' }
	],
	gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
	deptId: [{ required: true, message: '请选择挂号科室', trigger: 'change' }],
	phone: [
		{
			validator: (rule, value, callback) => {
				if (value && !/^[0-9+\- ]{6,20}$/.test(value)) {
					callback(new Error('手机号格式不正确'))
					return
				}
				callback()
			},
			trigger: 'blur'
		}
	]
}
const editDoctors = computed(() =>
	options.doctors.filter(doctor => doctor.deptId === editForm.deptId)
)

function genderLabel (value) {
	return genderMap[value] || '未知'
}

function progressColor (percentage) {
	if (percentage >= 90) {
		return '#67c23a'
	}
	if (percentage >= 80) {
		return '#409eff'
	}
	return '#e6a23c'
}

function formatDateTime (value) {
	if (!value) {
		return ''
	}
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return String(value).replace('T', ' ').slice(0, 19)
	}
	const pad = number => String(number).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatFee (value) {
	return Number(value || 0).toFixed(2)
}

// 挂号日期固定为当天，时段由页面选择
function todayString () {
	const now = new Date()
	const pad = number => String(number).padStart(2, '0')
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// 医生下拉：姓名 · 职称 · 余号（无排班或号源为 0 时显示已满并置灰）
function doctorOptionLabel (doctor) {
	const title = doctor.title || '医师'
	const remaining = doctor.bookable === false ? '已满/未排班' : `余 ${doctor.remaining ?? 0}`
	return `${doctor.realName} · ${title} · ${remaining}`
}

async function handlePeriodChange () {
	await loadOptions()
	const doctor = options.doctors.find(item => item.id === actualDoctorId.value)
	if (doctor && doctor.bookable === false) {
		actualDoctorId.value = null
		ElMessage.warning('该医生在所选时段不可挂号，请重新选择')
	}
	syncDoctorFee()
}

function handleDeptChange () {
	const doctor = options.doctors.find(item => item.id === actualDoctorId.value)
	if (doctor && doctor.deptId !== actualDeptId.value) {
		actualDoctorId.value = null
	}
	if (selectedDoctor.value && selectedDoctor.value.deptId !== actualDeptId.value) {
		selectedDoctor.value = null
	}
	syncDoctorFee()
}

// 挂号费只读，统一按所选医生的职称标准带出（regFee 由后端 options / recommend 提供）
function syncDoctorFee () {
	const doctor = options.doctors.find(item => item.id === actualDoctorId.value)
	fee.value = doctor ? Number(doctor.regFee || 0) : 0
	feeTitle.value = doctor?.title || ''
}

function handleDoctorChange () {
	syncDoctorFee()
}

function chooseDoctor (doctor) {
	selectedDoctor.value = doctor
	actualDeptId.value = doctor.deptId
	actualDoctorId.value = doctor.doctorId
	const option = options.doctors.find(item => item.id === doctor.doctorId)
	if (option) {
		syncDoctorFee()
	} else {
		fee.value = Number(doctor.regFee || 0)
		feeTitle.value = doctor.title || ''
	}
}

async function handleRecommend () {
	if (recommending.value) {
		return
	}
	if (!patientForm.symptomDesc || !patientForm.symptomDesc.trim()) {
		ElMessage.warning('请先填写病状描述')
		return
	}
	recommending.value = true
	waitedSeconds.value = 0
	waitedTimer = setInterval(() => {
		waitedSeconds.value += 1
	}, 1000)
	try {
		const body = await recommendDoctors({
			gender: patientForm.gender,
			age: patientForm.age,
			symptomDesc: patientForm.symptomDesc.trim(),
			regDate: todayString(),
			regPeriod: regPeriod.value
		})
		recommendResult.value = body.data || null
		selectedDoctor.value = null
		actualDoctorId.value = null
		syncDoctorFee()
		if (body.data?.deptId) {
			actualDeptId.value = body.data.deptId
		}
	} catch {
		// 错误提示由 request 拦截器统一提示后端 msg
	} finally {
		clearInterval(waitedTimer)
		waitedTimer = null
		recommending.value = false
	}
}

onUnmounted(() => {
	clearInterval(waitedTimer)
	waitedTimer = null
	clearInterval(chatTimer)
	chatTimer = null
	stopPayTimers()
})

function scrollChatToBottom () {
	nextTick(() => {
		const container = chatScrollRef.value
		if (container) {
			container.scrollTop = container.scrollHeight
		}
	})
}

function resolveChatError (error) {
	const backendMsg = error?.response?.data?.msg
	if (backendMsg) {
		return backendMsg
	}
	// 拦截器对 code !== 200 的响应直接以 Error(body.msg) 抛出，这里原样展示（如 AI 未启用提示）
	const rawMsg = error?.message || ''
	const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(rawMsg)
	if (isTimeout) {
		return '等待超时了，请稍后重试'
	}
	if (/Network Error|Failed to fetch/i.test(rawMsg)) {
		return '网络异常，请检查网络后重试'
	}
	return rawMsg || 'AI 助手暂时不可用，请稍后重试'
}

async function sendChatMessage () {
	if (chatSending.value) {
		return
	}
	const message = chatInput.value.trim()
	if (!message) {
		return
	}
	chatMessages.value.push({ role: 'user', content: message })
	chatInput.value = ''
	chatSending.value = true
	chatWaitedSeconds.value = 0
	chatTimer = setInterval(() => {
		chatWaitedSeconds.value += 1
	}, 1000)
	scrollChatToBottom()
	const token = ++chatRequestToken
	try {
		const body = await sendChat({ sessionId: chatSessionId.value, message })
		if (token !== chatRequestToken) {
			return
		}
		chatMessages.value.push({
			role: 'assistant',
			content: body.data || '（助手没有返回内容，可以说得更具体一点再试）'
		})
	} catch (error) {
		if (token !== chatRequestToken) {
			return
		}
		chatMessages.value.push({
			role: 'assistant',
			content: resolveChatError(error),
			error: true
		})
	} finally {
		if (token === chatRequestToken) {
			clearInterval(chatTimer)
			chatTimer = null
			chatSending.value = false
			scrollChatToBottom()
		}
	}
}

function resetChatSession () {
	chatRequestToken += 1
	clearInterval(chatTimer)
	chatTimer = null
	chatMessages.value = []
	chatInput.value = ''
	chatSending.value = false
	chatWaitedSeconds.value = 0
	chatSessionId.value = createChatSessionId()
}

function recommendFromChat () {
	const symptomText = chatMessages.value
		.filter(item => item.role === 'user' && !item.error)
		.map(item => item.content)
		.join('；')
	if (!symptomText) {
		ElMessage.warning('还没有描述症状，请先在对话里说说哪里不舒服')
		return
	}
	patientForm.symptomDesc = symptomText.slice(0, 2000)
	handleRecommend()
}

function ageFromBirthday (birthday) {
	if (!birthday) {
		return null
	}
	const [year, month, day] = String(birthday).slice(0, 10).split('-').map(Number)
	if (!year || !month || !day) {
		return null
	}
	const now = new Date()
	let age = now.getFullYear() - year
	if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) {
		age -= 1
	}
	return age >= 0 ? age : null
}

function resetPatientProfile () {
	patientId.value = null
	patientMatched.value = false
	newPatient.value = false
	profileLocked.value = false
	patientBirthday.value = ''
	lastQueriedIdCard = ''
}

function applyPatientProfile (patient) {
	if (!patient) {
		return
	}
	// 切换患者：开一段全新的对话，避免看到上一位患者的聊天记录
	resetChatSession()
	patientId.value = patient.id || null
	patientMatched.value = true
	newPatient.value = false
	profileLocked.value = true
	patientForm.patientName = patient.patientName || ''
	// 性别取值 0-未知 1-男 2-女，与后端 sys_patient.gender 完全一致，无需转换
	patientForm.gender = patient.gender === null || patient.gender === undefined ? '0' : String(patient.gender)
	patientForm.phone = patient.phone || ''
	patientForm.idCard = patient.idCard || patientForm.idCard
	patientBirthday.value = patient.birthday ? String(patient.birthday).slice(0, 10) : ''
	patientForm.age = ageFromBirthday(patientBirthday.value)
	lastQueriedIdCard = (patientForm.idCard || '').trim()
	patientFormRef.value?.clearValidate(['patientName', 'gender', 'phone'])
}

async function handleIdCardBlur () {
	if (profileLocked.value) {
		return
	}
	const idCard = (patientForm.idCard || '').trim()
	patientForm.idCard = idCard
	if (!idCard) {
		resetPatientProfile()
		return
	}
	if (idCard === lastQueriedIdCard) {
		return
	}
	checkingPatient.value = true
	try {
		const body = await getPatientByIdCard(idCard)
		lastQueriedIdCard = idCard
		if (body.data) {
			applyPatientProfile(body.data)
			ElMessage.success('已匹配到已有患者档案')
		} else {
			patientId.value = null
			patientMatched.value = false
			profileLocked.value = false
			patientBirthday.value = ''
			newPatient.value = true
			ElMessage.info('新患者，提交挂号时将自动建档')
		}
	} catch {
		// 查询失败不阻断填单，错误提示由 request 拦截器统一给出
	} finally {
		checkingPatient.value = false
	}
}

function unlockPatientProfile () {
	profileLocked.value = false
	ElMessage.info('已解锁，可修改本次挂号信息，不会更新患者档案')
}

async function loadPatients () {
	patientLoading.value = true
	try {
		const body = await listPatients({
			keyword: patientQuery.keyword?.trim() || undefined,
			pageNo: patientQuery.pageNo,
			pageSize: patientQuery.pageSize
		})
		patientList.value = body.data?.records || []
		patientTotal.value = body.data?.totalRow || 0
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		patientLoading.value = false
	}
}

function openPatientDialog () {
	patientQuery.keyword = ''
	patientQuery.pageNo = 1
	patientDialogVisible.value = true
}

function handlePatientDialogOpen () {
	loadPatients()
}

function handlePatientSearch () {
	patientQuery.pageNo = 1
	loadPatients()
}

function handlePatientSizeChange () {
	patientQuery.pageNo = 1
	loadPatients()
}

function choosePatient (patient) {
	applyPatientProfile(patient)
	patientDialogVisible.value = false
	ElMessage.success('已选择患者档案')
}

function resetPatientForm () {
	Object.assign(patientForm, {
		patientName: '',
		gender: '1',
		age: null,
		phone: '',
		idCard: '',
		symptomDesc: ''
	})
	recommendResult.value = null
	selectedDoctor.value = null
	regPeriod.value = '1'
	actualDeptId.value = null
	actualDoctorId.value = null
	fee.value = 0
	feeTitle.value = ''
	resetPatientProfile()
	resetChatSession()
	patientFormRef.value?.clearValidate()
	loadOptions()
}

async function submitRegistration () {
	const valid = await patientFormRef.value.validate().catch(() => false)
	if (!valid) {
		return
	}
	if (!actualDeptId.value) {
		ElMessage.warning('请先点击智能推荐或手动选择挂号科室')
		return
	}
	registering.value = true
	try {
		const payload = {
			patientId: patientId.value || null,
			patientName: patientForm.patientName.trim(),
			gender: patientForm.gender,
			age: patientForm.age,
			phone: patientForm.phone?.trim() || null,
			idCard: patientForm.idCard?.trim() || null,
			symptomDesc: patientForm.symptomDesc?.trim() || null,
			recommendDeptId: recommendResult.value?.deptId || null,
			recommendDeptName: recommendResult.value?.deptName || null,
			recommendDoctorId: selectedDoctor.value?.doctorId || null,
			recommendDoctorName: selectedDoctor.value?.doctorName || null,
			recommendSource: recommendResult.value?.source || null,
			deptId: actualDeptId.value,
			doctorId: actualDoctorId.value || null,
			regPeriod: regPeriod.value,
			fee: fee.value,
			status: '0'
		}
		const body = await addRegistration(payload)
		const registration = body?.data || {}
		resetPatientForm()
		await loadData()
		if (Number(registration.fee ?? payload.fee ?? 0) > 0) {
			ElMessage.success('挂号成功，请扫码支付挂号费')
			await openPayment(registration)
		} else {
			ElMessage.success('挂号成功')
		}
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		registering.value = false
	}
}

// ---------- 扫码支付 ----------
async function openPayment (registration) {
	if (!registration?.id) {
		return
	}
	payRegistration.value = registration
	paySettled = false
	stopPayTimers()
	payOrder.value = null
	payQrImage.value = ''
	payQrError.value = ''
	payRemaining.value = 0
	payDialogVisible.value = true
	payCreating.value = true
	try {
		const body = await createPayment({ regId: registration.id, payMethod: 'WECHAT' })
		const order = body?.data
		if (!order) {
			payQrError.value = '支付单创建失败，请稍后重试'
			return
		}
		payOrder.value = order
		payRemaining.value = remainingSeconds(order.expireTime)
		if (!payDialogVisible.value) {
			// 支付单创建期间弹窗已被关闭：直接关闭这张待支付单，避免遗留可支付的二维码
			if (order.status === '0' && order.payNo) {
				closePayment(order.payNo).catch(() => {})
			}
			return
		}
		if (order.status === '1') {
			handlePaid(order, { silent: true })
			return
		}
		await renderPayQr(order.qrContent)
		startPayTimers()
	} catch {
		payQrError.value = '支付单创建失败，请稍后重试'
	} finally {
		payCreating.value = false
	}
}

async function renderPayQr (content) {
	if (!content) {
		payQrImage.value = ''
		return
	}
	try {
		payQrImage.value = await QRCode.toDataURL(content, {
			width: 240,
			margin: 1,
			errorCorrectionLevel: 'M'
		})
	} catch {
		payQrImage.value = ''
		payQrError.value = '二维码生成失败，请点击重新发起支付'
	}
}

function remainingSeconds (expireTime) {
	const expire = new Date(expireTime).getTime()
	if (Number.isNaN(expire)) {
		return 0
	}
	return Math.max(0, Math.floor((expire - Date.now()) / 1000))
}

function startPayTimers () {
	stopPayTimers()
	payCountdownTimer = setInterval(() => {
		payRemaining.value = Math.max(0, payRemaining.value - 1)
		if (payRemaining.value <= 0) {
			clearInterval(payCountdownTimer)
			payCountdownTimer = null
			refreshPayStatus()
		}
	}, 1000)
	payPollTimer = setInterval(refreshPayStatus, 2000)
}

function stopPayTimers () {
	clearInterval(payCountdownTimer)
	clearInterval(payPollTimer)
	payCountdownTimer = null
	payPollTimer = null
}

async function refreshPayStatus () {
	const payNo = payOrder.value?.payNo
	if (!payNo || payChecking.value || paySettled) {
		return
	}
	payChecking.value = true
	try {
		const body = await getPaymentStatus(payNo)
		const order = body?.data
		if (!order) {
			return
		}
		payOrder.value = { ...payOrder.value, ...order }
		if (order.status === '1') {
			handlePaid(order)
		} else if (order.status === '2') {
			stopPayTimers()
			payRemaining.value = 0
		}
	} catch {
		// 轮询失败保持静默，下一轮继续
	} finally {
		payChecking.value = false
	}
}

async function simulatePay () {
	const payNo = payOrder.value?.payNo
	if (!payNo || paySimulating.value || paySettled) {
		return
	}
	paySimulating.value = true
	try {
		const body = await simulatePayment(payNo)
		if (body?.data?.status === '1') {
			handlePaid(body.data)
		}
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		paySimulating.value = false
	}
}

function handlePaid (order, options = {}) {
	if (paySettled) {
		return
	}
	paySettled = true
	stopPayTimers()
	payOrder.value = { ...(payOrder.value || {}), ...(order || {}) }
	payRemaining.value = 0
	if (!options.silent) {
		ElMessage.success('支付成功')
	}
	loadData()
	setTimeout(() => {
		payDialogVisible.value = false
	}, 1200)
}

async function retryPayment () {
	if (payRegistration.value) {
		await openPayment(payRegistration.value)
	}
}

function handlePayDialogClosed () {
	stopPayTimers()
	const order = payOrder.value
	if (order && order.status === '0' && order.payNo) {
		// 关闭弹窗即放弃本次支付，顺手关闭待支付单，避免遗留可支付的二维码
		closePayment(order.payNo).catch(() => {})
	}
	payOrder.value = null
	payQrImage.value = ''
	payQrError.value = ''
	payRemaining.value = 0
	payRegistration.value = null
}

async function loadOptions () {
	try {
		const body = await getRegisterOptions({
			regDate: todayString(),
			regPeriod: regPeriod.value
		})
		options.depts = body.data?.depts || []
		options.doctors = body.data?.doctors || []
	} catch {
		// 错误提示由 request 拦截器统一处理
	}
}

async function loadData () {
	loading.value = true
	try {
		const query = {
			pageNo: params.pageNo,
			pageSize: params.pageSize
		}
		if (params.patientName) {
			query.patientName = params.patientName.trim()
		}
		if (params.deptId) {
			query.deptId = params.deptId
		}
		if (params.status) {
			query.status = params.status
		}
		if (params.dateRange && params.dateRange.length === 2) {
			query.startDate = params.dateRange[0]
			query.endDate = params.dateRange[1]
		}
		const body = await getRegistrationPage(query)
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
	params.patientName = ''
	params.deptId = ''
	params.status = ''
	params.dateRange = []
	params.pageNo = 1
	loadData()
}

function handleSizeChange () {
	params.pageNo = 1
	loadData()
}

function openEdit (row) {
	const doctor = options.doctors.find(item => item.id === row.doctorId)
	Object.assign(editForm, {
		id: row.id,
		patientName: row.patientName,
		gender: row.gender || '0',
		age: row.age,
		phone: row.phone || '',
		idCard: row.idCard || '',
		symptomDesc: row.symptomDesc || '',
		deptId: row.deptId,
		doctorId: row.doctorId,
		fee: row.fee === null || row.fee === undefined ? 0 : Number(row.fee),
		feeTitle: doctor?.title || '',
		status: row.status === '1' ? '1' : '0'
	})
	dialogVisible.value = true
}

function handleEditDeptChange () {
	const doctor = options.doctors.find(item => item.id === editForm.doctorId)
	if (doctor && doctor.deptId !== editForm.deptId) {
		editForm.doctorId = null
		editForm.fee = 0
		editForm.feeTitle = ''
	}
}

// 编辑弹窗换医生后按职称重算挂号费，费用仍只读
function handleEditDoctorChange () {
	const doctor = options.doctors.find(item => item.id === editForm.doctorId)
	editForm.fee = doctor ? Number(doctor.regFee || 0) : 0
	editForm.feeTitle = doctor?.title || ''
}

function resetEditForm () {
	editFormRef.value?.clearValidate()
}

async function submitEdit () {
	const valid = await editFormRef.value.validate().catch(() => false)
	if (!valid) {
		return
	}
	editSubmitting.value = true
	try {
		await updateRegistration({
			id: editForm.id,
			patientName: editForm.patientName.trim(),
			gender: editForm.gender,
			age: editForm.age,
			phone: editForm.phone?.trim() || null,
			idCard: editForm.idCard?.trim() || null,
			symptomDesc: editForm.symptomDesc?.trim() || null,
			deptId: editForm.deptId,
			doctorId: editForm.doctorId || null,
			fee: editForm.fee,
			status: editForm.status
		})
		ElMessage.success('修改成功')
		dialogVisible.value = false
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	} finally {
		editSubmitting.value = false
	}
}

async function handleCancel (row) {
	try {
		await ElMessageBox.confirm(`确定取消患者“${row.patientName}”的挂号吗？`, '取消确认', {
			type: 'warning',
			confirmButtonText: '取消挂号',
			cancelButtonText: '再想想'
		})
	} catch {
		return
	}
	try {
		await cancelRegistration(row.id)
		ElMessage.success('已取消挂号')
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	}
}

async function handleDelete (row) {
	try {
		await ElMessageBox.confirm(`确定删除患者“${row.patientName}”的挂号记录吗？删除后不可恢复。`, '删除确认', {
			type: 'warning',
			confirmButtonText: '删除',
			cancelButtonText: '取消'
		})
	} catch {
		return
	}
	try {
		await deleteRegistration(row.id)
		ElMessage.success('删除成功')
		if (tableData.value.length === 1 && params.pageNo > 1) {
			params.pageNo -= 1
		}
		await loadData()
	} catch {
		// 错误提示由 request 拦截器统一处理
	}
}

loadOptions()
loadData()
</script>

<style scoped lang="scss">
.register-page {
	.register-form-card {
		margin-bottom: 16px;
	}
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-bottom: 8px;
	}
	.recommend-hint {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
		margin-bottom: 8px;
		color: #409eff;
		font-size: 13px;
	}
	.patient-hint {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: -4px 0 12px;
		font-size: 13px;
	}
	.hint-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid #c6e2ff;
		border-top-color: #409eff;
		border-radius: 50%;
		animation: recommend-hint-spin 0.8s linear infinite;
	}
	.recommend-result {
		margin-top: 8px;
		.doctor-cards {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			margin-top: 12px;
		}
		.doctor-card {
			width: 280px;
			&.selected {
				border-color: #67c23a;
				box-shadow: 0 0 0 1px #67c23a inset;
			}
			.doctor-head {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 4px;
				.doctor-name {
					font-size: 16px;
					font-weight: 600;
				}
			}
			.doctor-dept {
				color: #909399;
				font-size: 13px;
				margin-bottom: 8px;
			}
			.doctor-reason {
				color: #606266;
				font-size: 12px;
				line-height: 1.6;
				margin: 8px 0;
				min-height: 38px;
			}
		}
	}
	.chat-panel {
		margin-top: 16px;
		padding: 12px 16px;
		border: 1px solid #e4e7ed;
		border-radius: 8px;
		background: #fafcff;
		.chat-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 8px;
			.chat-title {
				font-weight: 600;
				color: #303133;
			}
		}
		.chat-messages {
			height: 240px;
			padding: 12px;
			overflow-y: auto;
			background: #fff;
			border-radius: 6px;
		}
		.chat-empty {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			color: #a8abb2;
			font-size: 13px;
		}
		.chat-row {
			display: flex;
			margin-bottom: 10px;
			&.user {
				justify-content: flex-end;
				.chat-bubble {
					background: #409eff;
					color: #fff;
				}
			}
			&.assistant {
				justify-content: flex-start;
				.chat-bubble {
					background: #f4f4f5;
					color: #303133;
					&.chat-error {
						background: #fef0f0;
						color: #f56c6c;
					}
				}
			}
		}
		.chat-bubble {
			max-width: 80%;
			padding: 8px 12px;
			border-radius: 8px;
			font-size: 13px;
			line-height: 1.6;
			white-space: pre-wrap;
			word-break: break-word;
		}
		.chat-input {
			display: flex;
			gap: 10px;
			margin-top: 12px;
		}
		.chat-actions {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: 8px;
			.chat-tip {
				color: #909399;
				font-size: 12px;
			}
		}
	}
	.confirm-bar {
		margin-top: 16px;
		padding-top: 8px;
		border-top: 1px dashed #dcdfe6;
		.confirm-form {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
		}
	}
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

.fee-display {
	display: flex;
	align-items: center;
	gap: 8px;
	.fee-amount {
		font-size: 15px;
		font-weight: 600;
		color: #f56c6c;
	}
	.fee-tip {
		color: #909399;
		font-size: 12px;
	}
}

.pay-panel {
	min-height: 260px;
	.pay-amount {
		text-align: center;
		font-size: 26px;
		font-weight: 700;
		color: #f56c6c;
		margin-bottom: 4px;
	}
	.pay-tip {
		text-align: center;
		color: #606266;
		font-size: 13px;
		margin-bottom: 12px;
	}
	.pay-qr {
		display: block;
		width: 220px;
		height: 220px;
		margin: 0 auto;
		border: 1px solid #ebeef5;
		border-radius: 8px;
	}
	.pay-qr-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #a8abb2;
		font-size: 13px;
	}
	.pay-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 10px;
		color: #909399;
		font-size: 12px;
		text-align: center;
	}
	.pay-expire {
		margin-top: 8px;
		text-align: center;
		font-size: 13px;
		color: #e6a23c;
		&.expired {
			color: #f56c6c;
		}
	}
	.pay-actions {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-top: 12px;
	}
	.pay-note {
		margin-top: 12px;
		color: #a8abb2;
		font-size: 12px;
		line-height: 1.6;
	}
	.pay-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 220px;
		color: #909399;
	}
}

@keyframes recommend-hint-spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
