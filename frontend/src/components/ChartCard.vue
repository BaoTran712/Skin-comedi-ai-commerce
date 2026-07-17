<template>
  <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
    <h3 class="text-lg font-medium text-gray-700 mb-4">{{ title }}</h3>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const props = defineProps({
  title: { type: String, required: true },
  labels: { type: Array, required: true },
  data: { type: Array, required: true },
  backgroundColor: { type: String, default: 'rgba(54,162,235,0.4)' },
  borderColor: { type: String, default: 'rgba(54,162,235,1)' },
});

const canvas = ref(null);
let chartInstance = null;

const buildChart = () => {
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(canvas.value.getContext('2d'), {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [{
        label: props.title,
        data: props.data,
        backgroundColor: props.backgroundColor,
        borderColor: props.borderColor,
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: { x: { display: true }, y: { display: true, beginAtZero: true } },
    },
  });
};

onMounted(buildChart);
watch([() => props.labels, () => props.data], buildChart);
</script>

<style scoped>
div { height: 300px; }
</style>
