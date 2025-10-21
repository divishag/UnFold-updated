// Module: firebase.js (using custom backend API with full backend URL)

// --- Module-level variable ---
let currentUserId = null;
const API_BASE_URL = 'http://localhost:3000';  // Backend server URL

/**
 * Initializes the app and sets up authentication.
 * Replace this with real auth logic as needed.
 * Calls onAuthReady with user ID.
 */
export async function initializeFirebase(onAuthReady) {
  try {
    // Example: generate anonymous user ID or get from server
    currentUserId = `anon-${crypto.randomUUID()}`;
    console.log("Using anonymous ID:", currentUserId);
    onAuthReady(currentUserId);
  } catch (error) {
    console.error("Initialization failed:", error);
    document.getElementById('main-content').innerHTML = `<p class="text-red-400">Error loading application. Check console.</p>`;
  }
}

/**
 * Sets a listener for mind map data changes for a case.
 * Since no real-time backend here, this just fetches once.
 * Returns a no-op unsubscribe function.
 */
export function listenToMindMap(caseId, callback) {
  if (!currentUserId) return () => {};
  fetchMindMap(caseId).then(data => {
    const docSnap = {
      exists: !!data,
      data: () => data || {}
    };
    callback(docSnap);
  });
  return () => {}; // No real-time so nothing to unsubscribe
}

/**
 * Helper to fetch mind map data from backend.
 */
async function fetchMindMap(caseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mindmaps/${caseId}`, {
      credentials: 'include'
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching mind map:", error);
    return null;
  }
}

/**
 * Saves mind map data to backend.
 */
export async function saveMindMap(caseId, mindMapData) {
  if (!currentUserId || !caseId) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/mindmaps/${caseId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(mindMapData)
    });
    if (!response.ok) {
      console.error("Failed to save mind map:", response.statusText);
    }
  } catch (error) {
    console.error("Error saving mind map:", error);
  }
}
