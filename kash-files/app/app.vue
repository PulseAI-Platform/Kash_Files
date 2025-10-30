<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* Global reset and base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  background-color: #0B0E14;
  color: #e5e7eb;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: #0B0E14;
  color: #e5e7eb;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  overflow-x: hidden;
}

#__nuxt {
  background-color: #0B0E14;
  min-height: 100vh;
}

/* Remove default button styles */
button {
  background: none;
  border: none;
  font-family: inherit;
}

/* Remove default link styles */
a {
  color: inherit;
  text-decoration: none;
}

/* Remove default input styles */
input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
}

/* Remove default list styles */
ul,
ol {
  list-style: none;
}

/* Ensure images are responsive */
img {
  max-width: 100%;
  height: auto;
}

/* Focus styles for accessibility */
*:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Selection color */
::selection {
  background-color: rgba(37, 99, 235, 0.3);
  color: #e5e7eb;
}

/* Scrollbar styling for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0B0E14;
}

::-webkit-scrollbar-thumb {
  background: #27272a;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3f3f46;
}

/* Firefox scrollbar styling */
* {
  scrollbar-width: thin;
  scrollbar-color: #27272a #0B0E14;
}

/* Ensure full height for layout containers */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* Loading state for Nuxt */
.nuxt-loading-indicator {
  background: linear-gradient(90deg, #2563eb, #3b82f6) !important;
  height: 3px !important;
}

/* Override any default Nuxt/Vue styles that might add borders */
.nuxt-page,
.layout-default,
.__nuxt {
  background-color: #0B0E14 !important;
}
</style>