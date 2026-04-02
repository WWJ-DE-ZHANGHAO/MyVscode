// src/directives/bookTooltip.js

let tooltipElement = null;
// 添加一个定时器变量，用于处理快速移入移出时的抖动
let hideTimer = null;

const getTooltipElement = () => {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'global-book-tooltip';
    // 初始状态
    Object.assign(tooltipElement.style, {
      display: 'none',
      position: 'fixed',
      zIndex: '9999',
      pointerEvents: 'none',
      background: 'rgba(0, 0, 0, 0.85)',
      color: '#fff',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '13px',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      opacity: '0',
      transform: 'translateY(5px)', // 加一点位移动画
      left: '0',
      top: '0'
    });
    document.body.appendChild(tooltipElement);
  }
  return tooltipElement;
};

// 全局强制隐藏函数 (用于路由切换时调用)
export const forceHideTooltip = () => {
  if (tooltipElement) {
    clearTimeout(hideTimer);
    tooltipElement.style.opacity = '0';
    tooltipElement.style.display = 'none';
  }
};

export default {
  mounted(el, binding) {
    const tooltip = getTooltipElement();
    const bookTitle = binding.value;

    if (!bookTitle) return;

    el._bookTitle = bookTitle;

    // 显示逻辑
    const showTooltip = (e) => {
      clearTimeout(hideTimer); // 取消之前的隐藏定时
      tooltip.innerText = el._bookTitle;
      tooltip.style.display = 'block';
      
      // 强制重绘
      tooltip.offsetHeight; 
      
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
      updatePosition(e);
    };

    // 隐藏逻辑
    const hideTooltip = () => {
      // 延迟一点隐藏，防止鼠标快速滑过导致闪烁，也给 leave 事件一点缓冲
      hideTimer = setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(5px)';
        // 等动画结束后再 display:none
        setTimeout(() => {
          if (tooltip.style.opacity === '0') {
            tooltip.style.display = 'none';
          }
        }, 200);
      }, 50); 
    };

    const updatePosition = (e) => {
      const x = e.clientX + 15;
      const y = e.clientY + 15;
      
      // 简单的边界检查
      const rect = tooltip.getBoundingClientRect();
      const offsetX = x + rect.width > window.innerWidth ? -rect.width - 10 : 15;
      const offsetY = y + rect.height > window.innerHeight ? -rect.height - 10 : 15;

      tooltip.style.left = (e.clientX + offsetX) + 'px';
      tooltip.style.top = (e.clientY + offsetY) + 'px';
    };

    // 绑定事件
    // 注意：pointer-events: none 可能会影响 mouseenter，确保 el 本身能接收事件
    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('mousemove', updatePosition);

    el._tooltipCleanup = () => {
      el.removeEventListener('mouseenter', showTooltip);
      el.removeEventListener('mouseleave', hideTooltip);
      el.removeEventListener('mousemove', updatePosition);
    };
  },
  beforeUnmount(el) {
    // 组件销毁时，清理事件
    if (el._tooltipCleanup) {
      el._tooltipCleanup();
      delete el._tooltipCleanup;
      delete el._bookTitle;
    }
    // 【关键修复】如果当前鼠标正悬停在这个元素上，切换路由时必须强制隐藏全局 Tooltip
    forceHideTooltip();
  },
  updated(el, binding) {
    el._bookTitle = binding.value;
  }
};