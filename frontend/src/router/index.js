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
    path: "/payment/qr",
    name: "payment.qr",
    component: () => import("../views/BankQRPayment.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF", "CUSTOMER"] },
  },

  {
    path: "/userprofile",
    name: "userprofile",
    component: () => import("../views/UserProfile.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF", "CUSTOMER"] },
  },
  {
    path: "/user/add",
    name: "user.add",
    component: () => import("../views/UserAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] }
  },
  {
    path: "/userprofile/edit/:id",
    name: "userprofile.edit",
    component: () => import("../views/UserProfileEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF", "CUSTOMER"] },
    props: true
  },
  {
    path: "/products",
    name: "product.list",
    component: () => import("../views/ProductList.vue")
  },
  {
    path: "/product/:id",
    name: "product.detail",
    component: () => import("../views/ProductDetail.vue"),
    props: true
  },
  {
    path: "/users",
    name: "user.list",
    component: () => import("../views/UserList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/product/add",
    name: "product.add",
    component: () => import("../views/ProductAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/product/edit/:id",
    name: "product.edit",
    component: () => import("../views/ProductEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/order/add/:id",
    name: "order.add",
    component: () => import("../views/OrderAdd.vue"),
    props: true,
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF", "CUSTOMER"] },
  },
  {
    path: "/order/edit/:id",
    name: "order.edit",
    component: () => (import("../views/OrderEdit.vue")),
    props: true,
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] }
  },
  {
    path: "/staffs",
    name: "staff.list",
    component: () => import("../views/StaffList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/staffprofile",
    name: "staff.profile",
    component: () => import("../views/StaffProfile.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/staff/add",
    name: "staff.add",
    component: () => import("../views/StaffAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/staff/edit/:id",
    name: "staffprofile.edit",
    component: () => import("../views/StaffProfileEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/brands",
    name: "brand.list",
    component: () => import("../views/BrandList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/brand/add",
    name: "brand.add",
    component: () => import("../views/BrandAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/brand/edit/:id",
    name: "brand.edit",
    component: () => import("../views/BrandEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/orderpending",
    name: "order.pending",
    component: () => import("../views/OrderPending.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/ordercheck",
    name: "order.check",
    component: () => import("../views/OrderCheck.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF", "CUSTOMER"] },
  },
  {
    path: "/cart/checkout",
    name: "cart.checkout",
    component: () => import("../views/CartCheckout.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF", "CUSTOMER"] },
  },
  {
    path: "/diagnosis",
    name: "diagnosis",
    component: () => import("../views/Diagnosis.vue"),
  },
  {
    path: "/dashboard",
    name: "admin.dashboard",
    component: () => import("../views/AdminDashboard.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/cart",
    name: "cart",
    component: () => import("../views/Cart.vue")
  },
  {
    path: "/ai-predict",
    name: "ai.predict",
    component: () => import("../views/SkinPredict.vue"),
  },
  {
    path: "/ingredients",
    name: "ingredient.list",
    component: () => import("../views/IngredientList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/ingredient/add",
    name: "ingredient.add",
    component: () => import("../views/IngredientAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/ingredient/edit/:id",
    name: "ingredient.edit",
    component: () => import("../views/IngredientEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/banners",
    name: "banners",
    component: () => import("../views/BannerList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] }
  },
  {
    path: "/posts",
    name: "posts",
    component: () => import("../views/PostList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/post/add",
    name: "post.add",
    component: () => import("../views/PostAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/post/edit/:id",
    name: "post.edit",
    component: () => import("../views/PostEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/blog",
    name: "blog",
    component: () => import("../views/Blog.vue"),
  },
  {
    path: "/banner/add",
    name: "banner.add",
    component: () => import("../views/BannerAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/banner/edit/:id",
    name: "banner.edit",
    component: () => import("../views/BannerEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/promotions",
    name: "promotions",
    component: () => import("../views/PromotionList.vue"),
  },
  {
    path: "/suppliers",
    name: "suppliers",
    component: () => import("../views/SupplierList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] }
  },
  {
    path: "/admin/points",
    name: "admin.points",
    component: () => import("../views/AdminPointsManagement.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] }
  },
  {
    path: "/imports",
    name: "imports",
    component: () => import("../views/ImportReceiptList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] }
  },
  {
    path: "/imports/add",
    name: "imports.add",
    component: () => import("../views/ImportReceiptAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] }
  },
  {
    path: "/promotion/add",
    name: "promotion.add",
    component: () => import("../views/PromotionAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/promotion/edit/:id",
    name: "promotion.edit",
    component: () => import("../views/PromotionEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/contacts",
    name: "contact.list",
    component: () => import("../views/ContactList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/contact/detail/:id",
    name: "contact.detail",
    component: () => import("../views/ContactDetail.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/reviews",
    name: "review.list",
    component: () => import("../views/ReviewList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/topics",
    name: "topic.list",
    component: () => import("../views/TopicList.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/topic/add",
    name: "topic.add",
    component: () => import("../views/TopicAdd.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
  },
  {
    path: "/topic/edit/:id",
    name: "topic.edit",
    component: () => import("../views/TopicEdit.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN", "STAFF"] },
    props: true
  },
  {
    path: "/settings",
    name: "system.settings",
    component: () => import("../views/SystemSettings.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/comment-settings",
    name: "comment.settings",
    component: () => import("../views/CommentSettings.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/activity-log",
    name: "activity.log",
    component: () => import("../views/ActivityLog.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: '/:pathMatch(.*)*',
    name: "notfound",
    component: () => import("../views/NotFound.vue")
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guard: Check authentication & role authorization
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return next({ path: "/user/login", query: { redirect: to.fullPath } });
  }

  const rawRole = localStorage.getItem("role") || "CUSTOMER";
  let normalizedRole = rawRole.toUpperCase();
  if (normalizedRole === "USER") normalizedRole = "CUSTOMER";
  if (normalizedRole === "EMPLOYEE") normalizedRole = "STAFF";

  if (to.meta.roles && !to.meta.roles.includes(normalizedRole)) {
    if (normalizedRole === "CUSTOMER") {
      return next("/");
    } else {
      return next("/dashboard");
    }
  }

  next();
});

export default router;
