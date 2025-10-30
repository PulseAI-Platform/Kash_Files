<template>
  <div class="kash-layout">
    <div class="header">
      <div class="header-content">
        <div class="header-left">
          <NuxtLink to="/" class="logo">
            <img src="/icon.png" alt="Kash Files" />
          </NuxtLink>
          <div class="brand">
            <h1>Kash Files</h1>
            <p>Secure file storage system</p>
          </div>
        </div>
        
        <!-- Only show nav when actually authenticated -->
        <nav v-if="isAuthenticated" class="nav">
          <NuxtLink to="/files" class="nav-link" :class="{ active: $route.path === '/files' }">Files</NuxtLink>
          <NuxtLink to="/keys" class="nav-link" :class="{ active: $route.path === '/keys' }">Keys</NuxtLink>
          <NuxtLink to="/setup" class="nav-link" :class="{ active: $route.path === '/setup' }">Setup</NuxtLink>
          <NuxtLink to="/emergency" class="nav-link" :class="{ active: $route.path === '/emergency' }">Emergency</NuxtLink>
          <button @click="logout" class="logout-btn">Logout</button>
        </nav>
      </div>
    </div>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
const isAuthenticated = ref(false)

// Check auth on mount AND on every route change
onMounted(checkAuth)
watch(() => useRoute().path, checkAuth)

async function checkAuth() {
  try {
    const response = await $fetch('/api/auth/check')
    isAuthenticated.value = response && response.authenticated === true
  } catch (error) {
    isAuthenticated.value = false
  }
}

async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    isAuthenticated.value = false
    await navigateTo('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<style scoped>
.kash-layout {
  min-height: 100vh;
  background-color: #0B0E14;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.header {
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  background-color: rgba(15, 18, 24, 0.5);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 1rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (min-width: 640px) {
  .header-content {
    padding: 0 1.25rem;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.logo:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.375rem;
}

.brand h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #e5e7eb;
  letter-spacing: -0.025em;
  margin: 0;
  line-height: 1.2;
}

.brand p {
  color: #9ca3af;
  font-size: 0.75rem;
  margin: 0;
  line-height: 1.2;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 640px) {
  .nav {
    gap: 0.75rem;
  }
  
  .brand p {
    display: none;
  }
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
  position: relative;
}

.nav-link:hover {
  color: #e5e7eb;
  background-color: rgba(148, 163, 184, 0.05);
}

.nav-link.active {
  color: #2563eb;
  background-color: rgba(37, 99, 235, 0.1);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0.75rem;
  right: 0.75rem;
  height: 2px;
  background-color: currentColor;
  border-radius: 1px;
  opacity: 0;
  transform: scaleX(0);
  transition: all 0.2s;
}

.nav-link.active::after {
  opacity: 1;
  transform: scaleX(1);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  color: #e5e7eb;
  background-color: rgba(148, 163, 184, 0.05);
}

.main-content {
  flex: 1;
}
</style>