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
import { AnnouncementStats, getAnnouncementStats } from "../../lib/api";

export default function AnnouncementStatsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ id?: string }>();
	const [data, setData] = useState<AnnouncementStats | null>(null);
	const [loading, setLoading] = useState(true);

	const numericId = params.id ? Number(params.id) : NaN;

	const load = useCallback(async () => {
		if (!numericId || Number.isNaN(numericId)) {
			Alert.alert("Ошибка", "Некорректный идентификатор объявления");
			router.back();
			return;
		}
		setLoading(true);
		try {
			const stats = await getAnnouncementStats(numericId);
			setData(stats);
		} catch (err: any) {
			if (err?.response?.status === 403) {
				Alert.alert("Доступ запрещен", "У вас нет прав для просмотра статистики");
			} else {
				Alert.alert(
					"Ошибка",
					err?.response?.data?.message ?? "Не удалось загрузить статистику"
				);
			}
			router.back();
		} finally {
			setLoading(false);
		}
	}, [numericId, router]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" color="#6366f1" />
			</View>
		);
	}

	if (!data) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text style={{ fontSize: 16, color: "#6b7280" }}>
					Данные не найдены
				</Text>
			</View>
		);
	}

	const { announcement, stats, readers } = data;

	return (
		<ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
			{/* Заголовок */}
			<View
				style={{
					backgroundColor: "#f8fafc",
					borderRadius: 12,
					padding: 16,
					borderWidth: 1,
					borderColor: "#e2e8f0",
				}}
			>
				<Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
					{announcement.title}
				</Text>
				<Text style={{ color: "#64748b", fontSize: 14 }}>
					Автор: {announcement.author.fullName}
				</Text>
				<Text style={{ color: "#64748b", fontSize: 14 }}>
					{new Date(announcement.createdAt).toLocaleString("ru-RU")}
				</Text>
			</View>

			{/* Статистика */}
			<View
				style={{
					backgroundColor: "#ffffff",
					borderRadius: 12,
					padding: 20,
					borderWidth: 1,
					borderColor: "#e2e8f0",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.05,
					shadowRadius: 3,
				}}
			>
				<Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
					Статистика прочтений
				</Text>

				{/* Прогресс бар */}
				<View style={{ marginBottom: 20 }}>
					<View
						style={{
							width: "100%",
							height: 12,
							backgroundColor: "#e2e8f0",
							borderRadius: 6,
							overflow: "hidden",
						}}
					>
						<View
							style={{
								width: `${stats.readPercentage}%`,
								height: "100%",
								backgroundColor: stats.readPercentage === 100 ? "#10b981" : "#6366f1",
								borderRadius: 6,
							}}
						/>
					</View>
					<Text
						style={{
							marginTop: 8,
							fontSize: 24,
							fontWeight: "700",
							color: "#1e293b",
						}}
					>
						{stats.readPercentage}%
					</Text>
				</View>

				{/* Детали */}
				<View style={{ gap: 12 }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							paddingVertical: 10,
							borderBottomWidth: 1,
							borderBottomColor: "#f1f5f9",
						}}
					>
						<Text style={{ fontSize: 16, color: "#64748b" }}>Всего получателей</Text>
						<Text style={{ fontSize: 16, fontWeight: "600", color: "#1e293b" }}>
							{stats.totalTargetUsers}
						</Text>
					</View>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							paddingVertical: 10,
							borderBottomWidth: 1,
							borderBottomColor: "#f1f5f9",
						}}
					>
						<Text style={{ fontSize: 16, color: "#10b981", fontWeight: "600" }}>
							Прочитано
						</Text>
						<Text style={{ fontSize: 16, fontWeight: "600", color: "#10b981" }}>
							{stats.readCount}
						</Text>
					</View>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							paddingVertical: 10,
						}}
					>
						<Text style={{ fontSize: 16, color: "#ef4444", fontWeight: "600" }}>
							Не прочитано
						</Text>
						<Text style={{ fontSize: 16, fontWeight: "600", color: "#ef4444" }}>
							{stats.unreadCount}
						</Text>
					</View>
				</View>
			</View>

			{/* Список читателей */}
			<View
				style={{
					backgroundColor: "#ffffff",
					borderRadius: 12,
					padding: 20,
					borderWidth: 1,
					borderColor: "#e2e8f0",
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.05,
					shadowRadius: 3,
				}}
			>
				<Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
					Прочитали ({readers.length})
				</Text>

				{readers.length > 0 ? (
					<View style={{ gap: 12 }}>
						{readers.map((reader, idx) => (
							<TouchableOpacity
								key={`${reader.userId}-${idx}`}
								style={{
									padding: 12,
									backgroundColor: "#f8fafc",
									borderRadius: 8,
									borderLeftWidth: 3,
									borderLeftColor: "#6366f1",
								}}
							>
								<Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
									{reader.fullName}
								</Text>
								<Text style={{ fontSize: 14, color: "#64748b" }}>{reader.email}</Text>
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										marginTop: 6,
									}}
								>
									<Text style={{ fontSize: 12, color: "#94a3b8" }}>
										{reader.department}
									</Text>
									<Text style={{ fontSize: 12, color: "#94a3b8" }}>
										{new Date(reader.readAt).toLocaleString("ru-RU")}
									</Text>
								</View>
							</TouchableOpacity>
						))}
					</View>
				) : (
					<Text style={{ color: "#94a3b8", textAlign: "center", fontSize: 14 }}>
						Пока никто не прочитал
					</Text>
				)}
			</View>
		</ScrollView>
	);
}

