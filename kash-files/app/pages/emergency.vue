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
  <div v-else class="emergency-page">
    <!-- Warning Banner -->
    <div class="warning-banner">
      <div class="warning-content">
        <svg class="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div class="warning-text">
          <h2>⚠️ Critical Actions Zone</h2>
          <p>
            These actions are <strong>irreversible</strong> and will permanently delete your data.
            Use only in emergencies or when intentionally wiping your installation.
          </p>
        </div>
      </div>
    </div>

    <!-- System Status Overview -->
    <div class="status-section">
      <div class="card">
        <h3 class="section-title">Current System Status</h3>
        
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <span>Loading system status...</span>
        </div>
        
        <div v-else class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Files</span>
            <span class="stat-value">{{ systemStats.files || 0 }}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-label">API Keys</span>
            <span class="stat-value">{{ systemStats.keys || 0 }}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-label">Total Storage</span>
            <span class="stat-value">{{ formatFileSize(systemStats.totalSize || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Emergency Actions -->
    <div class="actions-section">
      <!-- Nuke All Files -->
      <div class="action-card danger">
        <div class="action-content">
          <div class="action-icon danger-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <div class="action-body">
            <h3 class="action-title danger-title">Delete All Files</h3>
            <p class="action-description">
              Permanently deletes all uploaded files and their download links. 
              This action cannot be undone and will break all existing sharing links.
            </p>
            
            <div v-if="!fileNukeConfirm" class="action-initial">
              <button
                @click="fileNukeConfirm = true"
                :disabled="nukingFiles"
                class="btn btn-danger-outline"
              >
                Delete All Files
              </button>
            </div>
            
            <div v-else class="action-confirm">
              <div class="confirm-box danger-confirm">
                <p class="confirm-warning">
                  ⚠️ This will delete {{ systemStats.files || 0 }} files totaling {{ formatFileSize(systemStats.totalSize || 0) }}
                </p>
                
                <div class="input-group">
                  <label>Type "DELETE ALL FILES" to confirm:</label>
                  <input
                    v-model="fileNukeText"
                    type="text"
                    placeholder="DELETE ALL FILES"
                    :disabled="nukingFiles"
                    class="confirm-input"
                  />
                </div>
                
                <div class="confirm-actions">
                  <button
                    @click="nukeAllFiles"
                    :disabled="nukingFiles || fileNukeText !== 'DELETE ALL FILES'"
                    class="btn btn-danger"
                  >
                    <span v-if="nukingFiles" class="btn-loading">
                      <div class="btn-spinner"></div>
                      <span>Deleting...</span>
                    </span>
                    <span v-else>⚠️ CONFIRM DELETE ALL</span>
                  </button>
                  
                  <button
                    @click="cancelFileNuke"
                    :disabled="nukingFiles"
                    class="btn btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Revoke All Keys -->
      <div class="action-card warning">
        <div class="action-content">
          <div class="action-icon warning-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          
          <div class="action-body">
            <h3 class="action-title warning-title">Revoke All API Keys</h3>
            <p class="action-description">
              Revokes all existing API keys, preventing any further uploads or management actions.
              You'll need to create new keys to continue using the system.
            </p>
            
            <div v-if="!keyRevokeConfirm" class="action-initial">
              <button
                @click="keyRevokeConfirm = true"
                :disabled="revokingKeys"
                class="btn btn-warning-outline"
              >
                Revoke All Keys
              </button>
            </div>
            
            <div v-else class="action-confirm">
              <div class="confirm-box warning-confirm">
                <p class="confirm-warning">
                  This will revoke {{ systemStats.keys || 0 }} active API keys
                </p>
                
                <div class="confirm-actions">
                  <button
                    @click="revokeAllKeys"
                    :disabled="revokingKeys"
                    class="btn btn-warning"
                  >
                    <span v-if="revokingKeys" class="btn-loading">
                      <div class="btn-spinner"></div>
                      <span>Revoking...</span>
                    </span>
                    <span v-else>Confirm Revoke All</span>
                  </button>
                  
                  <button
                    @click="cancelKeyRevoke"
                    :disabled="revokingKeys"
                    class="btn btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Nuclear Option -->
      <div class="action-card nuclear">
        <div class="action-content">
          <div class="action-icon nuclear-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div class="action-body">
            <h3 class="action-title nuclear-title">Complete System Reset</h3>
            <p class="action-description">
              Nuclear option: Deletes ALL data including files, keys, and system configuration.
              This will completely reset your Kash Files installation to a fresh state.
            </p>
            
            <div v-if="!nuclearConfirm" class="action-initial">
              <button
                @click="nuclearConfirm = true"
                :disabled="nukingEverything"
                class="btn btn-nuclear-outline"
              >
                🚨 Nuclear Reset
              </button>
            </div>
            
            <div v-else class="action-confirm">
              <div class="confirm-box nuclear-confirm">
                <p class="confirm-warning">
                  🚨 THIS WILL DELETE EVERYTHING: {{ systemStats.files || 0 }} files, {{ systemStats.keys || 0 }} keys, and all configuration
                </p>
                
                <div class="input-group">
                  <label>Type "NUCLEAR RESET" to confirm:</label>
                  <input
                    v-model="nuclearText"
                    type="text"
                    placeholder="NUCLEAR RESET"
                    :disabled="nukingEverything"
                    class="confirm-input"
                  />
                </div>
                
                <div class="confirm-actions">
                  <button
                    @click="nuclearReset"
                    :disabled="nukingEverything || nuclearText !== 'NUCLEAR RESET'"
                    class="btn btn-nuclear"
                  >
                    <span v-if="nukingEverything" class="btn-loading">
                      <div class="btn-spinner"></div>
                      <span>Resetting...</span>
                    </span>
                    <span v-else>🚨 NUCLEAR RESET</span>
                  </button>
                  
                  <button
                    @click="cancelNuclear"
                    :disabled="nukingEverything"
                    class="btn btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
</template>

<script setup>
// Auth state
const authLoading = ref(true)
const authenticated = ref(false)

// State
const loading = ref(true)
const nukingFiles = ref(false)
const revokingKeys = ref(false)
const nukingEverything = ref(false)
const error = ref('')
const successMessage = ref('')

// Confirmation states
const fileNukeConfirm = ref(false)
const keyRevokeConfirm = ref(false)
const nuclearConfirm = ref(false)

// Confirmation text
const fileNukeText = ref('')
const nuclearText = ref('')

// System stats
const systemStats = ref({
  files: 0,
  keys: 0,
  totalSize: 0
})

// Auth check and load system stats on mount
onMounted(async () => {
  try {
    const authCheck = await $fetch('/api/auth/check')
    if (!authCheck.authenticated) {
      await navigateTo('/login')
      return
    }
    authenticated.value = true
    // Load stats after auth succeeds
    await loadSystemStats()
  } catch (error) {
    console.error('Auth check failed:', error)
    await navigateTo('/login')
  } finally {
    authLoading.value = false
  }
})

// Auto-clear messages
watch([error, successMessage], () => {
  if (error.value) {
    setTimeout(() => error.value = '', 8000)
  }
  if (successMessage.value) {
    setTimeout(() => successMessage.value = '', 5000)
  }
})

// Load system statistics - UPDATED to remove hardcoded API keys
async function loadSystemStats() {
  try {
    loading.value = true
    
    const [filesResponse, keysResponse] = await Promise.all([
      $fetch('/api/files/list'),
      $fetch('/api/keys/list')
    ])
    
    systemStats.value = {
      files: filesResponse.files?.length || 0,
      keys: keysResponse.length || 0,
      totalSize: filesResponse.files?.reduce((total, file) => total + (file.size || 0), 0) || 0
    }
    
  } catch (err) {
    error.value = 'Failed to load system statistics'
  } finally {
    loading.value = false
  }
}

// Nuke all files - UPDATED to remove hardcoded API keys
async function nukeAllFiles() {
  try {
    nukingFiles.value = true
    error.value = ''
    
    await $fetch('/api/files/nuke', {
      method: 'POST'
    })
    
    successMessage.value = 'All files have been permanently deleted'
    cancelFileNuke()
    await loadSystemStats()
    
  } catch (err) {
    error.value = err.data?.message || 'Failed to delete all files'
  } finally {
    nukingFiles.value = false
  }
}

// Revoke all keys - UPDATED to remove hardcoded API keys
async function revokeAllKeys() {
  try {
    revokingKeys.value = true
    error.value = ''
    
    const keys = await $fetch('/api/keys/list')
    
    const activeKeys = keys.filter(key => !key.revoked)
    let revokedCount = 0
    let failedCount = 0
    
    // Process keys sequentially to avoid race conditions
    for (const key of activeKeys) {
      try {
        const result = await $fetch('/api/keys/revoke', {
          method: 'POST',
          body: { key: key.key }
        })
        
        if (result.ok) {
          revokedCount++
        } else {
          failedCount++
        }
      } catch (err) {
        console.error(`Failed to revoke key ${key.key}:`, err)
        failedCount++
      }
    }
    
    if (failedCount === 0) {
      successMessage.value = `All ${revokedCount} API keys have been revoked`
    } else {
      successMessage.value = `${revokedCount} keys revoked, ${failedCount} failed`
    }
    
    cancelKeyRevoke()
    await loadSystemStats()
    
  } catch (err) {
    error.value = err.data?.message || 'Failed to revoke all keys'
  } finally {
    revokingKeys.value = false
  }
}

// Nuclear reset - UPDATED to remove hardcoded API keys
async function nuclearReset() {
  try {
    nukingEverything.value = true
    error.value = ''
    
    await Promise.allSettled([
      $fetch('/api/files/nuke', {
        method: 'POST'
      }),
    ])
    
    const keys = await $fetch('/api/keys/list').catch(() => [])
    
    const revokePromises = keys
      .filter(key => !key.revoked)
      .map(key => 
        $fetch('/api/keys/revoke', {
          method: 'POST',
          body: { key: key.key }
        })
      )
    
    await Promise.allSettled(revokePromises)
    
    successMessage.value = 'Complete system reset successful. You may need to reconfigure your installation.'
    cancelNuclear()
    await loadSystemStats()
    
    setTimeout(() => {
      navigateTo('/setup')
    }, 3000)
    
  } catch (err) {
    error.value = err.data?.message || 'Failed to complete nuclear reset'
  } finally {
    nukingEverything.value = false
  }
}

// Cancel functions
function cancelFileNuke() {
  fileNukeConfirm.value = false
  fileNukeText.value = ''
}

function cancelKeyRevoke() {
  keyRevokeConfirm.value = false
}

function cancelNuclear() {
  nuclearConfirm.value = false
  nuclearText.value = ''
}

// Utility functions
function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// Meta
useHead({
  title: 'Emergency Controls - Kash Files',
  meta: [
    { name: 'description', content: 'Emergency data management controls' }
  ]
})
</script>

<style scoped>
.emergency-page {
  max-width: 1024px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

@media (min-width: 640px) {
  .emergency-page {
    padding: 2rem 1.25rem;
  }
}

.warning-banner {
  margin-bottom: 2rem;
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 4px solid #ef4444;
  border-radius: 0 0.5rem 0.5rem 0;
  padding: 1.5rem;
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.warning-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ef4444;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warning-text h2 {
  color: #ef4444;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.warning-text p {
  color: rgba(239, 68, 68, 0.8);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.status-section {
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
  color: #e5e7eb;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #3f3f46;
  border-top-color: #67e8f9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-item {
  background-color: #0B1220;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.875rem;
}

.stat-value {
  color: #e5e7eb;
  font-weight: 600;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-card {
  background-color: #0F1218;
  border: 1px solid;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.action-card.danger {
  border-color: rgba(239, 68, 68, 0.2);
}

.action-card.warning {
  border-color: rgba(245, 158, 11, 0.2);
}

.action-card.nuclear {
  border-color: rgba(234, 88, 12, 0.2);
}

.action-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.action-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.danger-icon {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.warning-icon {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.nuclear-icon {
  background-color: rgba(124, 45, 18, 0.1);
  color: #ea580c;
}

.action-body {
  flex: 1;
}

.action-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.danger-title {
  color: #ef4444;
}

.warning-title {
  color: #f59e0b;
}

.nuclear-title {
  color: #ea580c;
}

.action-description {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.action-initial {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-danger-outline {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-danger-outline:hover:not(:disabled) {
  background-color: rgba(239, 68, 68, 0.2);
}

.btn-warning-outline {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.btn-warning-outline:hover:not(:disabled) {
  background-color: rgba(245, 158, 11, 0.2);
}

.btn-nuclear-outline {
  background-color: rgba(124, 45, 18, 0.1);
  color: #ea580c;
  border-color: rgba(234, 88, 12, 0.3);
}

.btn-nuclear-outline:hover:not(:disabled) {
  background-color: rgba(124, 45, 18, 0.2);
}

.action-confirm {
  margin-top: 1rem;
}

.confirm-box {
  border-radius: 0.375rem;
  padding: 1rem;
  border: 1px solid;
}

.danger-confirm {
  background-color: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.2);
}

.warning-confirm {
  background-color: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.2);
}

.nuclear-confirm {
  background-color: rgba(124, 45, 18, 0.05);
  border-color: rgba(234, 88, 12, 0.2);
}

.confirm-warning {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 0.75rem 0;
}

.danger-confirm .confirm-warning {
  color: #ef4444;
}

.warning-confirm .confirm-warning {
  color: #f59e0b;
}

.nuclear-confirm .confirm-warning {
  color: #ea580c;
}

.input-group {
  margin-bottom: 0.75rem;
}

.input-group label {
  display: block;
  color: #e5e7eb;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.confirm-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: #0B1220;
  border: 1px solid #27272a;
  border-radius: 0.375rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.confirm-input::placeholder {
  color: #9ca3af;
}

.confirm-input:focus {
  outline: none;
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.confirm-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
  border-color: #dc2626;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn-warning:hover:not(:disabled) {
  background-color: #d97706;
  border-color: #d97706;
}

.btn-nuclear {
  background-color: #ea580c;
  color: white;
  border-color: #ea580c;
}

.btn-nuclear:hover:not(:disabled) {
  background-color: #c2410c;
  border-color: #c2410c;
}

.btn-cancel {
  background: none;
  color: #94a3b8;
  border-color: transparent;
}

.btn-cancel:hover:not(:disabled) {
  color: #e5e7eb;
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

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .action-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-icon {
    align-self: flex-start;
  }
  
  .confirm-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
  }
}

/* Focus states for accessibility */
.btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
</style>