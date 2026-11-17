<template>
	<el-container class="home-wrapper">
		<el-aside width="200px">
			<wy-menu />
		</el-aside>
		<el-container>
			<el-header>
				<h1>医院信息管理</h1>
			</el-header>
			<el-main>
				<router-view />
			</el-main>
		</el-container>
	</el-container>
</template>

<script setup>
import WyMenu from '@/components/menu/index.vue'
</script>

<style scoped lang="scss">
$home_border: 1px solid #cccccc;
.home-wrapper {
	height: 100vh;
}
.el-aside {
	border-right: $home_border;
}
.el-header {
	display: flex;
	align-items: center;
	border-bottom: $home_border;
	h1 {
		line-height: 60px;
	}
}
.el-main {
	padding: 24px;
}
</style>
