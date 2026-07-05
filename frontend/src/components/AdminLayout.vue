<script setup>
import Header from "./Header.vue";
import Footer from "./Footer.vue";
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <slot></slot>
    </main>
    <Footer />
  </div>
</template>
