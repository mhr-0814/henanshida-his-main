import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import App from './App.vue'  // 把App.vue引入进来
import '@/css/main'
import router from './router'

const app = createApp(App)  // 以App.vue作为根组件创建Vue实例

app.use(createPinia())
app.use(router)

app.mount('#app')
