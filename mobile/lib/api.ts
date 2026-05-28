import axios, { AxiosHeaders } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const NATIVE_API_BASE = "http://192.168.1.9:3000";

function getWebApiBase() {
	if (typeof window === "undefined") return "http://localhost:3000";

	const hostname = window.location.hostname;
	if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
		return "http://localhost:3000";
	}

	return `http://${hostname}:3000`;
}

const API_BASE = Platform.OS === "web" ? getWebApiBase() : NATIVE_API_BASE;
export const api = axios.create({
	baseURL: API_BASE,
	headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "auth_token";

function getWebStorage() {
	if (Platform.OS !== "web" || typeof window === "undefined") return null;
	return window.localStorage;
}

export type AuthUser = {
	id: number;
	email: string;
	fullName: string;
	roleId: number;
	departmentId: number;
};

export type DetailedUser = {
	id: number;
	email: string;
	fullName: string;
	role: { id: number; name: string };
	department: { id: number; name: string };
};

export type Role = { id: number; name: string };
export type Department = { id: number; name: string };

export type AnnouncementAuthor = {
	id: number;
	fullName: string;
	email: string;
};

export type Announcement = {
	id: number;
	title: string;
	body: string;
	createdAt: string;
	updatedAt?: string;
	author: AnnouncementAuthor;
	isRead?: boolean;
};

export type Pagination = {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
};

export type AnnouncementTargetsPayload = {
	roles?: number[];
	departments?: number[];
	users?: number[];
};

export type CreateAnnouncementPayload = {
	title: string;
	body: string;
	targets?: AnnouncementTargetsPayload;
};

export async function saveToken(token: string) {
	const storage = getWebStorage();
	if (storage) {
		storage.setItem(TOKEN_KEY, token);
		return;
	}

	await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
	const storage = getWebStorage();
	if (storage) return storage.getItem(TOKEN_KEY);

	return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearToken() {
	const storage = getWebStorage();
	if (storage) {
		storage.removeItem(TOKEN_KEY);
		return;
	}

	await SecureStore.deleteItemAsync(TOKEN_KEY);
}

api.interceptors.request.use(async (config) => {
	const token = await getToken();
	if (token) {
		if (config.headers instanceof AxiosHeaders) {
			config.headers.set("Authorization", `Bearer ${token}`);
		} else {
			config.headers = {
				...(config.headers as Record<string, unknown>),
				Authorization: `Bearer ${token}`,
			} as any;
		}
	}
	return config;
});

export async function login(payload: { email: string; password: string }) {
	const { data } = await api.post("/auth/login", payload);
	return data as { token: string; user: AuthUser };
}

export async function register(payload: {
	email: string;
	password: string;
	fullName: string;
	departmentId: number;
}) {
	const { data } = await api.post("/auth/register", payload);
	return data as { token: string; user: AuthUser };
}

export async function me() {
	const { data } = await api.get("/auth/me");
	return data as { item: DetailedUser };
}

export async function getRoles() {
	const { data } = await api.get("/meta/roles");
	return data as { items: Role[] };
}

export async function getDepartments() {
	const { data } = await api.get("/meta/departments");
	return data as { items: Department[] };
}

export async function getAnnouncements(params?: {
	limit?: number;
	offset?: number;
}) {
	const { data } = await api.get("/announcements", { params });
	return data as { items: Announcement[]; pagination: Pagination };
}

export async function getAnnouncement(id: number) {
	const { data } = await api.get(`/announcements/${id}`);
	return data as { item: Announcement & { isRead: boolean } };
}

export async function createAnnouncement(payload: CreateAnnouncementPayload) {
	const { data } = await api.post("/announcements", payload);
	return data as { item: Announcement };
}

export async function updateAnnouncement(id: number, payload: CreateAnnouncementPayload) {
	const { data } = await api.patch(`/announcements/${id}`, payload);
	return data as { item: Announcement };
}

export async function markAnnouncementRead(id: number) {
	await api.post(`/announcements/${id}/read`);
}

export async function deleteAnnouncement(id: number) {
	await api.delete(`/announcements/${id}`);
}

export type AnnouncementStatsReader = {
	userId: number;
	fullName: string;
	email: string;
	department: string;
	readAt: string;
};

export type AnnouncementStats = {
	announcement: {
		id: number;
		title: string;
		author: { id: number; fullName: string };
		createdAt: string;
	};
	stats: {
		totalTargetUsers: number;
		readCount: number;
		unreadCount: number;
		readPercentage: number;
		hasTargets: boolean;
	};
	readers: AnnouncementStatsReader[];
};

export async function getAnnouncementStats(id: number) {
	const { data } = await api.get(`/announcements/${id}/stats`);
	return data as AnnouncementStats;
}

export async function healthCheck() {
	const { data } = await api.get("/health");
	return data as { status: string; time: string };
}
