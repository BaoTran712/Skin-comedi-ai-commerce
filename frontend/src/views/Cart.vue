<script setup>
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import { ref, onMounted, computed } from "vue";
import { push } from "notivue";
import { useRouter } from "vue-router";

const router = useRouter();
const cartItems = ref([]);

const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
        cartItems.value = JSON.parse(savedCart);
    }
};

const saveCart = () => {
    localStorage.setItem("cart", JSON.stringify(cartItems.value));
};

const removeFromCart = (index) => {
    cartItems.value.splice(index, 1);
    saveCart();
    push.success("Đã xóa sản phẩm khỏi giỏ hàng");
};

const updateQuantity = (index, delta) => {
    const item = cartItems.value[index];
    const newQty = item.quantity + delta;
    if (newQty > 0) {
        item.quantity = newQty;
        saveCart();
    }
};

const totalPrice = computed(() => {
    return cartItems.value.reduce((acc, item) => {
        const price = item.product.flash_sale_price || item.product.price;
        return acc + (price * item.quantity);
    }, 0);
});

const checkout = () => {
    if (cartItems.value.length === 0) {
        push.error("Giỏ hàng trống");
        return;
    }
    router.push({ name: "cart.checkout" });
};

onMounted(() => {
    loadCart();
});

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};
</script>

<template>
    <div class="flex flex-col min-h-screen bg-gray-50">
        <Header />
        
        <main class="flex-grow container mx-auto px-4 py-12">
            <div class="max-w-5xl mx-auto">
                <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Giỏ hàng của bạn</h1>

                <div v-if="cartItems.length > 0" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Items List -->
                    <div class="lg:col-span-2 space-y-4">
                        <div v-for="(item, index) in cartItems" :key="item.product._id" class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center">
                            <img :src="item.product.image || 'https://picsum.photos/200'" class="w-24 h-24 object-cover rounded-xl border" />
                            <div class="flex-grow">
                                <h3 class="font-bold text-gray-800 line-clamp-1">{{ item.product.title }}</h3>
                                <p class="text-sm text-gray-500">{{ item.product.brand_id?.name }}</p>
                                <div class="mt-2 flex items-center gap-4">
                                    <div class="flex items-center border rounded-lg overflow-hidden">
                                        <button @click="updateQuantity(index, -1)" class="px-3 py-1 hover:bg-gray-100">-</button>
                                        <span class="px-4 py-1 font-bold border-x">{{ item.quantity }}</span>
                                        <button @click="updateQuantity(index, 1)" class="px-3 py-1 hover:bg-gray-100">+</button>
                                    </div>
                                    <span class="font-bold text-primary">{{ formatPrice((item.product.flash_sale_price || item.product.price) * item.quantity) }}</span>
                                </div>
                            </div>
                            <button @click="removeFromCart(index)" class="btn btn-ghost btn-circle text-error">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                        <h3 class="text-xl font-bold mb-6">Tóm tắt đơn hàng</h3>
                        <div class="space-y-4 mb-6">
                            <div class="flex justify-between text-gray-600">
                                <span>Tạm tính</span>
                                <span>{{ formatPrice(totalPrice) }}</span>
                            </div>
                            <div class="flex justify-between text-gray-600">
                                <span>Giao hàng</span>
                                <span class="text-emerald-600 font-bold">Miễn phí</span>
                            </div>
                            <div class="border-t pt-4 flex justify-between font-bold text-lg">
                                <span>Tổng cộng</span>
                                <span class="text-primary">{{ formatPrice(totalPrice) }}</span>
                            </div>
                        </div>
                        <button @click="checkout" class="btn btn-primary btn-block btn-lg rounded-2xl shadow-lg shadow-primary/30">
                            Tiến hành đặt hàng
                        </button>
                        <RouterLink to="/products" class="btn btn-ghost btn-block mt-2">Tiếp tục mua sắm</RouterLink>
                    </div>
                </div>

                <div v-else class="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div class="text-6xl mb-6">🛒</div>
                    <h2 class="text-2xl font-bold text-gray-400">Giỏ hàng của bạn đang trống</h2>
                    <p class="text-gray-500 mt-2 mb-8">Hãy khám phá các sản phẩm tuyệt vời từ Testskin</p>
                    <RouterLink to="/products" class="btn btn-primary px-12 rounded-2xl shadow-lg shadow-primary/30">Xem sản phẩm</RouterLink>
                </div>
            </div>
        </main>

        <Footer />
    </div>
</template>
