const BASE_URL = 'http://localhost:3001/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function fetchWithAuth(endpoint: string, method: RequestMethod = 'GET', body?: any) {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    // Return null for 204 No Content, otherwise JSON
    if (response.status === 204) return null;
    return response.json();
}

export const api = {
    get: (endpoint: string) => fetchWithAuth(endpoint, 'GET'),
    post: (endpoint: string, body: any) => fetchWithAuth(endpoint, 'POST', body),
    put: (endpoint: string, body: any) => fetchWithAuth(endpoint, 'PUT', body),
    delete: (endpoint: string) => fetchWithAuth(endpoint, 'DELETE'),
};
