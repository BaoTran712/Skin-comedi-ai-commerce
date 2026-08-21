<script setup>
import { ref, onMounted, nextTick } from 'vue';
import ChatService from '../services/chat.service';

const chatService = new ChatService();
const isOpen = ref(false);
const message = ref('');
const messages = ref([
    { text: 'Xin chào! Tôi là trợ lý AI của Testskin. Tôi có thể giúp gì cho bạn?', isUser: false }
]);
const isLoading = ref(false);
const chatContainer = ref(null);

const toggleChat = () => {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        scrollToBottom();
    }
};

const sendMessage = async () => {
    if (!message.value.trim() || isLoading.value) return;

    const userMessage = message.value;
    
    // Prepare history
    const history = messages.value.slice(1).map(m => ({
        role: m.isUser ? 'user' : 'model',
        text: m.text
    }));

    // Retrieve optional AI diagnosis context from localStorage
    const savedDiagnosis = localStorage.getItem('latest_ai_diagnosis');
    let aiContext = null;
    if (savedDiagnosis) {
        try {
            aiContext = JSON.parse(savedDiagnosis);
        } catch (e) {
            console.error("Failed to parse saved diagnosis:", e);
        }
    }

    messages.value.push({ text: userMessage, isUser: true });
    message.value = '';
    isLoading.value = true;

    scrollToBottom();

    try {
        const response = await chatService.sendMessage(userMessage, history, aiContext);
        messages.value.push({ 
            text: response.text, 
            isUser: false, 
            suggestedProducts: response.suggestedProducts 
        });
    } catch (error) {
        messages.value.push({ text: 'Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại sau.', isUser: false });
    } finally {
        isLoading.value = false;
        scrollToBottom();
    }
};

const scrollToBottom = async () => {
    await nextTick();
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
};
</script>

<template>
    <div class="fixed bottom-6 right-6 z-50">
        <!-- Chat Window -->
        <Transition name="chat-window">
            <div v-if="isOpen" class="bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col mb-4 overflow-hidden w-[380px] h-[600px] max-h-[80vh]">
                <!-- Header -->
                <div class="bg-primary p-4 text-white flex items-center justify-between shadow-lg">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <span class="text-xl">🤖</span>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg leading-tight">Testskin AI</h3>
                            <p class="text-xs text-white/80">Đang trực tuyến</p>
                        </div>
                    </div>
                    <button @click="toggleChat" class="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Messages -->
                <div ref="chatContainer" class="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    <div v-for="(msg, index) in messages" :key="index" :class="['flex', msg.isUser ? 'justify-end' : 'justify-start animate-in fade-in slide-in-from-left-4 duration-300']">
                        <div :class="['max-w-[85%] p-4 rounded-3xl text-sm shadow-sm transition-all', 
                            msg.isUser ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100']">
                            <p class="whitespace-pre-line">{{ msg.text }}</p>
                            
                            <!-- Suggested Products -->
                            <div v-if="msg.suggestedProducts && msg.suggestedProducts.length > 0" class="mt-4 space-y-2">
                                <p class="text-xs font-bold opacity-70 uppercase tracking-wider">Sản phẩm gợi ý:</p>
                                <div class="grid grid-cols-1 gap-2">
                                    <RouterLink v-for="product in msg.suggestedProducts" :key="product._id" :to="'/products/' + product._id" 
                                        class="flex items-center gap-3 bg-gray-50 p-2 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100 group">
                                        <img :src="product.image" class="w-10 h-10 object-cover rounded-lg shadow-sm" />
                                        <div class="flex-grow min-w-0">
                                            <p class="font-semibold text-gray-800 truncate text-xs">{{ product.title }}</p>
                                            <p class="text-[10px] text-primary">{{ product.price.toLocaleString('vi-VN') }}đ</p>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    </RouterLink>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Loading Indicator -->
                    <div v-if="isLoading" class="flex justify-start animate-in fade-in duration-300">
                        <div class="bg-white p-4 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                            <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                            <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                    </div>
                </div>

                <!-- Input -->
                <div class="p-4 bg-white border-t border-gray-100">
                    <form @submit.prevent="sendMessage" class="flex items-center gap-2">
                        <input v-model="message" type="text" placeholder="Nhập câu hỏi của bạn..." 
                            class="flex-grow bg-gray-100 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" />
                        <button type="submit" :disabled="!message.trim() || isLoading" 
                            class="bg-primary text-white p-3 rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-primary/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </Transition>

        <!-- Toggle Button -->
        <button @click="toggleChat" :class="['w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95', 
            isOpen ? 'bg-white text-primary rotate-180' : 'bg-primary text-white']">
            <svg v-if="!isOpen" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    </div>
</template>

<style scoped>
.chat-window-enter-active,
.chat-window-leave-active {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.chat-window-enter-from,
.chat-window-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
}

.animate-in {
    animation: animate-in 0.3s ease-out forwards;
}

@keyframes animate-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
