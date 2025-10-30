<template>
  <div class="kash-login">

    <!-- Main Content -->
    <div class="main-content">
      <div class="login-container">
        <div class="login-card">
          <div class="card-header">
            <h2>Welcome Back</h2>
            <p>Enter your master key to continue</p>
          </div>

          <form @submit.prevent="login" class="login-form">
            <div class="input-group">
              <label>Master Key</label>
              <input
                v-model="masterKey"
                type="password"
                placeholder="Enter your master key"
                :disabled="loggingIn"
                ref="masterKeyInput"
                autocomplete="current-password"
              />
            </div>

            <button
              type="submit"
              :disabled="loggingIn || !masterKey"
              class="btn btn-primary"
            >
              <span v-if="loggingIn" class="btn-loading">
                <div class="btn-spinner"></div>
                <span>Logging in...</span>
              </span>
              <span v-else>Login</span>
            </button>
          </form>

          <div class="card-footer">
            <p class="help-text">
              Need to set up a new system? 
              <NuxtLink to="/setup" class="setup-link">Go to Setup</NuxtLink>
            </p>
          </div>

          <!-- Messages -->
          <div v-if="error" class="message error">
            {{ error }}
          </div>
          <div v-if="successMessage" class="message success">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const loggingIn = ref(false)
const error = ref('')
const successMessage = ref('')
const masterKey = ref('')
const masterKeyInput = ref(null)

onMounted(() => {
  // Auto-focus the input
  nextTick(() => {
    masterKeyInput.value?.focus()
  })
})

watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      error.value = ''
    }, 5000)
  }
})

watch(successMessage, (newMessage) => {
  if (newMessage) {
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  }
})

async function login() {
  try {
    loggingIn.value = true
    error.value = ''
    
    await $fetch('/api/auth/unlock', {
      method: 'POST',
      body: { masterKey: masterKey.value }
    })
    
    successMessage.value = 'Login successful!'
    
    setTimeout(() => {
      navigateTo('/files')
    }, 1000)
    
  } catch (err) {
    error.value = err.data?.message || 'Invalid master key'
    masterKey.value = ''
    nextTick(() => {
      masterKeyInput.value?.focus()
    })
  } finally {
    loggingIn.value = false
  }
}

useHead({
  title: 'Login - Kash Files',
  meta: [
    { name: 'description', content: 'Login to your Kash Files' }
  ]
})
</script>

<style scoped>
.kash-login {
  min-height: 100vh;
  background-color: #0B0E14;
  display: flex;
  flex-direction: column;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.header {
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  background-color: rgba(15, 18, 24, 0.5);
  backdrop-filter: blur(8px);
}

.header-content {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-left {
  height: 4rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background-color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo span {
  color: white;
  font-weight: bold;
  font-size: 0.875rem;
}

.header-left h1 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #e5e7eb;
  letter-spacing: -0.025em;
  margin: 0;
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 24rem;
}

.login-card {
  background-color: #0F1218;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0 0 0.5rem 0;
}

.card-header p {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}

.login-form {
  margin-bottom: 1.5rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  color: #e5e7eb;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  background-color: #0B1220;
  border: 1px solid #27272a;
  border-radius: 0.375rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.input-group input::placeholder {
  color: #9ca3af;
}

.input-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.card-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #27272a;
}

.help-text {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}

.setup-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.setup-link:hover {
  color: #1d4ed8;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.message.error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.message.success {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
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