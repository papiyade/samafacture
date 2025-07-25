// Advanced Service Worker for SamaFacture PWA
// Supports intelligent caching, offline functionality, and background sync

const CACHE_VERSION = 'v2.0.0'
const STATIC_CACHE = `samafacture-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `samafacture-dynamic-${CACHE_VERSION}`
const API_CACHE = `samafacture-api-${CACHE_VERSION}`

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/client/main.js',
  '/src/shared/styles/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints that should be cached
const API_ENDPOINTS = [
  '/api/clients',
  '/api/invoices',
  '/api/quotes',
  '/api/products',
  '/api/expenses'
]

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      // Initialize dynamic cache
      caches.open(DYNAMIC_CACHE),
      // Initialize API cache
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('✅ Service Worker installed successfully')
      // Force activation of new service worker
      return self.skipWaiting()
    })
  )
})

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('samafacture-') && 
                !cacheName.includes(CACHE_VERSION)) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully')
      // Notify clients about the update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          })
        })
      })
    })
  )
})

// Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }
  
  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request)) {
    // Static assets: Cache First strategy
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isAPIRequest(request)) {
    // API requests: Network First with offline fallback
    event.respondWith(networkFirstWithOfflineSupport(request))
  } else if (isPageRequest(request)) {
    // Page requests: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
  } else {
    // Other requests: Network First
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  }
})

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag)
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions())
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION })
      break
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
    case 'FORCE_SYNC':
      syncOfflineActions().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
  }
})

// Caching Strategies

// Cache First - Good for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Cache First failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network First - Good for dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', request.url)
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Stale While Revalidate - Good for pages
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Network failed, but we might have cache
    return cachedResponse
  })
  
  // Return cached version immediately if available
  return cachedResponse || fetchPromise
}

// Network First with Offline Support - For API requests
async function networkFirstWithOfflineSupport(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('API request failed, checking cache and offline queue:', request.url)
    
    // Try to get from cache
    const cache = await caches.open(API_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone()
      response.headers.set('X-Served-From', 'cache')
      return response
    }
    
    // If it's a write operation (POST, PUT, DELETE), queue it for later
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await queueOfflineAction(request)
      return new Response(JSON.stringify({ 
        success: true, 
        offline: true,
        message: 'Action queued for synchronization' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Return offline response for GET requests
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'No cached data available' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Helper Functions

function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

function isAPIRequest(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/api/') || 
         API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))
}

function isPageRequest(request) {
  const url = new URL(request.url)
  return request.headers.get('accept')?.includes('text/html') ||
         url.pathname === '/' ||
         url.pathname.endsWith('.html')
}

// Offline Action Queue Management

async function queueOfflineAction(request) {
  try {
    const action = {
      id: Date.now() + Math.random(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    }
    
    // Store in IndexedDB (we'll implement this)
    const db = await openOfflineDB()
    const transaction = db.transaction(['offline_actions'], 'readwrite')
    const store = transaction.objectStore('offline_actions')
    await store.add(action)
    
    console.log('📝 Queued offline action:', action)
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('sync-offline-actions')
    }
  } catch (error) {
    console.error('Failed to queue offline action:', error)
  }
}

async function syncOfflineActions() {
  try {
    console.log('🔄 Starting offline actions sync...')
    
    const db = await openOfflineDB()
    const transaction = db.transaction(['offline_actions'], 'readwrite')
    const store = transaction.objectStore('offline_actions')
    const actions = await store.getAll()
    
    let syncedCount = 0
    let failedCount = 0
    
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        if (response.ok) {
          // Remove successful action from queue
          await store.delete(action.id)
          syncedCount++
          console.log('✅ Synced offline action:', action.url)
        } else {
          failedCount++
          console.error('❌ Failed to sync action:', action.url, response.status)
        }
      } catch (error) {
        failedCount++
        console.error('❌ Network error syncing action:', action.url, error)
      }
    }
    
    // Notify main thread about sync results
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          synced: syncedCount,
          failed: failedCount,
          total: actions.length
        })
      })
    })
    
    console.log(`🔄 Sync complete: ${syncedCount} synced, ${failedCount} failed`)
  } catch (error) {
    console.error('❌ Sync failed:', error)
  }
}

// IndexedDB for offline queue
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SamaFactureOffline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('offline_actions')) {
        const store = db.createObjectStore('offline_actions', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// Utility functions
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  return Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName.startsWith('samafacture-')) {
        return caches.delete(cacheName)
      }
    })
  )
}

console.log('🚀 Advanced Service Worker loaded')

