<template>
  <!-- Loading state during auth check -->
  <div v-if="authLoading" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <p class="text-gray-500">Checking authentication...</p>
  </div>
  
  <!-- Redirect state -->
  <div v-else-if="!authenticated" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <p class="text-gray-500">Redirecting to login...</p>
  </div>
  
  <!-- Main content - only show when authenticated -->
  <div v-else class="keys-page">
    <!-- Create Key Section -->
    <div class="create-section">
      <div class="card">
        <h2 class="section-title">Create New API Key</h2>
        
        <form @submit.prevent="createKey" class="create-form">
          <div class="form-grid">
            <div class="input-group">
              <label>Key Name (Optional)</label>
              <input
                v-model="newKey.name"
                type="text"
                placeholder="e.g., Mobile App, Desktop Client"
                :disabled="creating"
              />
            </div>
            
            <div class="input-group">
              <label>Expires (Optional)</label>
              <input
                v-model="newKey.expires"
                type="date"
                :disabled="creating"
              />
            </div>
          </div>
          
          <button
            type="submit"
            :disabled="creating"
            class="btn btn-primary"
          >
            <span v-if="creating" class="btn-loading">
              <div class="btn-spinner"></div>
              <span>Creating...</span>
            </span>
            <span v-else>Create Key</span>
          </button>
        </form>
      </div>
    </div>

    <!-- New Key Display with QR Code -->
    <div v-if="createdKey" class="success-section">
      <div class="success-card">
        <div class="success-header">
          <div class="success-icon">
            <svg class="check-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <h3>Key Created Successfully</h3>
        </div>
        
        <p class="success-text">Copy this key now - it won't be shown again:</p>
        
        <div class="key-display">
          <span class="key-text">{{ createdKey.key }}</span>
          <button
            @click="copyToClipboard(createdKey.key)"
            class="copy-btn"
            title="Copy to clipboard"
          >
            <svg class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        
        <!-- Mobile App Configuration Section -->
        <div class="mobile-config-section">
          <div class="config-divider"></div>
          
          <h4 class="config-title">Add to Mobile Apps</h4>
          <p class="config-subtitle">Use this configuration to add this Kash Files instance to your mobile or desktop apps</p>
          
          <!-- Tab selector -->
          <div class="config-tabs">
            <button
              @click="configDisplayMode = 'qr'"
              :class="['config-tab', { active: configDisplayMode === 'qr' }]"
            >
              📱 Mobile (QR Code)
            </button>
            <button
              @click="configDisplayMode = 'json'"
              :class="['config-tab', { active: configDisplayMode === 'json' }]"
            >
              💻 Desktop (JSON)
            </button>
          </div>
          
          <!-- QR Code Display -->
          <div v-if="configDisplayMode === 'qr'" class="qr-section">
            <div class="qr-container">
              <canvas ref="filesQrContainer"></canvas>
            </div>
            <div class="qr-instructions">
              <p class="instruction-title">Instructions:</p>
              <ol class="instruction-list">
                <li>Open Kash Stash app on your phone</li>
                <li>Go to Settings → File Storage</li>
                <li>Tap "Add Files Instance"</li>
                <li>Scan this QR code</li>
              </ol>
            </div>
          </div>
          
          <!-- JSON Config Display -->
          <div v-if="configDisplayMode === 'json'" class="json-section">
            <div class="config-json-container">
              <pre class="config-json">{{ formattedFilesConfig }}</pre>
              <button 
                @click="copyFilesConfig" 
                class="copy-config-btn"
                :class="{ copied: copiedConfig }"
              >
                <svg v-if="!copiedConfig" class="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <svg v-else class="check-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>{{ copiedConfig ? 'Copied!' : 'Copy' }}</span>
              </button>
            </div>
            <div class="json-instructions">
              <p class="instruction-title">Instructions:</p>
              <ol class="instruction-list">
                <li>Copy the configuration above</li>
                <li>Open Kash Stash desktop app</li>
                <li>Go to Settings → File Storage</li>
                <li>Click "Add from JSON" and paste</li>
              </ol>
            </div>
          </div>
        </div>
        
        <button @click="dismissCreatedKey" class="dismiss-btn">
          Done
        </button>
      </div>
    </div>

    <!-- Keys List -->
    <div class="keys-section">
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">API Keys</h2>
          <button
            @click="loadKeys"
            :disabled="loading"
            class="refresh-btn"
            title="Refresh"
          >
            <svg class="refresh-icon" :class="{ spinning: loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div v-if="loading && keys.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Loading keys...</p>
        </div>

        <div v-else-if="keys.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3>No API Keys</h3>
          <p>Create your first API key to start uploading files.</p>
        </div>

        <div v-else class="keys-list">
          <div
            v-for="key in keys"
            :key="key.key"
            class="key-item"
          >
            <div class="key-content">
              <div class="key-header">
                <h3 class="key-name">{{ key.name || 'Unnamed Key' }}</h3>
                
                <span
                  class="status-badge"
                  :class="{
                    revoked: key.revoked,
                    expired: isExpired(key.expires),
                    active: !key.revoked && !isExpired(key.expires)
                  }"
                >
                  <span v-if="key.revoked">Revoked</span>
                  <span v-else-if="isExpired(key.expires)">Expired</span>
                  <span v-else>Active</span>
                </span>
              </div>
              
              <div class="key-meta">
                <div class="key-dates">
                  <span>Created: {{ formatDate(key.created) }}</span>
                  <span v-if="key.expires">Expires: {{ formatDate(key.expires) }}</span>
                  <span v-if="key.revokedAt">Revoked: {{ formatDate(key.revokedAt) }}</span>
                </div>
                
                <div class="key-display-compact">
                  {{ key.key.substring(0, 8) }}...{{ key.key.substring(key.key.length - 8) }}
                  <button
                    @click="copyToClipboard(key.key)"
                    class="copy-btn-small"
                    title="Copy full key"
                  >
                    <svg class="copy-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="key-actions">
              <button
                v-if="!key.revoked && !isExpired(key.expires)"
                @click="revokeKey(key.key)"
                :disabled="revokingKeys.has(key.key)"
                class="revoke-btn"
              >
                <span v-if="revokingKeys.has(key.key)">Revoking...</span>
                <span v-else>Revoke</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="error" class="message error">
      {{ error }}
    </div>

    <div v-if="successMessage" class="toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'

// Auth state
const authLoading = ref(true)
const authenticated = ref(false)

// State
const loading = ref(false)
const creating = ref(false)
const error = ref('')
const successMessage = ref('')
const createdKey = ref(null)
const revokingKeys = ref(new Set())

// Mobile config state
const filesQrContainer = ref(null)
const copiedConfig = ref(false)
const configDisplayMode = ref('qr') // 'qr' or 'json'

// Form data
const newKey = ref({
  name: '',
  expires: ''
})

// Keys list
const keys = ref([])

// Computed for formatted config
const formattedFilesConfig = computed(() => {
  if (!createdKey.value) return ''
  
  const filesConfig = {
    type: 'kashFiles',
    name: createdKey.value.name || `Kash Files - ${new Date().toISOString().split('T')[0]}`,
    url: window.location.origin,
    key: createdKey.value.key
  }
  
  return JSON.stringify(filesConfig, null, 2)
})

// Auth check - move to onMounted
onMounted(async () => {
  try {
    const authCheck = await $fetch('/api/auth/check')
    if (!authCheck.authenticated) {
      await navigateTo('/login')
      return
    }
    authenticated.value = true
    // Load keys after auth succeeds
    await loadKeys()
  } catch (error) {
    console.error('Auth check failed:', error)
    await navigateTo('/login')
  } finally {
    authLoading.value = false
  }
})

// Generate QR code when key is created
watch(createdKey, async (newKey) => {
  if (newKey) {
    await nextTick()
    await generateFilesQRCode()
  }
})

// Regenerate QR when switching to QR tab
watch(configDisplayMode, async (mode) => {
  if (mode === 'qr' && createdKey.value) {
    await nextTick()
    await generateFilesQRCode()
  }
})

// Auto-clear messages
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

// Generate QR code for files config
async function generateFilesQRCode() {
  if (!filesQrContainer.value || !createdKey.value) return
  
  const filesConfig = {
    type: 'kashFiles',
    name: createdKey.value.name || `Kash Files - ${new Date().toISOString().split('T')[0]}`,
    url: window.location.origin,
    key: createdKey.value.key
  }
  
  try {
    await QRCode.toCanvas(
      filesQrContainer.value,
      JSON.stringify(filesConfig),
      {
        width: 200,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      }
    )
  } catch (error) {
    console.error('Failed to generate QR code:', error)
  }
}

// Copy files config
function copyFilesConfig() {
  navigator.clipboard.writeText(formattedFilesConfig.value)
  copiedConfig.value = true
  setTimeout(() => copiedConfig.value = false, 2000)
}

// Dismiss created key
function dismissCreatedKey() {
  createdKey.value = null
  copiedConfig.value = false
  configDisplayMode.value = 'qr'
}

// Load all keys
async function loadKeys() {
  try {
    loading.value = true
    error.value = ''
    
    const response = await $fetch('/api/keys/list')
    keys.value = response
  } catch (err) {
    error.value = err.data?.message || 'Failed to load keys'
  } finally {
    loading.value = false
  }
}

// Create new API key
async function createKey() {
  try {
    creating.value = true
    error.value = ''
    
    const payload = {
      name: newKey.value.name || null,
      expires: newKey.value.expires || null
    }
    
    const response = await $fetch('/api/keys/create', {
      method: 'POST',
      body: payload
    })
    
    createdKey.value = response
    newKey.value = { name: '', expires: '' }
    await loadKeys()
    
  } catch (err) {
    error.value = err.data?.message || 'Failed to create key'
  } finally {
    creating.value = false
  }
}

// Revoke API key
async function revokeKey(keyToRevoke) {
  if (!confirm('Are you sure you want to revoke this key? This action cannot be undone.')) {
    return
  }
  
  try {
    revokingKeys.value.add(keyToRevoke)
    error.value = ''
    
    await $fetch('/api/keys/revoke', {
      method: 'POST',
      body: { key: keyToRevoke }
    })
    
    showSuccess('Key revoked successfully')
    await loadKeys()
    
  } catch (err) {
    error.value = err.data?.message || 'Failed to revoke key'
  } finally {
    revokingKeys.value.delete(keyToRevoke)
  }
}

// Utility functions
function isExpired(expiryDate) {
  if (!expiryDate) return false
  return new Date() > new Date(expiryDate)
}

function formatDate(dateString) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    showSuccess('Copied to clipboard')
  } catch (err) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    showSuccess('Copied to clipboard')
  }
}

function showSuccess(message) {
  successMessage.value = message
}

// Meta
useHead({
  title: 'API Keys - Kash Files',
  meta: [
    { name: 'description', content: 'Manage your Kash Files API keys' }
  ]
})
</script>

<style scoped>
.keys-page {
  max-width: 1152px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

@media (min-width: 640px) {
  .keys-page {
    padding: 2rem 1.25rem;
  }
}

.create-section,
.success-section,
.keys-section {
  margin-bottom: 2rem;
}

.card {
  background-color: #0F1218;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0 0 1rem 0;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
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

.btn {
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

.success-card {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.success-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.success-icon {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background-color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: white;
}

.success-header h3 {
  color: #10b981;
  font-weight: 600;
  margin: 0;
}

.success-text {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.key-display {
  background-color: #0B1220;
  border: 1px solid #27272a;
  border-radius: 0.375rem;
  padding: 1rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.key-text {
  color: #67e8f9;
  word-break: break-all;
  flex: 1;
}

.copy-btn {
  margin-left: 1rem;
  color: #94a3b8;
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.copy-btn:hover {
  color: #e5e7eb;
}

.copy-icon {
  width: 1rem;
  height: 1rem;
}

.dismiss-btn {
  color: #94a3b8;
  font-size: 0.875rem;
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.dismiss-btn:hover {
  color: #e5e7eb;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid #27272a;
  margin-bottom: 1.5rem;
}

.refresh-btn {
  color: #94a3b8;
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.refresh-btn:hover {
  color: #e5e7eb;
}

.refresh-icon {
  width: 1rem;
  height: 1rem;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.loading-state {
  text-align: center;
  padding: 2rem;
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

.empty-state {
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background-color: #0B1220;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.empty-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #9ca3af;
}

.empty-state h3 {
  color: #e5e7eb;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0;
}

.keys-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background-color: #27272a;
  border-radius: 0.375rem;
  overflow: hidden;
}

.key-item {
  background-color: #0F1218;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s;
}

.key-item:hover {
  background-color: #0B1220;
}

.key-content {
  flex: 1;
}

.key-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.key-name {
  color: #e5e7eb;
  font-weight: 500;
  margin: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.status-badge.active {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.status-badge.expired {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}

.status-badge.revoked {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.key-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.key-dates {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

@media (max-width: 640px) {
  .key-dates {
    flex-direction: column;
    gap: 0.25rem;
  }
}

.key-display-compact {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  color: #67e8f9;
  background-color: #0B1220;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid #27272a;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.copy-btn-small {
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.copy-btn-small:hover {
  color: #e5e7eb;
}

.copy-icon-small {
  width: 0.75rem;
  height: 0.75rem;
}

.key-actions {
  margin-left: 1rem;
}

.revoke-btn {
  color: #ef4444;
  background: none;
  border: none;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.revoke-btn:hover {
  color: #dc2626;
}

.revoke-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.message.error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.toast {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background-color: #10b981;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.mobile-config-section {
  margin-top: 2rem;
}

.config-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 1.5rem 0;
}

.config-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.config-subtitle {
  color: #6b7280;
  margin-bottom: 1rem;
}

.config-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.config-tab {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.config-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.qr-section,
.json-section {
  animation: fadeIn 0.2s ease-in;
}

.qr-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.config-json-container {
  position: relative;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.config-json {
  padding: 1rem;
  margin: 0;
  font-family: monospace;
  font-size: 0.875rem;
  color: #111827;
  overflow-x: auto;
}

.copy-config-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-config-btn:hover {
  background: #f3f4f6;
}

.copy-config-btn.copied {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.instruction-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.instruction-list {
  list-style: decimal;
  margin-left: 1.5rem;
  color: #6b7280;
}

.instruction-list li {
  margin-bottom: 0.25rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>