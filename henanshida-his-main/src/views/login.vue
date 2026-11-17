<template>
	<div class="login-page">
		<el-card class="login-card" shadow="always">
			<h1 class="title">医院管理系统</h1>
			<p class="desc">请使用系统账号登录</p>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="0" @keyup.enter="submit">
				<el-form-item prop="username">
					<el-input v-model="form.username" placeholder="用户名" clearable />
				</el-form-item>
				<el-form-item prop="password">
					<el-input v-model="form.password" type="password" placeholder="密码" show-password clearable />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" class="enter-btn" :loading="loading" @click="submit">登 录</el-button>
				</el-form-item>
			</el-form>
			<p v-if="errorTip" class="error-tip">{{ errorTip }}</p>
			<p class="tip">请使用系统分配的账号登录，忘记密码请联系管理员</p>
		</el-card>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { setToken, setUser } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const loading = ref(false)
const errorTip = ref('')
const form = reactive({
	username: '',
	password: ''
})
const rules = {
	username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
	password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function submit () {
	if (loading.value) return
	errorTip.value = ''
	const valid = await formRef.value?.validate().catch(() => false)
	if (!valid) return
	loading.value = true
	try {
		const body = await login({
			username: form.username.trim(),
			password: form.password
		})
		const data = body.data || {}
		const user = data.user || {}
		setToken(data.token)
		setUser({
			username: user.username,
			realName: user.realName,
			deptId: user.deptId,
			deptName: user.deptName,
			post: user.post,
			title: user.title,
			role: (user.roleNames || []).join('、') || '用户'
		})
		ElMessage.success('登录成功')
		const redirect = route.query.redirect
		router.replace(typeof redirect === 'string' && redirect ? redirect : '/home')
	} catch (err) {
		// 后端 code!=200 时拦截器已弹出 msg；这里把可读信息常驻在卡片内，避免一闪而过
		const backendMsg = err?.response?.data?.msg
		const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')
		const isNetwork = /network error/i.test(err?.message || '')
		const msg = backendMsg ||
			(isTimeout ? '请求超时，请稍后重试' : '') ||
			(isNetwork ? '网络异常，请检查网络后重试' : '') ||
			(err?.message && !/timeout|network/i.test(err.message) ? err.message : '') ||
			'登录失败，请稍后重试'
		errorTip.value = msg
	} finally {
		loading.value = false
	}
}
</script>

<style scoped lang="scss">
.login-page {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background: var(--el-color-primary-light-9);
	.login-card {
		width: 420px;
		padding: 12px 8px;
		text-align: center;
		.title {
			margin-bottom: 16px;
			font-size: 22px;
			color: var(--el-color-primary);
		}
		.desc {
			margin-bottom: 24px;
			line-height: 22px;
			color: #606266;
		}
		.enter-btn {
			width: 100%;
		}
		.tip {
			margin-top: 8px;
			font-size: 12px;
			color: #909399;
		}
		.error-tip {
			margin-top: 8px;
			font-size: 13px;
			color: var(--el-color-danger);
		}
	}
}
</style>
