<template>
  <div class="redirect-page">
    <div class="redirect-content">
      <div class="logo">
        <span>K</span>
      </div>
      <h1>Kash Files</h1>
      <p>{{ statusMessage }}</p>
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
const statusMessage = ref('Checking system status...')

onMounted(async () => {
  try {
    // Check if user is already authenticated
    statusMessage.value = 'Checking authentication...'
    
    try {
      await $fetch('/api/auth/check')
      // User is logged in, go to files
      statusMessage.value = 'Welcome back! Redirecting to your files...'
      setTimeout(() => navigateTo('/files'), 800)
      return
    } catch {
      // Not authenticated, continue to check setup status
    }

    // Check setup status
    statusMessage.value = 'Checking setup status...'
    const setupStatus = await $fetch('/api/setup/status')
    
    if (!setupStatus.masterKeyExists && !setupStatus.webauthnExists) {
      // System not set up, go to setup
      statusMessage.value = 'First time setup required...'
      setTimeout(() => navigateTo('/setup'), 800)
    } else {
      // System is set up but user not logged in, go to login
      statusMessage.value = 'Please login to continue...'
      setTimeout(() => navigateTo('/login'), 800)
    }
    
  } catch (error) {
    statusMessage.value = 'System error - redirecting to setup...'
    console.error('Index routing error:', error)
    // Fallback to setup if we can't determine system state
    setTimeout(() => navigateTo('/setup'), 2000)
  }
})

// Meta
useHead({
  title: 'Kash Files',
  meta: [
    { name: 'description', content: 'Secure file storage system' }
  ]
})
</script>

<style scoped>
.redirect-page {
  min-height: 100vh;
  background-color: #0B0E14;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.redirect-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 24rem;
  padding: 2rem;
}

.logo {
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
}

.logo span {
  color: white;
  font-weight: bold;
  font-size: 1.75rem;
}

.redirect-content h1 {
  color: #e5e7eb;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.025em;
}

.redirect-content p {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
  min-height: 1.25rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #3f3f46;
  border-top-color: #67e8f9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>