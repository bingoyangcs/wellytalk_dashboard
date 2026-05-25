import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

interface ResizablePanelOptions {
  initialSpan?: number;
  initialHeight?: number;
  minSpan?: number;
  maxSpan?: number;
  minHeight?: number;
  maxHeight?: number;
  onResize?: () => void;
}

export function useResizablePanel(options: ResizablePanelOptions = {}) {
  const panelRef = ref<HTMLElement>();
  const columnSpan = ref(options.initialSpan ?? 6);
  const panelHeight = ref(options.initialHeight ?? 384);
  const panelWidth = ref(0);
  const resizing = ref(false);
  let panelObserver: ResizeObserver | undefined;
  let resizeState:
    | {
        pointerId: number;
        startX: number;
        startY: number;
        startSpan: number;
        startHeight: number;
        columnWidth: number;
      }
    | undefined;

  const panelStyle = computed(() => ({
    gridColumn: `span ${columnSpan.value}`,
    minHeight: `${panelHeight.value}px`,
  }));

  function startResize(event: PointerEvent) {
    event.preventDefault();
    const grid = panelRef.value?.parentElement;
    if (!grid) return;

    const gridWidth = grid.getBoundingClientRect().width;
    panelWidth.value = panelRef.value?.getBoundingClientRect().width ?? 0;
    resizing.value = true;
    resizeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startSpan: columnSpan.value,
      startHeight: panelHeight.value,
      columnWidth: gridWidth / 12,
    };

    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    window.addEventListener('pointermove', handleResize);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
    document.body.classList.add('is-resizing-panel');
  }

  function handleResize(event: PointerEvent) {
    if (!resizeState) return;
    event.preventDefault();

    const spanDelta = Math.round((event.clientX - resizeState.startX) / resizeState.columnWidth);
    columnSpan.value = Math.min(
      options.maxSpan ?? 12,
      Math.max(options.minSpan ?? 4, resizeState.startSpan + spanDelta),
    );
    panelHeight.value = Math.min(
      options.maxHeight ?? 720,
      Math.max(options.minHeight ?? 300, resizeState.startHeight + event.clientY - resizeState.startY),
    );
    panelWidth.value = panelRef.value?.getBoundingClientRect().width ?? panelWidth.value;
    options.onResize?.();
  }

  function stopResize(event: PointerEvent) {
    if (resizeState && event.pointerId !== resizeState.pointerId) return;
    resizing.value = false;
    resizeState = undefined;
    window.removeEventListener('pointermove', handleResize);
    window.removeEventListener('pointerup', stopResize);
    window.removeEventListener('pointercancel', stopResize);
    document.body.classList.remove('is-resizing-panel');
    options.onResize?.();
  }

  onMounted(() => {
    void nextTick(() => {
      if (!panelRef.value) return;
      panelWidth.value = panelRef.value.getBoundingClientRect().width;
      panelObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          panelWidth.value = entry.contentRect.width;
        }
      });
      panelObserver.observe(panelRef.value);
    });
  });

  onBeforeUnmount(() => {
    panelObserver?.disconnect();
    window.removeEventListener('pointermove', handleResize);
    window.removeEventListener('pointerup', stopResize);
    window.removeEventListener('pointercancel', stopResize);
    document.body.classList.remove('is-resizing-panel');
  });

  return {
    panelRef,
    panelHeight,
    panelWidth,
    panelStyle,
    resizing,
    startResize,
  };
}
