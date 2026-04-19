<template>
  <div class="editor-container">
    <div style="border: 1px solid #ccc;">
      <Toolbar
        style="border-bottom: 1px solid #ccc"
        :editor="editorRef"
        :default-config="toolbarConfig"
      />
      <Editor
        v-model="value"
        style="height: 300px; overflow-y: hidden;"
        :default-config="editorConfig"
        @onCreated="onCreated"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const value = ref(props.modelValue)
const editorRef = ref(null)

// 工具栏配置
const toolbarConfig = {
  excludeKeys: ['fullscreen']
}

// 编辑器配置
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/admin/upload/upload',
      fieldName: 'file',
      headers: {
        token: sessionStorage.getItem('token') || ''
      },
      maxFileSize: 2 * 1024 * 1024, // 2MB
      maxNumberOfFiles: 10,
      allowedFileTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
      base64LimitSize: 0, // 禁止 base64 上传
      customUpload: async (file, insertFn) => {
        console.log('customUpload file:', file)
        
        const formData = new FormData()
        formData.append('file', file)
        
        try {
          const response = await fetch('/admin/upload/upload', {
            method: 'POST',
            headers: {
              'token': sessionStorage.getItem('token') || ''
            },
            body: formData
          })
          
          const result = await response.json()
          console.log('上传结果:', result)
          
          if (result.code === 1 && result.data) {
            // 去除反引号和前后空格
            const imageUrl = result.data.replace(/[`\s]/g, '')
            console.log('处理后 imageUrl:', imageUrl)
            // 插入图片到编辑器
            insertFn(imageUrl, file.name, imageUrl)
          } else {
            alert('上传失败: ' + (result.msg || '未知错误'))
          }
        } catch (error) {
          console.error('上传错误:', error)
          alert('上传失败: ' + error.message)
        }
      }
    }
  }
}

// 编辑器创建完成
const onCreated = (editor) => {
  editorRef.value = editor
  console.log('Editor created:', editor)
}

// 监听 value 变化
watch(value, (newValue) => {
  emit('update:modelValue', newValue)
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== value.value) {
    value.value = newValue
  }
})

// 组件销毁前销毁编辑器
onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})
</script>

<style scoped>
.editor-container {
  border-radius: 4px;
  overflow: hidden;
}
</style>