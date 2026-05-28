import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Alert,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
	SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	CreateAnnouncementPayload,
	Department,
	Role,
	getAnnouncement,
	getDepartments,
	getRoles,
	updateAnnouncement,
} from "../../../lib/api";

type AnnouncementTarget = {
	id: number;
	announcementId: number;
	roleId: number | null;
	departmentId: number | null;
	userId: number | null;
};

export default function EditAnnouncementScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const numericId = Number(id);

	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [roles, setRoles] = useState<Role[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
	const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
	const [userIdsRaw, setUserIdsRaw] = useState("");
	const [loadingMeta, setLoadingMeta] = useState(true);
	const [loadingItem, setLoadingItem] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const loadItem = useCallback(async () => {
		if (!numericId || Number.isNaN(numericId)) {
			Alert.alert("Ошибка", "Некорректный ID");
			router.back();
			return;
		}
		setLoadingItem(true);
		try {
			const { item } = await getAnnouncement(numericId);
			setTitle(item.title);
			setBody(item.body);
			const targets = (item as any).targets as AnnouncementTarget[] | undefined;
			if (targets?.length) {
				const roleIds = targets.filter((t) => t.roleId).map((t) => t.roleId!);
				const deptIds = targets.filter((t) => t.departmentId).map((t) => t.departmentId!);
				const userIds = targets.filter((t) => t.userId).map((t) => t.userId!);
				setSelectedRoles(roleIds);
				setSelectedDepartments(deptIds);
				if (userIds.length) setUserIdsRaw(userIds.join(", "));
			}
		} catch (err: any) {
			Alert.alert("Ошибка", err?.response?.data?.message ?? "Не удалось загрузить объявление");
			router.back();
		} finally {
			setLoadingItem(false);
		}
	}, [numericId, router]);

	useEffect(() => {
		let active = true;
		const load = async () => {
			setLoadingMeta(true);
			try {
				const [rolesResp, depsResp] = await Promise.all([getRoles(), getDepartments()]);
				if (!active) return;
				setRoles(rolesResp.items);
				setDepartments(depsResp.items);
			} catch (err: any) {
				Alert.alert("Ошибка", err?.response?.data?.message ?? "Не удалось загрузить справочники");
			} finally {
				if (active) setLoadingMeta(false);
			}
		};
		load();
		return () => { active = false; };
	}, []);

	useEffect(() => {
		loadItem();
	}, [loadItem]);

	const toggleRole = (rid: number) => {
		setSelectedRoles((prev) =>
			prev.includes(rid) ? prev.filter((x) => x !== rid) : [...prev, rid]
		);
	};

	const toggleDepartment = (did: number) => {
		setSelectedDepartments((prev) =>
			prev.includes(did) ? prev.filter((x) => x !== did) : [...prev, did]
		);
	};

	const onSubmit = async () => {
		if (!title.trim()) {
			Alert.alert("Ошибка", "Введите заголовок");
			return;
		}
		if (!body.trim()) {
			Alert.alert("Ошибка", "Введите текст объявления");
			return;
		}

		let usersFromInput: number[] = [];
		if (userIdsRaw.trim()) {
			const parts = userIdsRaw.split(",").map((p) => p.trim()).filter(Boolean);
			const invalid = parts.find((p) => Number.isNaN(Number(p)) || Number(p) <= 0);
			if (invalid) {
				Alert.alert("Ошибка", `Некорректный userId: ${invalid}`);
				return;
			}
			usersFromInput = parts.map((p) => Number(p));
		}

		const payload: CreateAnnouncementPayload = {
			title: title.trim(),
			body: body.trim(),
		};
		const targets: CreateAnnouncementPayload["targets"] = {};
		if (selectedRoles.length) targets.roles = selectedRoles;
		if (selectedDepartments.length) targets.departments = selectedDepartments;
		if (usersFromInput.length) targets.users = usersFromInput;
		if (targets.roles?.length || targets.departments?.length || targets.users?.length) {
			payload.targets = targets;
		}

		try {
			setSubmitting(true);
			await updateAnnouncement(numericId, payload);
			Alert.alert("Готово", "Объявление обновлено", [
				{ text: "Ок", onPress: () => router.replace(`/announcement/${numericId}`) },
			]);
		} catch (err: any) {
			Alert.alert("Ошибка", err?.response?.data?.message ?? "Не удалось обновить объявление");
		} finally {
			setSubmitting(false);
		}
	};

	if (loadingItem || loadingMeta) {
		return (
			<SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
				<ActivityIndicator size="large" color="#6366f1" />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
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
					<Text style={{ color: "#6366f1", fontWeight: "600", fontSize: 16 }}>Назад</Text>
				</TouchableOpacity>
				<Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>Редактировать</Text>
				<View style={{ width: 48 }} />
			</View>

			<ScrollView
				contentContainerStyle={{
					width: "100%",
					maxWidth: 820,
					alignSelf: "center",
					paddingHorizontal: 24,
					paddingVertical: 24,
					gap: 24,
					backgroundColor: "#f8fafc",
				}}
				keyboardShouldPersistTaps="handled"
			>
				<View
					style={{
						backgroundColor: "#ffffff",
						borderRadius: 16,
						padding: 20,
						borderWidth: 1,
						borderColor: "#e2e8f0",
					}}
				>
					<View style={{ gap: 16 }}>
						<View style={{ gap: 8 }}>
							<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>Заголовок</Text>
							<TextInput
								value={title}
								onChangeText={setTitle}
								placeholder="Например: Срочное собрание"
								style={{
									borderWidth: 1.5,
									borderColor: "#e2e8f0",
									borderRadius: 10,
									padding: 14,
									fontSize: 16,
									backgroundColor: "#f8fafc",
								}}
							/>
						</View>
						<View style={{ gap: 8 }}>
							<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>Текст</Text>
							<TextInput
								value={body}
								onChangeText={setBody}
								placeholder="Введите текст объявления"
								multiline
								numberOfLines={6}
								style={{
									borderWidth: 1.5,
									borderColor: "#e2e8f0",
									borderRadius: 10,
									padding: 14,
									textAlignVertical: "top",
									fontSize: 16,
									backgroundColor: "#f8fafc",
									minHeight: 120,
								}}
							/>
						</View>
					</View>
				</View>

				<View
					style={{
						backgroundColor: "#ffffff",
						borderRadius: 16,
						padding: 20,
						borderWidth: 1,
						borderColor: "#e2e8f0",
					}}
				>
					<Text style={{ fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 16 }}>
						Кому отправить (необязательно)
					</Text>
					<View style={{ gap: 20 }}>
						<View>
							<Text style={{ marginBottom: 12, fontWeight: "600", color: "#64748b" }}>Роли</Text>
							<View style={{ gap: 8 }}>
								{roles.map((role) => {
									const selected = selectedRoles.includes(role.id);
									return (
										<TouchableOpacity
											key={role.id}
											style={{
												padding: 14,
												borderRadius: 10,
												borderWidth: 1.5,
												borderColor: selected ? "#6366f1" : "#e2e8f0",
												backgroundColor: selected ? "#eef2ff" : "#f8fafc",
											}}
											onPress={() => toggleRole(role.id)}
										>
											<Text style={{ fontWeight: "600", color: selected ? "#6366f1" : "#1e293b" }}>
												{role.name}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						</View>
						<View>
							<Text style={{ marginBottom: 12, fontWeight: "600", color: "#64748b" }}>Отделы</Text>
							<View style={{ gap: 8 }}>
								{departments.map((dep) => {
									const selected = selectedDepartments.includes(dep.id);
									return (
										<TouchableOpacity
											key={dep.id}
											style={{
												padding: 14,
												borderRadius: 10,
												borderWidth: 1.5,
												borderColor: selected ? "#6366f1" : "#e2e8f0",
												backgroundColor: selected ? "#eef2ff" : "#f8fafc",
											}}
											onPress={() => toggleDepartment(dep.id)}
										>
											<Text style={{ fontWeight: "600", color: selected ? "#6366f1" : "#1e293b" }}>
												{dep.name}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						</View>
						<View style={{ gap: 8 }}>
							<Text style={{ fontWeight: "600", color: "#475569" }}>
								Конкретные пользователи (ID через запятую)
							</Text>
							<TextInput
								value={userIdsRaw}
								onChangeText={setUserIdsRaw}
								placeholder="Например: 1, 7, 42"
								autoCapitalize="none"
								style={{
									borderWidth: 1.5,
									borderColor: "#e2e8f0",
									borderRadius: 10,
									padding: 14,
									fontSize: 16,
									backgroundColor: "#f8fafc",
								}}
							/>
						</View>
					</View>
				</View>

				<TouchableOpacity
					onPress={onSubmit}
					disabled={submitting}
					style={{
						backgroundColor: submitting ? "#94a3b8" : "#6366f1",
						paddingVertical: 16,
						borderRadius: 16,
						alignItems: "center",
					}}
				>
					<Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
						{submitting ? "Сохраняем..." : "Сохранить изменения"}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
