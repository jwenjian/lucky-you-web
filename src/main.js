import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import VueI18n from 'vue-i18n'
import './util'
import './registerServiceWorker'
import '@fortawesome/fontawesome-free/js/all'
import VueDarkMode from '@vue-a11y/dark-mode'

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(VueI18n)
Vue.use(VueDarkMode)

const messages = {
  "en": require('./locale/en_US.json'),
  "zh": require('./locale/zh_CN.json')
}

const i18n = new VueI18n({
  locale: "en",
  messages
})

new Vue({
  i18n,
  render: h => h(App),
}).$mount('#app')
