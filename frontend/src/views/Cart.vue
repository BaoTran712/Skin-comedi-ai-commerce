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

const getItemImage = (item) => {
    // Always use snapshot image — variant first, then product image
    if (item.variant?.image) return item.variant.image;
    if (item.product?.image) return item.product.image;
    return `/images/product-missing.svg`;
};

const getItemPrice = (item) => {
    if (item.variant?.price) return item.variant.price;
    return item.product?.flash_sale_price || item.product?.price || 0;
};

const getVariantLabel = (item) => {
    if (!item.variant?.attributes?.length) return null;
    return item.variant.attributes.map(a => `${a.name}: ${a.value}`).join(' | ');
};

const totalPrice = computed(() => {
    return cartItems.value.reduce((acc, item) => {
        return acc + (getItemPrice(item) * item.quantity);
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
    <div class="flex flex-col min-h-screen bg-[#f5f5f5]">
        <Header />
        
        <main class="flex-grow container mx-auto px-4 py-8">
            <div class="max-w-5xl mx-auto">
                <!-- Page title -->
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-1 h-7 bg-orange-500 rounded-full"></div>
                    <h1 class="text-2xl font-extrabold text-slate-800">Giỏ hàng của bạn</h1>
                    <span v-if="cartItems.length > 0" class="bg-orange-100 text-orange-600 font-black text-xs px-2.5 py-1 rounded-full">{{ cartItems.length }} sản phẩm</span>
                </div>

                <div v-if="cartItems.length > 0" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Items List -->
                    <div class="lg:col-span-2 space-y-3">
                        <div v-for="(item, index) in cartItems" 
                            :key="item.product._id + '-' + (item.variant_id || '')" 
                            class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start hover:shadow-md transition-shadow">
                            <!-- Product Image (always shows correct variant snapshot) -->
                            <div class="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                <img 
                                    :src="getItemImage(item)" 
                                    :alt="item.product.title"
                                    class="w-full h-full object-contain"
                                    referrerpolicy="no-referrer"
                                    @error="(e) => e.target.src = `/images/product-missing.svg`"
                                />
                            </div>

                            <div class="flex-grow min-w-0">
                                <h3 class="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{{ item.product.title }}</h3>
                                
                                <!-- Variant badge -->
                                <div v-if="getVariantLabel(item)" class="mt-1.5">
                                    <span class="text-xs text-orange-600 font-semibold bg-orange-50 border border-orange-100 rounded-lg px-2 py-0.5 inline-flex items-center gap-1">
                                        📦 {{ getVariantLabel(item) }}
                                    </span>
                                </div>

                                <p class="text-xs text-slate-400 mt-1">{{ item.product.brand_id?.name || '' }}</p>

                                <!-- Prescription warning -->
                                <p v-if="item.product.prescription_required" class="text-xs text-red-500 font-bold mt-1">💊 Thuốc kê đơn — Cần chỉ định bác sĩ</p>

                                <!-- Price + Qty row -->
                                <div class="mt-3 flex items-center justify-between gap-4">
                                    <div class="flex items-center border border-slate-200 rounded-xl overflow-hidden h-9 w-28 bg-slate-50">
                                        <button @click="updateQuantity(index, -1)" class="w-9 h-full text-base font-bold text-slate-600 hover:bg-slate-200 transition flex items-center justify-center">−</button>
                                        <span class="flex-1 text-center font-bold text-slate-800 text-sm">{{ item.quantity }}</span>
                                        <button @click="updateQuantity(index, 1)" class="w-9 h-full text-base font-bold text-slate-600 hover:bg-slate-200 transition flex items-center justify-center">+</button>
                                    </div>
                                    <span class="font-extrabold text-red-600 text-sm">{{ formatPrice(getItemPrice(item) * item.quantity) }}</span>
                                </div>
                            </div>

                            <button @click="removeFromCart(index)" class="flex-shrink-0 w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition group mt-1">
                                <svg class="w-4 h-4 text-slate-300 group-hover:text-red-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit sticky top-4">
                        <h3 class="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                            <span class="w-1 h-5 bg-orange-500 rounded-full"></span>
                            Tóm tắt đơn hàng
                        </h3>
                        <div class="space-y-3 text-sm mb-5">
                            <div class="flex justify-between text-slate-500">
                                <span>Tạm tính ({{ cartItems.length }} sản phẩm)</span>
                                <span>{{ formatPrice(totalPrice) }}</span>
                            </div>
                            <div class="flex justify-between text-slate-500">
                                <span>Vận chuyển</span>
                                <span class="text-emerald-600 font-bold">Miễn phí</span>
                            </div>
                            <div class="border-t border-slate-100 pt-3 flex justify-between font-extrabold text-base text-slate-800">
                                <span>Tổng cộng</span>
                                <span class="text-red-600">{{ formatPrice(totalPrice) }}</span>
                            </div>
                        </div>
                        <button @click="checkout" class="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-lg shadow-orange-500/30 transition">
                            Tiến Hành Đặt Hàng →
                        </button>
                        <RouterLink to="/products" class="block text-center text-xs text-slate-400 hover:text-orange-500 transition font-semibold mt-3">
                            ← Tiếp tục mua sắm
                        </RouterLink>
                    </div>
                </div>

                <!-- Empty cart -->
                <div v-else class="text-center py-28 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div class="text-7xl mb-6">🛒</div>
                    <h2 class="text-2xl font-extrabold text-slate-400">Giỏ hàng trống</h2>
                    <p class="text-slate-400 mt-2 mb-8 text-sm">Hãy khám phá các sản phẩm da liễu chất lượng cao</p>
                    <RouterLink to="/products" class="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold px-10 py-3 rounded-xl shadow-lg shadow-orange-500/30 text-sm hover:from-orange-600 hover:to-red-600 transition">
                        Xem sản phẩm
                    </RouterLink>
                </div>
            </div>
        </main>

        <Footer />
    </div>
</template>
