<template>
  <div class="mermaid-chart-container">
    <div v-html="svgContent" class="mermaid-chart"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick, ref } from 'vue';

const props = defineProps<{
  code: string;
}>();

const svgContent = ref('');
const mermaidLoaded = ref(false);
let mermaidInstance: any = null;

const loadMermaid = async () => {
  if (mermaidInstance) return;
  
  try {
    const mermaidModule = await import('mermaid');
    mermaidInstance = mermaidModule.default || mermaidModule;
    mermaidLoaded.value = true;
  } catch (err) {
    console.error('Failed to load mermaid:', err);
  }
};

const renderChart = async () => {
  if (!mermaidInstance) {
    await loadMermaid();
  }

  await nextTick();

  try {
    const result = await mermaidInstance.render(`mermaid-${Date.now()}`, props.code);
    
    if (result && result.svg) {
      svgContent.value = result.svg;
    } else {
      svgContent.value = '<pre style="color: #f66; font-size: 12px;">Mermaid渲染返回空结果</pre>';
    }
  } catch (err: any) {
    console.error('Mermaid render error:', err);
    svgContent.value = `<pre style="color: #f66; font-size: 12px;">Mermaid渲染失败: ${err.message}</pre>`;
  }
};

onMounted(() => {
  loadMermaid().then(() => {
    if (mermaidInstance) {
      try {
        mermaidInstance.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#C9A96E',
            primaryTextColor: '#e5e5e5',
            primaryBorderColor: '#8B2635',
            lineColor: '#C9A96E',
            secondaryColor: '#8B2635',
            tertiaryColor: '#333',
            backgroundColor: '#24201C',
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
          },
        });
        renderChart();
      } catch (err) {
        console.error('Error initializing mermaid:', err);
      }
    }
  });
});

watch(() => props.code, () => {
  if (mermaidLoaded.value) {
    renderChart();
  }
});
</script>

<style scoped>
.mermaid-chart-container {
  width: 100%;
  overflow-x: auto;
  padding: 16px 0;
}

.mermaid-chart {
  max-width: 100%;
  display: flex;
  justify-content: center;
}

.mermaid-chart svg {
  max-width: 100%;
  height: auto;
}
</style>