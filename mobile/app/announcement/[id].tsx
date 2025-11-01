import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	ActivityIndicator,
	Button,
	Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Announcement,
	getAnnouncement,
	markAnnouncementRead,
} from "../../lib/api";

type AnnouncementWithStatus = Announcement & { isRead: boolean };

export default function AnnouncementDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [item, setItem] = useState<AnnouncementWithStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [marking, setMarking] = useState(false);

	const numericId = Number(id);

	const load = useCallback(async () => {
		if (!numericId || Number.isNaN(numericId)) {
			Alert.alert("Ошибка", "Некорректный идентификатор объявления");
			router.back();
			return;
		}
		setLoading(true);
		try {
			const { item: announcement } = await getAnnouncement(numericId);
			setItem(announcement);
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
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator />
			</View>
		);
	}

	if (!item) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text>Объявление не найдено</Text>
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
			<View>
				<Text style={{ fontSize: 24, fontWeight: "700" }}>{item.title}</Text>
				<Text style={{ marginTop: 8, opacity: 0.6 }}>
					Автор: {item.author.fullName} •{" "}
					{new Date(item.createdAt).toLocaleString()}
				</Text>
			</View>
			<View style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12 }}>
				<Text style={{ padding: 16, fontSize: 16, lineHeight: 22 }}>
					{item.body}
				</Text>
			</View>
			<Text style={{ fontWeight: "600" }}>
				Статус: {item.isRead ? "прочитано" : "непрочитано"}
			</Text>
			{!item.isRead && (
				<Button
					title={marking ? "Помечаем..." : "Отметить прочитанным"}
					onPress={onMarkRead}
					disabled={marking}
				/>
			)}
		</ScrollView>
	);
}
