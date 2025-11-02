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
} from "react-native";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import {
	Announcement,
	DetailedUser,
	clearToken,
	getAnnouncements,
	me,
} from "../lib/api";

export default function FeedScreen() {
	const router = useRouter();
	const navigation = useNavigation();
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

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
		<View style={{ flexDirection: "row", alignItems: "center" }}>
			{profile?.role?.name !== "employee" && (
				<TouchableOpacity
					onPress={() => router.push({ pathname: "/announcements/create" })}
					style={{ marginRight: 16 }}
				>
					<Text style={{ color: "#007aff", fontWeight: "600" }}>Создать</Text>
				</TouchableOpacity>
					)}
					<TouchableOpacity onPress={handleLogout}>
						<Text style={{ color: "#ff3b30", fontWeight: "600" }}>Выйти</Text>
					</TouchableOpacity>
				</View>
			),
		});
	}, [navigation, profile, router, handleLogout]);

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
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#f8fafc",
				}}
			>
				<ActivityIndicator size="large" color="#6366f1" />
			</View>
		);
	}

		return (
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
				renderItem={({ item }) => (
					<TouchableOpacity
						onPress={() =>
							router.push({
								pathname: "/announcement/[id]",
								params: { id: String(item.id) },
							})
						}
						style={{
							backgroundColor: "#ffffff",
							borderWidth: 1,
							borderRadius: 16,
							padding: 16,
							borderColor: "#e2e8f0",
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 1 },
							shadowOpacity: 0.05,
							shadowRadius: 3,
						}}
					>
						<Text
							style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 8 }}
						>
							{item.title}
						</Text>
						<Text style={{ marginTop: 6, color: "#64748b", lineHeight: 20 }} numberOfLines={3}>
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
							<Text style={{ opacity: 0.6, fontSize: 13, color: "#64748b" }}>
								{new Date(item.createdAt).toLocaleString("ru-RU", {
									day: "numeric",
									month: "short",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</Text>
						</View>
					</TouchableOpacity>
				)}
				ListEmptyComponent={
					<Text style={{ textAlign: "center", opacity: 0.6, fontSize: 16, color: "#94a3b8" }}>
						Нет объявлений
					</Text>
				}
			/>
		);
}
