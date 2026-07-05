<template>
  <footer class="ts-footer">
    <div class="ts-footer-inner">
      <div class="ts-footer-brand">
        <span class="brand-wordmark ts-footer-logo">Testskin</span>
        <p class="ts-footer-slogan">Giải pháp khoa học cho làn da của bạn</p>
      </div>
      
      <div class="ts-footer-divider"></div>
      
      <div class="ts-footer-bottom">
        <p class="ts-copyright">Copyright © {{ new Date().getFullYear() }} Testskin. All rights reserved.</p>
        <div class="ts-social-links">
          <a href="#" aria-label="Facebook">FB</a>
          <a href="#" aria-label="Instagram">IG</a>
          <a href="#" aria-label="TikTok">TK</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.ts-footer {
  background: oklch(22% 0.05 310deg); /* Deep plum */
  color: oklch(90% 0.015 40deg);
  padding: 4rem 1.5rem 2rem;
  border-top: 1px solid rgba(196, 149, 106, 0.3);
}

.ts-footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ts-footer-brand {
  text-align: center;
  margin-bottom: 2rem;
}

.ts-footer-logo {
  font-size: 2.5rem;
  background: linear-gradient(135deg, oklch(85% 0.08 30deg), oklch(72% 0.12 45deg));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.ts-footer-slogan {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: oklch(75% 0.04 310deg);
  margin-top: 0.5rem;
}

.ts-footer-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(196, 149, 106, 0.2), transparent);
  margin: 2rem 0;
}

.ts-footer-bottom {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.ts-copyright {
  font-size: 0.8rem;
  color: oklch(60% 0.03 310deg);
}

.ts-social-links {
  display: flex;
  gap: 1.5rem;
}

.ts-social-links a {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.9rem;
  color: oklch(75% 0.04 310deg);
  text-decoration: none;
  transition: color 0.3s ease;
}

.ts-social-links a:hover {
  color: oklch(72% 0.12 45deg); /* Rose gold */
}

@media (max-width: 768px) {
  .ts-footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>