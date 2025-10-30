<template>
  <div class="kash-setup">

    <!-- Main Content -->
    <div class="main-content">
      <div class="setup-container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Checking setup status...</p>
        </div>

        <!-- Setup Card -->
        <div v-else class="setup-card">
          <!-- Initial Setup -->
          <div v-if="!setupStatus.masterKeyExists && !setupStatus.webauthnExists">
            <div class="card-header">
              <h2>Welcome to Kash Files</h2>
              <p>Set up your security to get started</p>
            </div>

            <div class="form-section">
              <!-- Master Key Setup -->
              <form @submit.prevent="setupMasterKey" class="master-key-form">
                <div class="input-group">
                  <label>Master Key</label>
                  <input
                    v-model="newMasterKey"
                    type="password"
                    placeholder="Enter a strong master key"
                    :disabled="settingUp"
                  />
                  <p class="input-help">Minimum 12 characters. This cannot be recovered if lost.</p>
                </div>

                <button
                  type="submit"
                  :disabled="settingUp || newMasterKey.length < 12"
                  class="btn btn-primary"
                >
                  <span v-if="settingUp" class="btn-loading">
                    <div class="btn-spinner"></div>
                    <span>Setting up...</span>
                  </span>
                  <span v-else>Create Master Key</span>
                </button>
              </form>

              <div class="divider">
                <span>or</span>
              </div>

              <!-- WebAuthn Setup -->
              <button
                @click="setupWebAuthn"
                :disabled="settingUp"
                class="btn btn-secondary"
              >
                Set up WebAuthn
              </button>
            </div>
          </div>

          <!-- Unlock -->
          <div v-else>
            <div class="card-header">
              <h2>Unlock Kash Files</h2>
              <p>Enter your master key to continue</p>
              <div v-if="setupStatus.masterInfo" class="setup-info">
                Set up {{ new Date(setupStatus.masterInfo.setAt).toLocaleDateString() }}
              </div>
            </div>

            <form @submit.prevent="unlockWithMaster" class="unlock-form">
              <div class="input-group">
                <label>Master Key</label>
                <input
                  v-model="unlockKey"
                  type="password"
                  placeholder="Enter your master key"
                  :disabled="unlocking"
                  ref="unlockInput"
                />
              </div>

              <button
                type="submit"
                :disabled="unlocking || !unlockKey"
                class="btn btn-primary"
              >
                <span v-if="unlocking" class="btn-loading">
                  <div class="btn-spinner"></div>
                  <span>Unlocking...</span>
                </span>
                <span v-else>Unlock</span>
              </button>
            </form>

            <div class="card-footer">
              <button @click="resetSetup" class="reset-link">
                Reset setup
              </button>
            </div>
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
const loading = ref(true)
const settingUp = ref(false)
const unlocking = ref(false)
const error = ref('')
const successMessage = ref('')

const newMasterKey = ref('')
const unlockKey = ref('')

const setupStatus = ref({
  masterKeyExists: false,
  webauthnExists: false,
  masterInfo: null
})

const unlockInput = ref(null)

onMounted(async () => {
  await checkSetupStatus()
  
  if (setupStatus.value.masterKeyExists || setupStatus.value.webauthnExists) {
    nextTick(() => {
      unlockInput.value?.focus()
    })
  }
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

async function checkSetupStatus() {
  try {
    loading.value = true
    const data = await $fetch('/api/setup/status')
    setupStatus.value = data
  } catch (err) {
    error.value = 'Failed to check setup status'
  } finally {
    loading.value = false
  }
}

async function setupMasterKey() {
  if (newMasterKey.value.length < 12) {
    error.value = 'Master key must be at least 12 characters'
    return
  }

  try {
    settingUp.value = true
    error.value = ''
    
    await $fetch('/api/setup/master', {
      method: 'POST',
      body: { master: newMasterKey.value }
    })
    
    successMessage.value = 'Master key created successfully!'
    
    setTimeout(() => {
      navigateTo('/files')
    }, 1500)
    
  } catch (err) {
    error.value = err.data?.message || 'Failed to set up master key'
  } finally {
    settingUp.value = false
  }
}

async function setupWebAuthn() {
  error.value = 'WebAuthn setup not implemented yet'
}

async function unlockWithMaster() {
  try {
    unlocking.value = true
    error.value = ''
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    successMessage.value = 'Successfully unlocked!'
    
    setTimeout(() => {
      navigateTo('/files')
    }, 1000)
    
  } catch (err) {
    error.value = 'Invalid master key'
  } finally {
    unlocking.value = false
  }
}

async function resetSetup() {
  const confirmed = confirm('Are you sure you want to reset? This will require re-entering your current master key.')
  if (confirmed) {
    error.value = 'Reset not implemented yet'
  }
}

useHead({
  title: 'Setup - Kash Files',
  meta: [
    { name: 'description', content: 'Set up your Kash Files security' }
  ]
})
</script>

<style scoped>
.kash-setup {
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

.setup-container {
  width: 100%;
  max-width: 28rem;
}

.loading-state {
  text-align: center;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #3f3f46;
  border-top-color: #67e8f9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-state p {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}

.setup-card {
  background-color: #0F1218;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.card-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0 0 0.5rem 0;
}

.card-header p {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}

.setup-info {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #0B1220;
  color: #9ca3af;
  border: 1px solid #27272a;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  color: #e5e7eb;
  font-size: 0.875rem;
  font-weight: 500;
}

.input-group input {
  width: 100%;
  padding: 0.5rem 0.75rem;
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

.input-help {
  color: #9ca3af;
  font-size: 0.75rem;
  margin: 0;
}

.btn {
  width: 100%;
  padding: 0.5rem 1rem;
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

.btn-secondary {
  background-color: #0B1220;
  color: #e5e7eb;
  border: 1px solid #27272a;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #131821;
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

.divider {
  position: relative;
  text-align: center;
  margin: 1rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #27272a;
}

.divider span {
  background-color: #0F1218;
  padding: 0 0.5rem;
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
  position: relative;
}

.card-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #27272a;
}

.reset-link {
  color: #94a3b8;
  font-size: 0.75rem;
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.reset-link:hover {
  color: #e5e7eb;
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

@media (max-width: 640px) {
  .header-content {
    padding: 0 1rem;
  }
  
  .setup-card {
    padding: 1rem;
  }
}
</style>