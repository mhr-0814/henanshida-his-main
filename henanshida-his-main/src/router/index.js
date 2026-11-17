import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
		{
			path: '/',
			redirect: '/login'
		},
		{
			path: '/login',
			component: () => import('@/views/login.vue')
		},
		{
			path: '/home',
			component: () => import('@/views/home'),
			redirect: '/dept',
			children: [
				{
					path: '/dept',
					component: () => import('@/views/system/dept')
				},
				{
					path: '/user',
					component: () => import('@/views/system/user')
				},
				{
					path: '/role',
					component: () => import('@/views/system/role')
				},
				{
					path: '/menu',
					component: () => import('@/views/system/menu')
				},
				{
					path: '/dict',
					component: () => import('@/views/system/dict')
				},
				{
					path: '/register',
					component: () => import('@/views/register')
				},
				{
					path: '/schedule',
					component: () => import('@/views/schedule')
				},
				{
					path: '/queue',
					component: () => import('@/views/queue')
				},
				{
					path: '/triage',
					component: () => import('@/views/triage')
				}
			]
		},
		{
			path: '/:pathMatch(.*)*',
			redirect: '/home'
		}
	]
})

export default router
