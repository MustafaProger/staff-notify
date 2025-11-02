import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	ActivityIndicator,
	Alert,
	TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Announcement,
	DetailedUser,
	getAnnouncement,
	markAnnouncementRead,
	me,
} from "../../lib/api";

type AnnouncementWithStatus = Announcement & { isRead: boolean };

export default function AnnouncementDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [item, setItem] = useState<AnnouncementWithStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [marking, setMarking] = useState(false);
	const [profile, setProfile] = useState<DetailedUser | null>(null);

	const numericId = Number(id);

	const load = useCallback(async () => {
		if (!numericId || Number.isNaN(numericId)) {
			Alert.alert("Ошибка", "Некорректный идентификатор объявления");
			router.back();
			return;
		}
		setLoading(true);
		try {
			const [{ item: announcement }, { item: userProfile }] = await Promise.all([
				getAnnouncement(numericId),
				me(),
			]);
			setItem(announcement);
			setProfile(userProfile);
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				err?.response?.data?.message ?? "Не удалось загрузить объявление"
			);
			router.back();
		} finally {
			setLoading(false);
		}
	}, [numericId, router]);

	useEffect(() => {
		load();
	}, [load]);

	const onMarkRead = async () => {
		if (!item || item.isRead) return;
		try {
			setMarking(true);
			await markAnnouncementRead(numericId);
			setItem({ ...item, isRead: true });
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				err?.response?.data?.message ?? "Не удалось отметить объявление"
			);
		} finally {
			setMarking(false);
		}
	};

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "#f8fafc",
				}}
			>
				<ActivityIndicator size="large" color="#6366f1" />
			</View>
		);
	}

	if (!item) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "#f8fafc",
				}}
			>
				<Text style={{ fontSize: 16, color: "#6b7280" }}>Объявление не найдено</Text>
			</View>
		);
	}

	const isAdminOrAuthor =
		profile?.role.name === "admin" || item?.author.id === profile?.id;

	return (
		<ScrollView
			contentContainerStyle={{ padding: 16, gap: 20, backgroundColor: "#f8fafc" }}
		>
			{/* Заголовок */}
			<View
				style={{
					backgroundColor: "#ffffff",
					borderRadius: 16,
					padding: 20,
					borderWidth: 1,
					borderColor: "#e2e8f0",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.05,
					shadowRadius: 3,
				}}
			>
				<Text style={{ fontSize: 24, fontWeight: "700", color: "#1e293b", marginBottom: 12 }}>
					{item.title}
				</Text>
				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
						paddingTop: 12,
						borderTopWidth: 1,
						borderTopColor: "#f1f5f9",
					}}
				>
					<Text style={{ fontSize: 14, color: "#64748b" }}>
						{item.author.fullName}
					</Text>
					<Text style={{ fontSize: 14, color: "#64748b" }}>
						{new Date(item.createdAt).toLocaleString("ru-RU")}
					</Text>
				</View>
			</View>

			{/* Содержимое */}
			<View
				style={{
					backgroundColor: "#ffffff",
					borderWidth: 1,
					borderColor: "#e2e8f0",
					borderRadius: 16,
					padding: 20,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.05,
					shadowRadius: 3,
				}}
			>
				<Text style={{ fontSize: 16, lineHeight: 24, color: "#475569" }}>
					{item.body}
				</Text>
			</View>

			{/* Кнопка статистики для админов и авторов */}
			{isAdminOrAuthor && (
				<TouchableOpacity
					onPress={() =>
						router.push({
							pathname: "/announcement/stats",
							params: { id: String(item.id) },
						})
					}
					style={{
						backgroundColor: "#eef2ff",
						borderRadius: 16,
						padding: 16,
						borderWidth: 1,
						borderColor: "#c7d2fe",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<View>
						<Text style={{ fontSize: 16, fontWeight: "600", color: "#6366f1" }}>
							Статистика прочтений
						</Text>
						<Text style={{ fontSize: 13, color: "#818cf8", marginTop: 4 }}>
							Просмотреть прогресс
						</Text>
					</View>
					<View
						style={{
							width: 32,
							height: 32,
							borderRadius: 16,
							backgroundColor: "#6366f1",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text style={{ color: "#ffffff", fontSize: 18 }}>→</Text>
					</View>
				</TouchableOpacity>
			)}

			{/* Статус прочтения */}
			{item.isRead ? (
				<View
					style={{
						backgroundColor: "#d1fae5",
						borderRadius: 16,
						padding: 16,
						borderWidth: 1,
						borderColor: "#a7f3d0",
						flexDirection: "row",
						alignItems: "center",
					}}
				>
					<View
						style={{
							width: 32,
							height: 32,
							borderRadius: 16,
							backgroundColor: "#10b981",
							alignItems: "center",
							justifyContent: "center",
							marginRight: 12,
						}}
					>
						<Text style={{ color: "#ffffff", fontSize: 18 }}>✓</Text>
					</View>
					<Text style={{ fontSize: 15, fontWeight: "600", color: "#065f46" }}>
						Объявление прочитано
					</Text>
				</View>
			) : (
				<TouchableOpacity
					onPress={onMarkRead}
					disabled={marking}
					style={{
						backgroundColor: marking ? "#cbd5e1" : "#6366f1",
						paddingVertical: 16,
						borderRadius: 16,
						alignItems: "center",
					}}
				>
					<Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
						{marking ? "Помечаем..." : "Отметить прочитанным"}
					</Text>
				</TouchableOpacity>
			)}
		</ScrollView>
	);
}
