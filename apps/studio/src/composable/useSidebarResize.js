import { reactive, onBeforeUnmount } from 'vue';

export function useSidebarResize({
  defaultWidth = 360,
  minWidth = 280,
  maxWidth = 600,
} = {}) {
  const sidebarCss = reactive({
    width: defaultWidth,
    isDragging: false,
    startX: 0,
    startWidth: defaultWidth,
  });

  const drag = (event) => {
    if (sidebarCss.isDragging) {
      const diffX = event.clientX - sidebarCss.startX;
      sidebarCss.width = Math.max(
        minWidth,
        Math.min(maxWidth, sidebarCss.startWidth + diffX)
      );
    }
  };

  const stopDrag = () => {
    if (!sidebarCss.isDragging) return;
    sidebarCss.isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  };

  const startDrag = (event) => {
    sidebarCss.isDragging = true;
    sidebarCss.startX = event.clientX;
    sidebarCss.startWidth = sidebarCss.width;
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  };

  onBeforeUnmount(() => {
    stopDrag();
  });

  return {
    sidebarCss,
    startDrag,
    stopDrag,
  };
}
