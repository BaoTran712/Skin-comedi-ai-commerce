<script setup>
import { useRouter } from "vue-router";
import { ref, computed, onMounted } from 'vue';
import PublisherService from "../services/publisher.service";
import BookService from "../services/book.service";
import { push } from "notivue";
import { onUnmounted } from 'vue';

const role = computed(() => localStorage.getItem("role"));
const router = useRouter();
const publisherService = new PublisherService();
const bookService = new BookService();

const props = defineProps({
  book: {
    type: Object,
    required: true
  }
});

const title = ref("");
const loading = ref(true);

const isFlashSaleActive = ref(false);
const timeLeft = ref("");
let timerInterval = null;

const updateFlashSale = () => {
  if (!props.book?.flash_sale_end_time || !props.book?.flash_sale_price) {
    isFlashSaleActive.value = false;
    return;
  }
  const now = new Date().getTime();
  const endTime = new Date(props.book.flash_sale_end_time).getTime();
  const distance = endTime - now;

  if (distance < 0) {
    isFlashSaleActive.value = false;
    timeLeft.value = "";
    clearInterval(timerInterval);
    return;
  }

  isFlashSaleActive.value = true;
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  timeLeft.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

onMounted(() => {
  updateFlashSale();
  timerInterval = setInterval(updateFlashSale, 1000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

const goToBorrowBook = (book_id) => {
  if (props.book?.quantity <= 0) {
    push.error("Không thể mượn sách do sách đã hết");
  }
  else {
    router.push({ name: "borrow.add", params: { id: book_id } });
  }
};

const goToEditBook = (book_id) => {
  router.push({ name: "book.edit", params: { id: book_id } });
};

</script>

<template>
  <div class="flex flex-col h-full shadow rounded-lg overflow-hidden hover:shadow-lg hover:scale-[1.001] transition">

    <div class="h-48 w-full relative">
      <div v-if=" loading " class="skeleton h-full w-full object-cover"></div>
      <img alt="Book cover" @load="loading = false" :class=" { 'opacity-0': loading } "
        :src=" `https://picsum.photos/seed/${ encodeURIComponent( props.book?.title ) }/800` "
        class="shadow-md h-full w-full object-cover transition-all duration-300" />
      <div v-if="isFlashSaleActive" class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg shadow-red-500/50 flex flex-col items-center border border-red-400 backdrop-blur-sm bg-opacity-90">
        <span class="flex items-center gap-1"><span class="animate-bounce inline-block">⚡</span> FLASH SALE</span>
        <span class="text-[10px] font-mono mt-0.5">{{ timeLeft }}</span>
      </div>
    </div>

    <dl class="divide-y divide-gray-200 rounded border border-gray-200 text-sm">
      <div class="grid grid-cols-1 p-2">
        <dt class="font-bold text-gray-900">Tựa sách</dt>
        <dd class="text-gray-800 sm:col-span-2 truncate">{{ book.title || "Không xác định" }}</dd>
      </div>
      <div class="grid grid-cols-1 p-2">
        <dt class="font-bold text-gray-900">Tác giả</dt>
        <dd class="text-gray-800 sm:col-span-2 truncate">{{ book.author || "Không xác định" }}</dd>
      </div>
      <div class="grid grid-cols-1 p-2">
        <dt class="font-bold text-gray-900">Năm xuất bản</dt>
        <dd class="text-gray-800 sm:col-span-2 truncate">{{ book.published_year || "Không xác định" }}</dd>
      </div>
      <div class="grid grid-cols-1 p-2">
        <dt class="font-bold text-gray-900">Nhà xuất bản</dt>
        <dd class="text-gray-800 sm:col-span-2 truncate">{{ book.publisher_id?.name || "Không xác định" }}</dd>
      </div>
      <div class="grid grid-cols-1 p-2">
        <dt class="font-bold text-gray-900">Đơn giá</dt>
        <template v-if="isFlashSaleActive">
          <dd class="sm:col-span-2 truncate flex flex-col">
            <span class="text-sm line-through text-gray-400">{{ `${ book.price.toLocaleString() }đ` }}</span>
            <span class="text-lg font-bold text-red-600 animate-pulse">{{ `${ book.flash_sale_price.toLocaleString() }đ` }}</span>
          </dd>
        </template>
        <template v-else>
          <dd class="text-gray-800 sm:col-span-2 truncate">{{ `${ book.price.toLocaleString() }đ` || "Không xác định" }}</dd>
        </template>
      </div>
      <div class="grid grid-cols-1 p-2">
        <dt class="font-bold text-gray-900">Số lượng</dt>
        <template v-if=" book.quantity >= 45 ">
          <dd class="text-emerald-600 font-bold sm:col-span-2 truncate">{{ `Còn ${ book.quantity } quyển sách` }}</dd>
        </template>
        <template v-else-if=" book.quantity >= 30 ">
          <dd class="text-lime-600 font-bold sm:col-span-2 truncate">{{ `Còn ${ book.quantity } quyển sách` }}</dd>
        </template>
        <template v-else-if=" book.quantity >= 15 ">
          <dd class="text-amber-600 font-bold sm:col-span-2 truncate">{{ `Còn ${ book.quantity } quyển sách` }}</dd>
        </template>
        <template v-else-if=" book.quantity >= 1 ">
          <dd class="text-red-600 font-bold sm:col-span-2 truncate">{{ `Còn ${ book.quantity } quyển sách` }}</dd>
        </template>
        <template v-else>
          <dd class="text-stone-600 font-bold sm:col-span-2 truncate">Đã hết sách</dd>
        </template>
      </div>
    </dl>
    <template v-if=" role === 'staff' ">
      <div class="grid grid-cols-1">
        <button @click=" goToEditBook( props.book?._id )"
          class="btn btn-ghost text-base hover:underline hover:btn-info hover:text-white">Chỉnh sửa</button>
      </div>
    </template>
    <template v-else>
      <button @click=" goToBorrowBook( props.book?._id )"
        class="btn btn-ghost text-base hover:underline hover:btn-info hover:text-white font-bold underline">Mượn
        sách</button>
    </template>

  </div>
</template>