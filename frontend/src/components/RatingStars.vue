<script setup>
import { computed } from 'vue';

const props = defineProps({
  rating: {
    type: Number,
    required: true,
    default: 5
  },
  maxStars: {
    type: Number,
    default: 5
  },
  starSize: {
    type: String,
    default: "text-sm"
  }
});

const stars = computed(() => {
  const list = [];
  const fullStars = Math.floor(props.rating);
  const hasHalf = props.rating % 1 >= 0.5;
  
  for (let i = 1; i <= props.maxStars; i++) {
    if (i <= fullStars) {
      list.push('full');
    } else if (i === fullStars + 1 && hasHalf) {
      list.push('half');
    } else {
      list.push('empty');
    }
  }
  return list;
});
</script>

<template>
  <div class="flex items-center gap-0.5" :class="starSize">
    <span 
      v-for="(star, index) in stars" 
      :key="index"
      :class="{
        'text-amber-400': star === 'full' || star === 'half',
        'text-slate-200': star === 'empty'
      }"
      class="font-mono selection:bg-transparent"
    >
      {{ star === 'full' ? '★' : star === 'half' ? '⯪' : '☆' }}
    </span>
  </div>
</template>
