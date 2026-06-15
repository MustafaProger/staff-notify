import React, { useCallback, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	ActivityIndicator,
	Alert,
	TouchableOpacity,
	SafeAreaView,
	Modal,
	Platform,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
	Announcement,
	DetailedUser,
	deleteAnnouncement,
	getApiErrorMessage,
	getAnnouncement,
	markAnnouncementRead,
	me,
} from "../../lib/api";
import { confirmAction } from "../../lib/feedback";

type AnnouncementWithStatus = Announcement & { isRead: boolean };

export default function AnnouncementDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [item, setItem] = useState<AnnouncementWithStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [marking, setMarking] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [deletePromptVisible, setDeletePromptVisible] = useState(false);
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
				getApiErrorMessage(err, "Не удалось загрузить объявление")
			);
			router.back();
		} finally {
			setLoading(false);
		}
	}, [numericId, router]);

	useFocusEffect(
		useCallback(() => {
			load();
		}, [load])
	);

	const onMarkRead = async () => {
		if (!item || item.isRead) return;
		try {
			setMarking(true);
			await markAnnouncementRead(numericId);
			setItem({ ...item, isRead: true });
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				getApiErrorMessage(err, "Не удалось отметить объявление")
			);
		} finally {
			setMarking(false);
		}
	};

	if (loading) {
		return (
			<SafeAreaView
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "#f8fafc",
				}}
			>
				<ActivityIndicator size="large" color="#6366f1" />
			</SafeAreaView>
		);
	}

	if (!item) {
		return (
			<SafeAreaView
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "#f8fafc",
				}}
			>
				<Text style={{ fontSize: 16, color: "#6b7280" }}>Объявление не найдено</Text>
			</SafeAreaView>
		);
	}

	const isAdminOrAuthor =
		profile?.role.name === "admin" || item?.author.id === profile?.id;
	const isAdmin = profile?.role.name === "admin";

	const performDelete = async () => {
		try {
			setDeleting(true);
			setDeletePromptVisible(false);
			await deleteAnnouncement(numericId);
			router.replace("/feed");
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				getApiErrorMessage(err, "Не удалось удалить объявление")
			);
		} finally {
			setDeleting(false);
		}
	};

	const onDelete = async () => {
		if (!item || deleting) return;
		if (Platform.OS === "web") {
			setDeletePromptVisible(true);
			return;
		}

		const confirmed = await confirmAction({
			title: "Удалить объявление?",
			message: `«${item.title}» будет удалено без возможности восстановления.`,
			confirmText: "Удалить",
			destructive: true,
		});
		if (!confirmed) return;

		await performDelete();
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
			<Modal
				visible={deletePromptVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setDeletePromptVisible(false)}
			>
				<View
					style={{
						flex: 1,
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "rgba(15, 23, 42, 0.45)",
						padding: 20,
					}}
				>
					<View
						style={{
							width: "100%",
							maxWidth: 420,
							backgroundColor: "#ffffff",
							borderRadius: 16,
							padding: 20,
							borderWidth: 1,
							borderColor: "#fecaca",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 8 },
							shadowOpacity: 0.18,
							shadowRadius: 18,
						}}
					>
						<Text
							style={{
								fontSize: 20,
								fontWeight: "700",
								color: "#0f172a",
								marginBottom: 8,
							}}
						>
							Удалить объявление?
						</Text>
						<Text style={{ fontSize: 15, lineHeight: 22, color: "#475569" }}>
							«{item.title}» будет удалено без возможности восстановления.
						</Text>
						<View
							style={{
								flexDirection: "row",
								justifyContent: "flex-end",
								gap: 12,
								marginTop: 20,
							}}
						>
							<TouchableOpacity
								onPress={() => setDeletePromptVisible(false)}
								disabled={deleting}
								style={{
									paddingHorizontal: 16,
									paddingVertical: 12,
									borderRadius: 10,
									backgroundColor: "#f1f5f9",
								}}
							>
								<Text style={{ color: "#334155", fontWeight: "600" }}>
									Отмена
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={performDelete}
								disabled={deleting}
								style={{
									paddingHorizontal: 16,
									paddingVertical: 12,
									borderRadius: 10,
									backgroundColor: deleting ? "#fca5a5" : "#dc2626",
								}}
							>
								<Text style={{ color: "#ffffff", fontWeight: "700" }}>
									{deleting ? "Удаление..." : "Удалить"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			<View
				style={{
					width: "100%",
					maxWidth: 820,
					alignSelf: "center",
					paddingTop: 12,
					paddingHorizontal: 16,
					paddingBottom: 8,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={{ color: "#6366f1", fontWeight: "600", fontSize: 16 }}>
						Назад
					</Text>
				</TouchableOpacity>
				<Text
					style={{
						fontSize: 18,
						fontWeight: "700",
						color: "#0f172a",
					}}
				>
					Объявление
				</Text>
				<View style={{ width: 48 }} />
			</View>

		<ScrollView
			contentContainerStyle={{
				width: "100%",
				maxWidth: 820,
				alignSelf: "center",
				padding: 16,
				gap: 20,
				backgroundColor: "#f8fafc",
			}}
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

			{/* Кнопка редактирования для админа и автора */}
			{isAdminOrAuthor && (
				<TouchableOpacity
					onPress={() => router.push(`/announcement/edit/${item.id}`)}
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
					<Text style={{ fontSize: 16, fontWeight: "600", color: "#6366f1" }}>
						Редактировать
					</Text>
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
						<Text style={{ color: "#ffffff", fontSize: 18 }}>✎</Text>
					</View>
				</TouchableOpacity>
			)}

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

			{/* Кнопка удаления внизу (только для админа) */}
			{isAdmin && (
				<TouchableOpacity
					onPress={onDelete}
					disabled={deleting}
					style={{
						backgroundColor: "#fee2e2",
						borderRadius: 16,
						padding: 16,
						borderWidth: 1,
						borderColor: "#fecaca",
						alignItems: "center",
					}}
				>
					<Text style={{ fontSize: 16, fontWeight: "600", color: "#dc2626" }}>
						{deleting ? "Удаление..." : "Удалить объявление"}
					</Text>
				</TouchableOpacity>
			)}
		</ScrollView>
		</SafeAreaView>
	);
}
