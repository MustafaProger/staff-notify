import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	RefreshControl,
	TouchableOpacity,
	Alert,
	SafeAreaView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
	Announcement,
	DetailedUser,
	clearToken,
	getAnnouncements,
	me,
} from "../lib/api";

export default function FeedScreen() {
	const router = useRouter();
	const [items, setItems] = useState<Announcement[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [profile, setProfile] = useState<DetailedUser | null>(null);

	const handleLogout = useCallback(async () => {
		await clearToken();
		router.replace("/login");
	}, [router]);

	const fetchProfile = useCallback(async () => {
		try {
			const { item } = await me();
			setProfile(item);
		} catch (err: any) {
			if (err?.response?.status === 401) {
				await clearToken();
				router.replace("/login");
			} else {
				Alert.alert(
					"Ошибка",
					err?.response?.data?.message ?? "Не удалось получить данные пользователя"
				);
			}
			throw err;
		}
	}, [router]);

	const fetchAnnouncements = useCallback(async () => {
		try {
			const data = await getAnnouncements({ limit: 20, offset: 0 });
			setItems(data.items);
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				err?.response?.data?.message ?? "Не удалось загрузить объявления"
			);
			throw err;
		}
	}, []);

	useEffect(() => {
		let active = true;
		const init = async () => {
			setLoading(true);
			try {
				await fetchProfile();
				await fetchAnnouncements();
			} catch {
				// ошибки уже показаны пользователю
			} finally {
				if (active) setLoading(false);
			}
		};
		init();
		return () => {
			active = false;
		};
	}, [fetchProfile, fetchAnnouncements]);

	const initializedRef = useRef(false);
	useFocusEffect(
		useCallback(() => {
			if (initializedRef.current) {
				fetchAnnouncements().catch(() => undefined);
			} else {
				initializedRef.current = true;
			}
		}, [fetchAnnouncements])
	);

	// заголовок теперь рисуем внутри экрана, хедер навигации скрыт

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await fetchAnnouncements();
		} catch {
			// ошибка уже показана
		} finally {
			setRefreshing(false);
		}
	}, [fetchAnnouncements]);

	if (loading) {
		return (
			<SafeAreaView
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#f8fafc",
				}}
			>
				<ActivityIndicator size="large" color="#6366f1" />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
			<View
				style={{
					paddingTop: 12,
					paddingHorizontal: 16,
					paddingBottom: 8,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Text
					style={{
						fontSize: 24,
						fontWeight: "700",
						color: "#0f172a",
					}}
				>
					Объявления
				</Text>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					{profile?.role?.name !== "employee" && (
						<TouchableOpacity
							onPress={() => router.push({ pathname: "/announcements/create" })}
							style={{
								marginRight: 8,
								paddingHorizontal: 12,
								paddingVertical: 6,
								borderRadius: 999,
								backgroundColor: "#6366f1",
							}}
						>
							<Text
								style={{
									color: "#ffffff",
									fontWeight: "600",
									fontSize: 14,
								}}
							>
								Создать
							</Text>
						</TouchableOpacity>
					)}
					<TouchableOpacity
						onPress={handleLogout}
						style={{
							paddingHorizontal: 12,
							paddingVertical: 6,
							borderRadius: 999,
							backgroundColor: "#fee2e2",
						}}
					>
						<Text
							style={{
								color: "#ef4444",
								fontWeight: "600",
								fontSize: 14,
							}}
						>
							Выйти
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			<FlatList
				data={items}
				keyExtractor={(x) => String(x.id)}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
				}
				contentContainerStyle={
					items.length
						? { padding: 16, gap: 16, backgroundColor: "#f8fafc" }
						: {
								flexGrow: 1,
								alignItems: "center",
								justifyContent: "center",
								padding: 12,
						  }
				}
				renderItem={({ item }) => {
					const isRead = Boolean(item.isRead);
					return (
						<TouchableOpacity
							onPress={() =>
								router.push({
									pathname: "/announcement/[id]",
									params: { id: String(item.id) },
								})
							}
							style={{
								backgroundColor: isRead ? "#ffffff" : "#eef2ff",
								borderWidth: 1,
								borderRadius: 16,
								padding: 16,
								borderColor: isRead ? "#e2e8f0" : "#6366f1",
								shadowColor: "#000",
								shadowOffset: { width: 0, height: 1 },
								shadowOpacity: 0.05,
								shadowRadius: 3,
							}}
						>
							<Text
								style={{
									fontSize: 18,
									fontWeight: isRead ? "600" : "700",
									color: isRead ? "#475569" : "#111827",
									marginBottom: 8,
								}}
							>
								{item.title}
							</Text>
							<Text
								style={{ marginTop: 6, color: "#64748b", lineHeight: 20 }}
								numberOfLines={3}
							>
								{item.body}
							</Text>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
									marginTop: 12,
									paddingTop: 12,
									borderTopWidth: 1,
									borderTopColor: "#f1f5f9",
								}}
							>
								<Text style={{ opacity: 0.6, fontSize: 13, color: "#64748b" }}>
									{item.author.fullName}
								</Text>
								<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
									{/* Индикатор статуса — только точка без текста */}
									<View
										style={{
											width: 10,
											height: 10,
											borderRadius: 5,
											backgroundColor: isRead ? "#cbd5f5" : "#6366f1",
										}}
									/>
									<Text style={{ opacity: 0.6, fontSize: 13, color: "#64748b" }}>
										{new Date(item.createdAt).toLocaleString("ru-RU", {
											day: "numeric",
											month: "short",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					);
				}}
				ListEmptyComponent={
					<Text style={{ textAlign: "center", opacity: 0.6, fontSize: 16, color: "#94a3b8" }}>
						Нет объявлений
					</Text>
				}
			/>
		</SafeAreaView>
	);
}
