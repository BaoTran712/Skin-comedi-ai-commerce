<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    default: ""
  },
  to: {
    type: String,
    required: true
  },
  gradient: {
    type: String,
    default: "from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20"
  }
});
</script>

<template>
  <RouterLink 
    :to="to" 
    class="flex flex-col items-center justify-between p-6 rounded-2xl border border-slate-100 bg-white shadow-low hover:shadow-medium hover:-translate-y-1.5 transition-all duration-300 group text-center h-full min-h-[160px]"
  >
    <div 
      class="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition duration-300"
      :class="[gradient]"
    >
      <div class="text-black flex items-center justify-center">
        <slot name="icon"></slot>
      </div>
    </div>
    
    <div>
      <h3 class="font-extrabold text-slate-800 text-sm md:text-base group-hover:text-primary transition-colors">
        {{ title }}
      </h3>
      <p v-if="desc" class="text-xs text-slate-400 mt-1 line-clamp-2">
        {{ desc }}
      </p>
    </div>
    
    <div class="mt-3 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <span>Khám phá</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.0" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </RouterLink>
</template>
