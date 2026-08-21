<template>
  <div class="fixed bottom-6 right-6 z-50">
    <!-- Chat Button -->
    <button 
      v-if="!isOpen" 
      @click="isOpen = true"
      class="btn btn-circle btn-lg btn-primary shadow-lg animate-bounce"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    </button>

    <!-- Chat Window -->
    <div 
      v-else 
      class="flex flex-col bg-base-100 w-80 sm:w-[400px] rounded-2xl shadow-2xl overflow-hidden border border-base-300"
      style="height: 550px; max-height: 85vh;"
    >
      <!-- Header -->
      <div class="bg-primary text-primary-content p-4 flex justify-between items-center shadow-md z-10">
        <div class="flex items-center gap-3">
          <div class="avatar online">
            <div class="w-10 rounded-full bg-white text-primary p-1">
               <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix" alt="bot avatar" />
            </div>
          </div>
          <div>
            <h3 class="font-bold">Skin AI Assistant</h3>
            <p class="text-xs opacity-80">Luôn sẵn sàng tư vấn</p>
          </div>
        </div>
        <button @click="isOpen = false" class="btn btn-ghost btn-sm btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200" ref="messagesContainer">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['chat', msg.role === 'user' ? 'chat-end' : 'chat-start']"
        >
          <div class="chat-image avatar" v-if="msg.role === 'model'">
            <div class="w-8 rounded-full bg-white">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix" alt="bot avatar" />
            </div>
          </div>
          <div :class="['chat-bubble', msg.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-base-100 text-base-content shadow-sm whitespace-pre-wrap']">
            {{ msg.text }}
          </div>
        </div>

        <div v-if="isLoading" class="chat chat-start">
          <div class="chat-image avatar">
            <div class="w-8 rounded-full bg-white">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix" alt="bot avatar" />
            </div>
          </div>
          <div class="chat-bubble chat-bubble-base-100 shadow-sm flex items-center gap-1">
            <span class="loading loading-dots loading-sm"></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <form @submit.prevent="sendMessage" class="p-3 bg-base-100 border-t border-base-300 flex gap-2">
        <input 
          v-model="inputMessage" 
          type="text" 
          placeholder="Nhập câu hỏi..." 
          class="input input-bordered input-sm sm:input-md flex-1 rounded-full"
          :disabled="isLoading"
        />
        <button type="submit" class="btn btn-primary btn-circle btn-sm sm:btn-md" :disabled="!inputMessage.trim() || isLoading">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const isOpen = ref(false);
const inputMessage = ref('');
const messages = ref([
  { role: 'model', text: 'Chào bạn, mình là trợ lý AI chuyên tư vấn da liễu của Skin. Bạn đang gặp vấn đề gì về da?' }
]);
const isLoading = ref(false);
const messagesContainer = ref(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const sendMessage = async () => {
  const text = inputMessage.value.trim();
  if (!text) return;

  // Add user message
  messages.value.push({ role: 'user', text });
  inputMessage.value = '';
  scrollToBottom();

  // Prepare history for API
  const history = messages.value.slice(1, -1); // Exclude welcome message

  isLoading.value = true;
  scrollToBottom();

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        history: history
      })
    });

    const result = await response.json();
    
    if (result.success && result.data) {
      messages.value.push({ role: 'model', text: result.data.text });
    } else {
      messages.value.push({ role: 'model', text: result.message || 'Xin lỗi, có lỗi xảy ra.' });
    }
  } catch (error) {
    messages.value.push({ role: 'model', text: 'Xin lỗi, không thể kết nối đến máy chủ.' });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};
</script>
