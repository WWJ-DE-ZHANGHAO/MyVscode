import { onMounted, onBeforeUnmount } from 'vue'

/**
 * useMenuLoader(path, handler)
 * 当侧栏发送 window CustomEvent 'menu-click' 且 detail 等于 path 时执行 handler
 */
export default function useMenuLoader(path, handler) {
  const listener = (e) => {
    try {
      if (!e) return
      const detail = e.detail
      if (detail === path) {
        handler && handler()
      }
    } catch (err) {}
  }

  onMounted(() => {
    window.addEventListener('menu-click', listener)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('menu-click', listener)
  })
}
