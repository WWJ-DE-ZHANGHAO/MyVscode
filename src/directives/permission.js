export default {
  mounted(el, binding) {
    const permissions = JSON.parse(sessionStorage.getItem('permissions') || '[]')
    if (!permissions.includes(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  }
}
