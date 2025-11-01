import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE = "http://192.168.1.10:3000"; // на реальном устройстве замени на IP твоего компа
export const api = axios.create({
	baseURL: API_BASE,
	headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "auth_token";
export async function saveToken(token: string) {
	await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
	return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearToken() {
	await SecureStore.deleteItemAsync(TOKEN_KEY);
}

api.interceptors.request.use(async (config) => {
	const token = await getToken();
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

export async function login(payload: { email: string; password: string }) {
	const { data } = await api.post("/auth/login", payload);
	return data as {
		token: string;
		user: {
			id: number;
			email: string;
			fullName: string;
			roleId: number;
			departmentId: number;
		};
	};
}
export async function me() {
	const { data } = await api.get("/auth/me");
	return data as {
		item: {
			id: number;
			email: string;
			fullName: string;
			role: { id: number; name: string };
			department: { id: number; name: string };
		};
	};
}
export async function getAnnouncements(params?: {
	limit?: number;
	offset?: number;
}) {
	const { data } = await api.get("/announcements", { params });
	return data as {
		items: Array<{
			id: number;
			title: string;
			body: string;
			createdAt: string;
			author: { id: number; fullName: string; email: string };
		}>;
		pagination: {
			total: number;
			limit: number;
			offset: number;
			hasMore: boolean;
		};
	};
}
