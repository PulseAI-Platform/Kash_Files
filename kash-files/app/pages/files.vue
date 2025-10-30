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
  <div v-else class="files-page">
    <!-- Upload Section -->
    <div class="upload-section">
      <div class="card">
        <h2 class="section-title">Upload File</h2>
        
        <!-- Upload Area -->
        <div
          @drop.prevent="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          class="upload-area"
          :class="{ 'dragging': isDragging }"
          @dragenter="isDragging = true"
          @dragleave="isDragging = false"
        >
          <div class="upload-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <p class="upload-text">Drop files here or click to browse</p>
          <p class="upload-subtext">Maximum file size: 100MB</p>
          
          <input
            ref="fileInput"
            type="file"
            multiple
            class="file-input"
            @change="handleFileSelect"
            :disabled="uploading"
          />
          
          <button
            @click="$refs.fileInput.click()"
            :disabled="uploading"
            class="btn btn-primary"
          >
            Select Files
          </button>
        </div>

        <!-- Upload Settings -->
        <div v-if="selectedFiles.length > 0" class="upload-settings">
          <div class="settings-grid">
            <div class="input-group">
              <label>Decay (Days)</label>
              <input
                v-model="uploadSettings.decay"
                type="number"
                min="1"
                max="3650"
                placeholder="365"
                :disabled="uploading"
              />
              <p class="input-help">Files will expire after this many days (default: 365)</p>
            </div>
          </div>

          <!-- Selected Files Preview -->
          <div class="selected-files">
            <h3 class="files-title">Selected Files ({{ selectedFiles.length }})</h3>
            <div class="files-preview">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="file-preview"
              >
                <span class="file-name">{{ file.name }}</span>
                <div class="file-actions">
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <button
                    @click="removeFile(index)"
                    :disabled="uploading"
                    class="remove-btn"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Button -->
          <button
            @click="uploadFiles"
            :disabled="uploading || selectedFiles.length === 0"
            class="btn btn-primary upload-btn"
          >
            <span v-if="uploading" class="btn-loading">
              <div class="btn-spinner"></div>
              <span>Uploading {{ currentUpload }}/{{ selectedFiles.length }}...</span>
            </span>
            <span v-else>Upload {{ selectedFiles.length }} File{{ selectedFiles.length !== 1 ? 's' : '' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Results -->
    <div v-if="uploadResults.length > 0" class="results-section">
      <div class="success-card">
        <h3 class="results-title">Recently Uploaded</h3>
        <div class="results-list">
          <div
            v-for="result in uploadResults"
            :key="result.location"
            class="result-item"
          >
            <div class="result-header">
              <span class="result-filename">{{ result.filename }}</span>
              <button
                @click="copyFileInfo({ filename: result.filename, downloadUrl: result.download, uploadedWith: 'web-interface' })"
                class="copy-link-btn"
              >
                Copy Info
              </button>
            </div>
            <div class="result-meta">
              <p>Expires: {{ formatDate(result.decay) }}</p>
              <div class="result-url">{{ result.download }}</div>
            </div>
          </div>
        </div>
        <button @click="uploadResults = []" class="clear-btn">
          Clear Results
        </button>
      </div>
    </div>

    <!-- Files Management Section -->
    <div class="files-section">
      <div class="card">
        <div class="card-header">
          <h2 class="section-title">Your Files</h2>
          <button
            @click="loadFiles"
            :disabled="loadingFiles"
            class="refresh-btn"
            title="Refresh"
          >
            <svg class="refresh-icon" :class="{ spinning: loadingFiles }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <!-- Search and Filter Controls -->
        <div class="controls-section">
          <div class="search-controls">
            <div class="search-box">
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Search files..."
                class="search-input"
              />
              <button
                v-if="searchTerm"
                @click="searchTerm = ''"
                class="clear-search-btn"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="filter-controls">
              <select v-model="filters.status" class="filter-select">
                <option value="">All Files</option>
                <option value="active">Active Only</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired Only</option>
              </select>

              <select v-model="filters.dateRange" class="filter-select">
                <option value="">Any Date</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="older">Older</option>
              </select>

              <select v-model="filters.uploadSource" class="filter-select">
                <option value="">Any Source</option>
                <option value="web-interface">Web Interface</option>
                <option value="api-key">API Keys</option>
              </select>

              <select v-model="sortBy" class="filter-select">
                <option value="uploaded-desc">Newest First</option>
                <option value="uploaded-asc">Oldest First</option>
                <option value="filename-asc">Name A-Z</option>
                <option value="filename-desc">Name Z-A</option>
                <option value="decay-asc">Expires Soon</option>
                <option value="decay-desc">Expires Later</option>
              </select>
            </div>
          </div>

          <!-- Bulk Actions -->
          <div v-if="selectedFileIds.size > 0" class="bulk-actions">
            <div class="bulk-info">
              <span class="selected-count">{{ selectedFileIds.size }} selected</span>
              <button @click="clearSelection" class="clear-selection-btn">Clear</button>
            </div>
            
            <div class="bulk-buttons">
              <button
                @click="bulkDelete"
                :disabled="bulkOperating"
                class="bulk-btn bulk-delete"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </button>

              <button
                @click="showBulkExpireDialog = true"
                :disabled="bulkOperating"
                class="bulk-btn bulk-expire"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Update Expiry
              </button>

              <button
                @click="bulkCopyLinks"
                class="bulk-btn bulk-copy"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Links
              </button>
            </div>
          </div>
        </div>

        <!-- File Results Info -->
        <div class="results-info">
          <span class="results-count">
            Showing {{ filteredFiles.length }} of {{ files.length }} files
          </span>
          <div class="selection-controls">
            <button
              @click="selectAllVisible"
              :disabled="filteredFiles.length === 0"
              class="select-btn"
            >
              Select All {{ filteredFiles.length > 0 ? `(${filteredFiles.length})` : '' }}
            </button>
            <button
              v-if="selectedFileIds.size > 0"
              @click="clearSelection"
              class="select-btn"
            >
              Clear Selection
            </button>
          </div>
        </div>

        <!-- Files List -->
        <div v-if="loadingFiles && files.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Loading files...</p>
        </div>

        <div v-else-if="filteredFiles.length === 0 && files.length > 0" class="empty-state">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3>No Matching Files</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>

        <div v-else-if="files.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3>No Files Yet</h3>
          <p>Upload your first file to get started.</p>
        </div>

        <div v-else class="files-list">
          <div
            v-for="file in filteredFiles"
            :key="file.location"
            class="file-item"
            :class="{ 'selected': selectedFileIds.has(file.location) }"
          >
            <div class="file-checkbox">
              <input
                type="checkbox"
                :checked="selectedFileIds.has(file.location)"
                @change="toggleFileSelection(file.location)"
                class="checkbox"
              />
            </div>

            <div class="file-content">
              <div class="file-header">
                <h3 class="file-name">{{ file.filename }}</h3>
                
                <div class="file-badges">
                  <span
                    class="status-badge"
                    :class="{
                      expired: file.isExpired,
                      expiring: isExpiringSoon(file.decay),
                      active: !file.isExpired && !isExpiringSoon(file.decay)
                    }"
                  >
                    <span v-if="file.isExpired">Expired</span>
                    <span v-else-if="isExpiringSoon(file.decay)">Expires Soon</span>
                    <span v-else>Active</span>
                  </span>
                  
                  <span 
                    v-if="file.uploadedWith && file.uploadedWith !== 'web-interface'" 
                    class="source-badge"
                    :title="`Uploaded via: ${file.uploadedWith}`"
                  >
                    {{ file.uploadedWith }}
                  </span>
                </div>
              </div>
              
              <div class="file-meta">
                <div class="file-details">
                  <span>Uploaded: {{ formatDate(file.uploaded) }}</span>
                  <span>Expires: {{ formatDate(file.decay) }}</span>
                  <span v-if="file.size">Size: {{ formatFileSize(file.size) }}</span>
                  <span v-if="file.uploadedWith && file.uploadedWith !== 'web-interface'" class="upload-source">
                    Via: {{ file.uploadedWith }}
                  </span>
                </div>
                
                <div class="file-url">
                  <span class="url-text">{{ file.downloadUrl }}</span>
                  <button
                    @click="copyFileInfo(file)"
                    class="copy-btn-small"
                    title="Copy file info with details"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="file-actions">
              <a
                :href="file.downloadUrl"
                target="_blank"
                class="view-btn"
                :class="{ disabled: file.isExpired }"
              >
                <span v-if="file.isExpired">Expired</span>
                <span v-else>View</span>
              </a>
              
              <button
                @click="deleteFile(file)"
                :disabled="deletingFiles.has(file.location)"
                class="delete-btn"
              >
                <span v-if="deletingFiles.has(file.location)">Deleting...</span>
                <span v-else>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Expire Dialog -->
    <div v-if="showBulkExpireDialog" class="dialog-overlay" @click="showBulkExpireDialog = false">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>Update Expiry Date</h3>
          <button @click="showBulkExpireDialog = false" class="dialog-close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="dialog-content">
          <p>Update expiry for {{ selectedFileIds.size }} selected files:</p>
          
          <div class="input-group">
            <label>New Expiry (Days from now)</label>
            <input
              v-model="bulkExpireDays"
              type="number"
              min="1"
              max="3650"
              placeholder="365"
              class="dialog-input"
            />
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="showBulkExpireDialog = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="bulkUpdateExpiry" :disabled="!bulkExpireDays || bulkOperating" class="btn btn-primary">
            <span v-if="bulkOperating">Updating...</span>
            <span v-else>Update Expiry</span>
          </button>
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
// Auth state
const authLoading = ref(true)
const authenticated = ref(false)

// State
const loadingFiles = ref(false)
const uploading = ref(false)
const currentUpload = ref(0)
const isDragging = ref(false)
const error = ref('')
const successMessage = ref('')
const deletingFiles = ref(new Set())
const bulkOperating = ref(false)

// Search and Filter
const searchTerm = ref('')
const sortBy = ref('uploaded-desc')
const filters = ref({
  status: '', // '', 'active', 'expiring', 'expired'
  dateRange: '', // '', 'today', 'week', 'month', 'older'
  uploadSource: '' // '', 'web-interface', 'api-key'
})

// Bulk Selection
const selectedFileIds = ref(new Set())
const showBulkExpireDialog = ref(false)
const bulkExpireDays = ref(365)

// File data
const selectedFiles = ref([])
const files = ref([])
const uploadResults = ref([])

// Upload settings
const uploadSettings = ref({
  decay: 365
})

// Refs
const fileInput = ref(null)

// Computed - Filtered and Sorted Files
const filteredFiles = computed(() => {
  let result = [...files.value]

  // Search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(file => 
      file.filename.toLowerCase().includes(term) ||
      (file.uploadedWith && file.uploadedWith.toLowerCase().includes(term))
    )
  }

  // Status filter
  if (filters.value.status) {
    result = result.filter(file => {
      switch (filters.value.status) {
        case 'active':
          return !file.isExpired && !isExpiringSoon(file.decay)
        case 'expiring':
          return !file.isExpired && isExpiringSoon(file.decay)
        case 'expired':
          return file.isExpired
        default:
          return true
      }
    })
  }

  // Upload source filter
  if (filters.value.uploadSource) {
    result = result.filter(file => {
      switch (filters.value.uploadSource) {
        case 'web-interface':
          return !file.uploadedWith || file.uploadedWith === 'web-interface'
        case 'api-key':
          return file.uploadedWith && file.uploadedWith !== 'web-interface'
        default:
          return true
      }
    })
  }

  // Date range filter
  if (filters.value.dateRange) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    result = result.filter(file => {
      if (!file.uploaded) return false
      const uploaded = new Date(file.uploaded)
      switch (filters.value.dateRange) {
        case 'today':
          return uploaded >= today
        case 'week':
          return uploaded >= weekAgo
        case 'month':
          return uploaded >= monthAgo
        case 'older':
          return uploaded < monthAgo
        default:
          return true
      }
    })
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'uploaded-desc':
        return new Date(b.uploaded || 0) - new Date(a.uploaded || 0)
      case 'uploaded-asc':
        return new Date(a.uploaded || 0) - new Date(b.uploaded || 0)
      case 'filename-asc':
        return a.filename.localeCompare(b.filename)
      case 'filename-desc':
        return b.filename.localeCompare(a.filename)
      case 'decay-asc':
        return new Date(a.decay || 0) - new Date(b.decay || 0)
      case 'decay-desc':
        return new Date(b.decay || 0) - new Date(a.decay || 0)
      default:
        return 0
    }
  })

  return result
})

// Auth check and load files on mount
onMounted(async () => {
  try {
    const authCheck = await $fetch('/api/auth/check')
    if (!authCheck.authenticated) {
      await navigateTo('/login')
      return
    }
    authenticated.value = true
    // Load files after auth succeeds
    await loadFiles()
  } catch (error) {
    console.error('Auth check failed:', error)
    await navigateTo('/login')
  } finally {
    authLoading.value = false
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

// Load all files
async function loadFiles() {
  try {
    loadingFiles.value = true
    error.value = ''
    
    const response = await $fetch('/api/files/list')
    files.value = response.files || response || []
  } catch (err) {
    if (err.statusCode === 401) {
      await navigateTo('/login')
      return
    }
    error.value = err.data?.message || 'Failed to load files'
  } finally {
    loadingFiles.value = false
  }
}

// Handle file selection
function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  addFiles(files)
}

// Handle drag and drop
function handleDrop(event) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

// Add files to selection
function addFiles(newFiles) {
  const validFiles = newFiles.filter(file => {
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      showError(`File ${file.name} is too large (max 100MB)`)
      return false
    }
    return true
  })
  
  selectedFiles.value.push(...validFiles)
}

// Remove file from selection
function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

// Upload files
async function uploadFiles() {
  if (selectedFiles.value.length === 0) return
  
  try {
    uploading.value = true
    error.value = ''
    currentUpload.value = 0
    const results = []
    
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i]
      currentUpload.value = i + 1
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', file.name)
      formData.append('decay', uploadSettings.value.decay.toString())
      
      const result = await $fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })
      
      results.push(result)
    }
    
    uploadResults.value = results
    selectedFiles.value = []
    showSuccess(`Successfully uploaded ${results.length} file${results.length !== 1 ? 's' : ''}`)
    await loadFiles()
    
  } catch (err) {
    if (err.statusCode === 401) {
      await navigateTo('/login')
      return
    }
    error.value = err.data?.message || 'Failed to upload files'
  } finally {
    uploading.value = false
    currentUpload.value = 0
  }
}

// Delete file
async function deleteFile(file) {
  if (!confirm(`Are you sure you want to delete "${file.filename}"? This action cannot be undone.`)) {
    return
  }
  
  try {
    deletingFiles.value.add(file.location)
    error.value = ''
    
    await $fetch('/api/files/delete', {
      method: 'POST',
      body: { location: file.location }
    })
    
    showSuccess('File deleted successfully')
    selectedFileIds.value.delete(file.location)
    await loadFiles()
    
  } catch (err) {
    if (err.statusCode === 401) {
      await navigateTo('/login')
      return
    }
    error.value = err.data?.message || 'Failed to delete file'
  } finally {
    deletingFiles.value.delete(file.location)
  }
}

// Bulk Selection Functions
function toggleFileSelection(fileId) {
  if (selectedFileIds.value.has(fileId)) {
    selectedFileIds.value.delete(fileId)
  } else {
    selectedFileIds.value.add(fileId)
  }
}

function selectAllVisible() {
  filteredFiles.value.forEach(file => {
    selectedFileIds.value.add(file.location)
  })
}

function clearSelection() {
  selectedFileIds.value.clear()
}

// Bulk Operations
async function bulkDelete() {
  const count = selectedFileIds.value.size
  if (!confirm(`Are you sure you want to delete ${count} selected files? This action cannot be undone.`)) {
    return
  }
  
  try {
    bulkOperating.value = true
    error.value = ''
    
    const promises = Array.from(selectedFileIds.value).map(location =>
      $fetch('/api/files/delete', {
        method: 'POST',
        body: { location }
      })
    )
    
    await Promise.allSettled(promises)
    
    showSuccess(`Successfully deleted ${count} files`)
    clearSelection()
    await loadFiles()
    
  } catch (err) {
    error.value = 'Failed to delete some files'
  } finally {
    bulkOperating.value = false
  }
}
async function bulkUpdateExpiry() {
  if (!bulkExpireDays.value) return
  
  try {
    bulkOperating.value = true
    error.value = ''
    
    const promises = Array.from(selectedFileIds.value).map(location =>
      $fetch('/api/files/update-expiry', {
        method: 'POST',
        body: { 
          location,
          decay: bulkExpireDays.value 
        }
      })
    )
    
    await Promise.allSettled(promises)
    
    showSuccess(`Updated expiry for ${selectedFileIds.value.size} files`)
    showBulkExpireDialog.value = false
    clearSelection()
    await loadFiles()
    
  } catch (err) {
    error.value = 'Failed to update expiry for some files'
  } finally {
    bulkOperating.value = false
  }
}

function bulkCopyLinks() {
  const selectedFiles = files.value.filter(file => 
    selectedFileIds.value.has(file.location)
  )
  
  const links = selectedFiles.map(file => {
    const uploadInfo = file.uploadedWith && file.uploadedWith !== 'web-interface' 
      ? ` (${file.uploadedWith})` 
      : '';
    const sizeInfo = file.size ? ` [${formatFileSize(file.size)}]` : '';
    return `${file.filename}${uploadInfo}${sizeInfo}: ${file.downloadUrl}`;
  }).join('\n')
  
  copyToClipboard(links)
  showSuccess(`Copied ${selectedFiles.length} download links with details`)
}

// Enhanced copy function with metadata
function copyFileInfo(file) {
  const uploadInfo = file.uploadedWith && file.uploadedWith !== 'web-interface' 
    ? ` (uploaded via: ${file.uploadedWith})` 
    : '';
  const sizeInfo = file.size ? ` [${formatFileSize(file.size)}]` : '';
  const info = `${file.filename}${uploadInfo}${sizeInfo}: ${file.downloadUrl}`;
  copyToClipboard(info);
}

// Utility functions
function isExpiringSoon(decayDate) {
  if (!decayDate) return false;
  const now = new Date()
  const decay = new Date(decayDate)
  const daysUntilExpiry = (decay - now) / (1000 * 60 * 60 * 24)
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    showSuccess('Copied to clipboard')
  } catch (err) {
    // Fallback for older browsers
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

function showError(message) {
  error.value = message
}

// Meta
useHead({
  title: 'Files - Kash Files',
  meta: [
    { name: 'description', content: 'Upload and manage your files with advanced search and filtering' }
  ]
})
</script>
<style scoped>
.files-page {
  max-width: 1152px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

@media (min-width: 640px) {
  .files-page {
    padding: 2rem 1.25rem;
  }
}

.upload-section,
.results-section,
.files-section {
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

.upload-area {
  border: 2px dashed #3f3f46;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.upload-area.dragging {
  border-color: #2563eb;
  background-color: rgba(37, 99, 235, 0.05);
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background-color: #0B1220;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.upload-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #9ca3af;
}

.upload-text {
  color: #e5e7eb;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.upload-subtext {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.file-input {
  display: none;
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

.btn-secondary {
  background-color: #374151;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.upload-btn {
  width: 100%;
  padding: 0.75rem 1rem;
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

/* Controls Section */
.controls-section {
  background-color: #0B1220;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.search-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .search-controls {
    flex-direction: row;
    align-items: center;
  }
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 24rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  background-color: #0F1218;
  border: 1px solid #3f3f46;
  border-radius: 0.375rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-search-btn:hover {
  color: #e5e7eb;
}

.clear-search-btn svg {
  width: 1rem;
  height: 1rem;
}

.filter-controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  background-color: #0F1218;
  border: 1px solid #3f3f46;
  border-radius: 0.375rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  min-width: 8rem;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Bulk Actions */
.bulk-actions {
  background-color: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 0.375rem;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.selected-count {
  color: #2563eb;
  font-weight: 500;
  font-size: 0.875rem;
}

.clear-selection-btn {
  color: #94a3b8;
  background: none;
  border: none;
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-selection-btn:hover {
  color: #e5e7eb;
}

.bulk-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bulk-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
}

.bulk-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-btn svg {
  width: 1rem;
  height: 1rem;
}

.bulk-delete {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.bulk-delete:hover:not(:disabled) {
  background-color: rgba(239, 68, 68, 0.2);
}

.bulk-expire {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.bulk-expire:hover:not(:disabled) {
  background-color: rgba(245, 158, 11, 0.2);
}

.bulk-copy {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

.bulk-copy:hover:not(:disabled) {
  background-color: rgba(16, 185, 129, 0.2);
}

/* Results Info */
.results-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #27272a;
}

.results-count {
  color: #94a3b8;
  font-size: 0.875rem;
}

.selection-controls {
  display: flex;
  gap: 0.5rem;
}

.select-btn {
  color: #67e8f9;
  background: none;
  border: none;
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}

.select-btn:hover:not(:disabled) {
  color: #22d3ee;
}

.select-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* File Item Updates */
.file-item {
  background-color: #0F1218;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: #0B1220;
}

.file-item.selected {
  background-color: rgba(37, 99, 235, 0.05);
  border-left: 3px solid #2563eb;
}

.file-checkbox {
  display: flex;
  align-items: center;
}

.checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #2563eb;
  cursor: pointer;
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background-color: #0F1218;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 28rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #27272a;
}

.dialog-header h3 {
  color: #e5e7eb;
  font-weight: 600;
  margin: 0;
}

.dialog-close {
  color: #94a3b8;
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.dialog-close:hover {
  color: #e5e7eb;
}

.dialog-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.dialog-content {
  padding: 1rem 1.5rem;
}

.dialog-content p {
  color: #e5e7eb;
  margin: 0 0 1rem 0;
}

.dialog-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: #0B1220;
  border: 1px solid #27272a;
  border-radius: 0.375rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.dialog-input::placeholder {
  color: #9ca3af;
}

.dialog-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
  justify-content: flex-end;
}

/* Keep all your existing styles and add these mobile responsive updates */
@media (max-width: 768px) {
  .search-controls {
    flex-direction: column;
  }
  
  .filter-controls {
    justify-content: stretch;
  }
  
  .filter-select {
    flex: 1;
    min-width: auto;
  }
  
  .bulk-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .bulk-buttons {
    justify-content: stretch;
  }
  
  .bulk-btn {
    flex: 1;
    justify-content: center;
  }
  
  .results-info {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .selection-controls {
    justify-content: center;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .file-checkbox {
    align-self: flex-start;
  }
  
  .file-actions {
    align-self: flex-end;
    margin-left: 0;
  }
}
.files-page {
  max-width: 1152px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

@media (min-width: 640px) {
  .files-page {
    padding: 2rem 1.25rem;
  }
}

.upload-section,
.results-section,
.files-section {
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

.upload-area {
  border: 2px dashed #3f3f46;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.upload-area.dragging {
  border-color: #2563eb;
  background-color: rgba(37, 99, 235, 0.05);
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background-color: #0B1220;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.upload-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #9ca3af;
}

.upload-text {
  color: #e5e7eb;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.upload-subtext {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.file-input {
  display: none;
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

.upload-btn {
  width: 100%;
  padding: 0.75rem 1rem;
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

.upload-settings {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .settings-grid {
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

.input-help {
  color: #9ca3af;
  font-size: 0.75rem;
  margin: 0;
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.files-title {
  color: #e5e7eb;
  font-weight: 500;
  margin: 0;
}

.files-preview {
  max-height: 8rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #0B1220;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid #27272a;
}

.file-name {
  color: #e5e7eb;
  font-size: 0.875rem;
  truncate: true;
  flex: 1;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.file-size {
  color: #9ca3af;
  font-size: 0.75rem;
}

.remove-btn {
  color: #ef4444;
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: #dc2626;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn svg {
  width: 1rem;
  height: 1rem;
}

.success-card {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.results-title {
  color: #10b981;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.result-item {
  background-color: #0B1220;
  border: 1px solid #27272a;
  border-radius: 0.375rem;
  padding: 1rem;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.result-filename {
  color: #e5e7eb;
  font-weight: 500;
}

.copy-link-btn {
  color: #67e8f9;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.copy-link-btn:hover {
  color: #22d3ee;
}

.result-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-meta p {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}

.result-url {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  background-color: #0F1218;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #27272a;
  word-break: break-all;
}

.clear-btn {
  color: #94a3b8;
  background: none;
  border: none;
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-btn:hover {
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

.files-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background-color: #27272a;
  border-radius: 0.375rem;
  overflow: hidden;
}

.file-item {
  background-color: #0F1218;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: #0B1220;
}

.file-content {
  flex: 1;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.file-name {
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

.status-badge.expiring {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}

.status-badge.expired {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.file-details {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

@media (max-width: 640px) {
  .file-details {
    flex-direction: column;
    gap: 0.25rem;
  }
}

.file-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.url-text {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  color: #67e8f9;
  background-color: #0B1220;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #27272a;
  flex: 1;
  word-break: break-all;
}

.copy-btn-small {
  color: #94a3b8;
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.copy-btn-small:hover {
  color: #e5e7eb;
}

.copy-btn-small svg {
  width: 1rem;
  height: 1rem;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.view-btn {
  color: #67e8f9;
  text-decoration: none;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.view-btn:hover {
  color: #22d3ee;
}

.view-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.delete-btn {
  color: #ef4444;
  background: none;
  border: none;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #dc2626;
}

.delete-btn:disabled {
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

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .file-actions {
    margin-left: 0;
    align-self: flex-end;
  }
  
  .upload-area {
    padding: 1.5rem;
  }
  
  .file-url {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .url-text {
    width: 100%;
  }
}

/* Focus states for accessibility */
.btn:focus-visible,
.refresh-btn:focus-visible,
.copy-link-btn:focus-visible,
.view-btn:focus-visible,
.delete-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Drag and drop visual feedback */
.upload-area:hover {
  border-color: #2563eb;
  background-color: rgba(37, 99, 235, 0.02);
}
</style>