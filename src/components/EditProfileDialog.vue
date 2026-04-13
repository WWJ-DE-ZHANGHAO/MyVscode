<template>
  <el-dialog v-model="localVisible" title="修改资料" width="520px" :append-to-body="true" center>
    <div class="avatar-row" style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <div class="avatar-preview">
        <img v-if="form.avatar" :src="form.avatar" alt="avatar" />
        <div v-else class="avatar-placeholder"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
        <el-button size="small" @click="triggerFile">重新上传</el-button>
        <el-button size="small" type="danger" @click="deleteAvatar" v-if="form.avatar">删除图片</el-button>
        <div v-if="uploading" style="color:#999;font-size:12px">上传中…</div>
      </div>
    </div>

    <el-form :model="form" label-width="80px">
      <el-form-item label="用户名">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>

      <el-form-item label="手机号">
        <el-input v-model="form.phone" placeholder="请输入手机号" />
      </el-form-item>

      <el-form-item label="密码">
        <el-input v-model="form.password" type="password" placeholder="如不修改可留空" show-password />
      </el-form-item>

      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio label="male">男</el-radio>
          <el-radio label="female">女</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="onCancel">取消</el-button>
      <el-button type="primary" @click="onSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, watch, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: () => ({}) }
})
const emits = defineEmits(['update:modelValue', 'saved'])

// 使用带 getter/setter 的 computed 直接代理 prop，并在 set 时发出 update:modelValue
const localVisible = computed({
  get() { return props.modelValue },
  set(v) { emits('update:modelValue', v) }
})

// 本地表单拷贝
const form = reactive({
  avatar: '',
  username: '',
  phone: '',
  password: '',
  gender: 'male'
})

const uploading = ref(false)
const fileInput = ref(null)

// 监听用户数据，打开弹窗时自动填充
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.user) {
    form.avatar = props.user.avatar || ''
    form.username = props.user.username || ''
    form.phone = props.user.phone || ''
    form.password = ''
    // 后端 gender 字段为 Integer (0/1/2)，映射为 'male'/'female'
    if (props.user.gender === 1) form.gender = 'male'
    else if (props.user.gender === 2) form.gender = 'female'
    else form.gender = 'male'
  }
}, { immediate: true })

// 观察 localVisible，确认内部 v-model 状态
watch(() => localVisible.value, (v) => { /* debug可选打印 */ })

const triggerFile = () => { fileInput.value && fileInput.value.click() }

const onFileChange = async (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  // 上传到后端 (/user/upload/upload)，返回文件路径
  const fd = new FormData()
  fd.append('file', f)
  uploading.value = true
  try {
    const res = await request.post('/user/upload/upload', fd)
    // 期望 res 为字符串路径或 { data: path }
    const path = (typeof res === 'string') ? res : (res && (res.data || res.filePath || res.url) ? (res.data || res.filePath || res.url) : null)
    if (path) {
      form.avatar = path
      ElMessage.success('上传成功')
    } else if (res && res.success && res.data) {
      form.avatar = res.data
      ElMessage.success('上传成功')
    } else {
      console.warn('upload responded', res)
      ElMessage.success('上传完成（请确认返回值）')
    }
  } catch (err) {
    console.error('upload failed', err)
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
    // 清空 file input，允许重选同一文件
    try { e.target.value = '' } catch (ee) {}
  }
}

const deleteAvatar = () => {
  form.avatar = ''
  ElMessage.info('已删除头像（本地）')
}

const onSave = async () => {
  // 构建发送给后端的 payload，按后端要求转换 gender
  const payload = {
    username: form.username,
    avatar: form.avatar,
    phone: form.phone,
    gender: form.gender === 'male' ? 1 : (form.gender === 'female' ? 2 : 0)
  }
  // 若用户填写了密码，才发送密码字段
  if (form.password && form.password.trim()) payload.password = form.password.trim()

  try {
    // 调试输出：记录请求体，便于后端定位为何校验失败
    console.log('[EditProfileDialog] update payload ->', payload)
    // 一些后端会强制校验地址字段，若后端要求请保留这些字段为空字符串以通过验证
    payload.provinceName = payload.provinceName || ''
    payload.cityName = payload.cityName || ''
    payload.districtName = payload.districtName || ''
    payload.detailAddress = payload.detailAddress || ''

    const res = await request.put('/user/user/update', payload)
    // 成功后通知父组件更新本地缓存，并关闭弹窗
    emits('saved', payload)
    emits('update:modelValue', false)
    ElMessage.success('保存并同步成功')
  } catch (e) {
    console.error('save user failed', e)
    // 若后端返回详细错误信息，优先显示
    try {
      const msg = (e && e.response && e.response.data && (e.response.data.msg || e.response.data.message)) || e.message || '保存失败'
      ElMessage.error(msg)
    } catch (ee) {
      ElMessage.error('保存失败，请重试')
    }
  }
}

const onCancel = () => {
  emits('update:modelValue', false)
}
</script>

<style scoped>
.avatar-row {
  margin-bottom: 16px;
}
.avatar-preview { width:64px; height:64px; border-radius:50%; overflow:hidden; background:#ddd; display:flex; align-items:center; justify-content:center }
.avatar-preview img { width:64px; height:64px; object-fit:cover }
.avatar-placeholder { width:64px; height:64px; background:linear-gradient(135deg,#f2f2f2,#e6e6e6) }
</style>