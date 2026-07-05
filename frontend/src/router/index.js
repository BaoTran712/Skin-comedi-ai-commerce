import { createRouter, createWebHistory } from "vue-router";
import { isAuthenticated } from "../services/auth.service";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/Home.vue")
  },
  {
    path: "/user/login",
    name: "user.login",
    component: () => import("../views/UserLogin.vue")
  },
  {
    path: "/staff/login",
    name: "staff.login",
    component: () => import("../views/StaffLogin.vue")
  },
  {
    path: "/user/register",
    name: "user.register",
    component: () => import("../views/UserRegister.vue")
  },
  {
    path: "/auth/callback",
    name: "auth.callback",
    component: () => import("../views/AuthCallback.vue")
  },
  {
    path: "/payment/result",
    name: "payment.result",
    component: () => import("../views/PaymentResult.vue")
  },
  {
    path: "/userprofile",
    name: "userprofile",
    component: () => import("../views/UserProfile.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/user/add",
    name: "user.add",
    component: () => import("../views/UserAdd.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/userprofile/edit/:id",
    name: "userprofile.edit",
    component: () => import("../views/UserProfileEdit.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/products",
    name: "product.list",
    component: () => import("../views/ProductList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/users",
    name: "user.list",
    component: () => import("../views/UserList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/product/add",
    name: "product.add",
    component: () => import("../views/ProductAdd.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/product/edit/:id",
    name: "product.edit",
    component: () => import("../views/ProductEdit.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/order/add/:id",
    name: "order.add",
    component: () => import("../views/OrderAdd.vue"),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/order/edit/:id",
    name: "order.edit",
    component: () => (import("../views/OrderEdit.vue")),
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: "/staffs",
    name: "staff.list",
    component: () => import("../views/StaffList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/staffprofile",
    name: "staff.profile",
    component: () => import("../views/StaffProfile.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/staff/add",
    name: "staff.add",
    component: () => import("../views/StaffAdd.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/staff/edit/:id",
    name: "staffprofile.edit",
    component: () => import("../views/StaffProfileEdit.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/brands",
    name: "brand.list",
    component: () => import("../views/BrandList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/brand/add",
    name: "brand.add",
    component: () => import("../views/BrandAdd.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/brand/edit/:id",
    name: "brand.edit",
    component: () => import("../views/BrandEdit.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/orderpending",
    name: "order.pending",
    component: () => import("../views/OrderPending.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/ordercheck",
    name: "order.check",
    component: () => import("../views/OrderCheck.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/cart/checkout",
    name: "cart.checkout",
    component: () => import("../views/CartCheckout.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/diagnosis",
    name: "diagnosis",
    component: () => import("../views/Diagnosis.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard",
    name: "admin.dashboard",
    component: () => import("../views/AdminDashboard.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/cart",
    name: "cart",
    component: () => import("../views/Cart.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: "notfound",
    component: () => import("../views/NotFound.vue")
  },
  {
    path: "/ingredients",
    name: "ingredient.list",
    component: () => import("../views/IngredientList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/ingredient/add",
    name: "ingredient.add",
    component: () => import("../views/IngredientAdd.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/ingredient/edit/:id",
    name: "ingredient.edit",
    component: () => import("../views/IngredientEdit.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/banners",
    name: "banner.list",
    component: () => import("../views/BannerList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/banner/add",
    name: "banner.add",
    component: () => import("../views/BannerAdd.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/banner/edit/:id",
    name: "banner.edit",
    component: () => import("../views/BannerEdit.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/promotions",
    name: "promotion.list",
    component: () => import("../views/PromotionList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/promotion/add",
    name: "promotion.add",
    component: () => import("../views/PromotionAdd.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/promotion/edit/:id",
    name: "promotion.edit",
    component: () => import("../views/PromotionEdit.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/contacts",
    name: "contact.list",
    component: () => import("../views/ContactList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/contact/detail/:id",
    name: "contact.detail",
    component: () => import("../views/ContactDetail.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/reviews",
    name: "review.list",
    component: () => import("../views/ReviewList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/topics",
    name: "topic.list",
    component: () => import("../views/TopicList.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/topic/add",
    name: "topic.add",
    component: () => import("../views/TopicAdd.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/topic/edit/:id",
    name: "topic.edit",
    component: () => import("../views/TopicEdit.vue"),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: "/settings",
    name: "system.settings",
    component: () => import("../views/SystemSettings.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/activity-log",
    name: "activity.log",
    component: () => import("../views/ActivityLog.vue"),
    meta: { requiresAuth: true },
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard: chặn truy cập trang cần đăng nhập
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next("/user/login");
  } else {
    next();
  }
});

export default router;
