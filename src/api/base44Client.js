/**
 * API Client for Backend Communication
 *
 * Base44 SDK has been removed - this file is reserved for your backend API client
 *
 * TO SET UP YOUR BACKEND CLIENT:
 *
 * Option 1: Using Axios
 * ```
 * import axios from 'axios';
 *
 * const apiClient = axios.create({
 *   baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
 *   timeout: 10000,
 * });
 *
 * apiClient.interceptors.request.use((config) => {
 *   const token = localStorage.getItem('auth_token');
 *   if (token) {
 *     config.headers.Authorization = `Bearer ${token}`;
 *   }
 *   return config;
 * });
 *
 * export default apiClient;
 * ```
 *
 * Option 2: Using Fetch API
 * ```
 * export const apiClient = {
 *   async request(endpoint, options = {}) {
 *     const token = localStorage.getItem('auth_token');
 *     const response = await fetch(
 *       `${process.env.VITE_API_BASE_URL}${endpoint}`,
 *       {
 *         ...options,
 *         headers: {
 *           'Content-Type': 'application/json',
 *           ...(token && { Authorization: `Bearer ${token}` }),
 *           ...options.headers,
 *         },
 *       }
 *     );
 *     return response.json();
 *   }
 * };
 * ```
 */

export const apiClient = null; // Replace with your backend client setup
