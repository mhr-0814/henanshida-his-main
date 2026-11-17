<template>
	<el-sub-menu v-if="hasChildren" :index="'group-' + node.id">
		<template #title>{{ node.name }}</template>
		<menu-node v-for="child in node.children" :key="child.id" :node="child" />
	</el-sub-menu>
	<el-menu-item v-else-if="node.path" :index="node.path">{{ node.name }}</el-menu-item>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({ name: 'MenuNode' })

const props = defineProps({
	node: {
		type: Object,
		required: true
	}
})

const hasChildren = computed(() => Array.isArray(props.node.children) && props.node.children.length > 0)
</script>
