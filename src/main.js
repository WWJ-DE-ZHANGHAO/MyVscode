import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import bookTooltip from './directives/bookTooltip'
import { loadCategories, subscribeCategoryUpdates } from './composables/useCategories'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)

// preload categories for the whole app
loadCategories().catch(err => console.warn('loadCategories failed', err))

// optional: subscribe to category updates via WS if configured
const wsUrl = import.meta.env.VITE_CATEGORY_WS_URL
if (wsUrl) {
	try { subscribeCategoryUpdates(wsUrl) } catch (e) { console.warn('subscribeCategoryUpdates failed', e) }
}

app.mount('#app')

app.directive('book-tooltip', bookTooltip)