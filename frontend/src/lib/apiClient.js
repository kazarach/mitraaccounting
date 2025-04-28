// apiClient.js

// const BASE_URL = "http://100.82.207.117:8000/api/";
const BASE_URL = "http://127.0.0.1:8000/api/";

function getAccessToken() {
  return localStorage.getItem('access');
}

async function apiFetch(endpoint, options = {}) {
  const url = BASE_URL + endpoint;

  const token = getAccessToken();
  if (!token) {
    alert("Session expired or not logged in. Please login again.");
    window.location.href = "/login"; // Redirect to login page
    throw new Error("No access token found.");
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const config = {
    method: options.method || "GET",
    headers: defaultHeaders,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      alert("Unauthorized access. Please login again.");
      window.location.href = "/login";
      throw new Error("Unauthorized. Please login again.");
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export default apiFetch;
