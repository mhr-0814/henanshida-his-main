<template>
	<el-menu router :default-active="route.path">
		<el-sub-menu index="system">
			<template #title>系统管理</template>
			<el-menu-item index="/user">用户管理</el-menu-item>
			<el-menu-item index="/role">角色管理</el-menu-item>
			<el-menu-item index="/dept">科室管理</el-menu-item>
			<el-menu-item index="/menu">菜单管理</el-menu-item>
			<el-menu-item index="/dict">字典管理</el-menu-item>
		</el-sub-menu>
		<el-sub-menu index="register">
			<template #title>挂号就诊</template>
			<el-menu-item index="/register">挂号管理</el-menu-item>
			<el-menu-item index="/schedule">排班管理</el-menu-item>
			<el-menu-item index="/queue">叫号队列</el-menu-item>
			<el-menu-item index="/triage">分诊管理</el-menu-item>
		</el-sub-menu>
	</el-menu>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped lang="scss">
</style>
