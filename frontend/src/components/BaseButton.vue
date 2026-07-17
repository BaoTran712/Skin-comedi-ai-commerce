<template>
  <button
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // 'primary' | 'secondary' | 'neutral'
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
  },
  disabled: Boolean,
});

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-secondary text-white hover:bg-secondary-dark shadow-medium rounded-lg';
    case 'neutral':
      return 'bg-neutral text-white hover:bg-neutral-dark shadow-low rounded-lg';
    case 'primary':
    default:
      return 'bg-primary-gradient text-white hover:bg-primary-light shadow-high rounded-lg';
  }
});

const buttonClasses = computed(() => {
  return [
    'rounded-lg',
    'font-semibold',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2 focus:ring-primary/50',
    sizeClasses[props.size] || sizeClasses.md,
    variantClasses.value,
    props.disabled ? 'opacity-50 cursor-not-allowed' : '',
  ].join(' ');
});
</script>

<style scoped>
/* additional hover/active effects are defined via utility classes */
</style>
