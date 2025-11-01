import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Button,
	Alert,
	ScrollView,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
	CreateAnnouncementPayload,
	Department,
	Role,
	createAnnouncement,
	getDepartments,
	getRoles,
} from "../../lib/api";

export default function CreateAnnouncementScreen() {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [roles, setRoles] = useState<Role[]>([]);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
	const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
	const [userIdsRaw, setUserIdsRaw] = useState("");
	const [loadingMeta, setLoadingMeta] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		let active = true;
		const load = async () => {
			setLoadingMeta(true);
			try {
				const [rolesResp, depsResp] = await Promise.all([
					getRoles(),
					getDepartments(),
				]);
				if (!active) return;
				setRoles(rolesResp.items);
				setDepartments(depsResp.items);
			} catch (err: any) {
				Alert.alert(
					"Ошибка",
					err?.response?.data?.message ?? "Не удалось загрузить справочники"
				);
			} finally {
				if (active) setLoadingMeta(false);
			}
		};
		load();
		return () => {
			active = false;
		};
	}, []);

	const toggleRole = (id: number) => {
		setSelectedRoles((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	const toggleDepartment = (id: number) => {
		setSelectedDepartments((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
			const parts = userIdsRaw
				.split(",")
				.map((p) => p.trim())
				.filter(Boolean);
			const invalid = parts.find(
				(p) => Number.isNaN(Number(p)) || Number(p) <= 0
			);
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
		if (
			targets.roles?.length ||
			targets.departments?.length ||
			targets.users?.length
		) {
			payload.targets = targets;
		}

		try {
			setSubmitting(true);
			await createAnnouncement(payload);
			Alert.alert("Готово", "Объявление опубликовано", [
				{
					text: "Ок",
					onPress: () => router.replace("/feed"),
				},
			]);
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				err?.response?.data?.message ?? "Не удалось создать объявление"
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<ScrollView
			contentContainerStyle={{ padding: 16, gap: 16 }}
			keyboardShouldPersistTaps='handled'
		>
			<Text style={{ fontSize: 22, fontWeight: "600" }}>Новое объявление</Text>

			<View style={{ gap: 6 }}>
				<Text>Заголовок</Text>
				<TextInput
					value={title}
					onChangeText={setTitle}
					placeholder='Например: Срочное собрание'
					style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
				/>
			</View>

			<View style={{ gap: 6 }}>
				<Text>Текст</Text>
				<TextInput
					value={body}
					onChangeText={setBody}
					placeholder='Введите текст объявления'
					multiline
					numberOfLines={6}
					style={{
						borderWidth: 1,
						borderRadius: 8,
						padding: 10,
						textAlignVertical: "top",
					}}
				/>
			</View>

			<Text style={{ fontWeight: "600" }}>
				Кому отправить (необязательно)
			</Text>

			{loadingMeta ? (
				<View style={{ paddingVertical: 16 }}>
					<ActivityIndicator />
				</View>
			) : (
				<View style={{ gap: 16 }}>
					<View>
						<Text style={{ marginBottom: 6, fontWeight: "500" }}>Роли</Text>
						{roles.length ? (
							roles.map((role) => {
								const selected = selectedRoles.includes(role.id);
								return (
									<TouchableOpacity
										key={role.id}
										style={{
											padding: 10,
											borderRadius: 8,
											borderWidth: 1,
											borderColor: selected ? "#007aff" : "#cbd5e1",
											backgroundColor: selected ? "#e0f2fe" : "transparent",
											marginBottom: 8,
										}}
										onPress={() => toggleRole(role.id)}
									>
										<Text style={{ fontWeight: "500" }}>{role.name}</Text>
										<Text style={{ opacity: 0.6, fontSize: 12 }}>#{role.id}</Text>
									</TouchableOpacity>
								);
							})
						) : (
							<Text style={{ opacity: 0.6 }}>Роли не найдены</Text>
						)}
					</View>

					<View>
						<Text style={{ marginBottom: 6, fontWeight: "500" }}>Отделы</Text>
						{departments.length ? (
							departments.map((dep) => {
								const selected = selectedDepartments.includes(dep.id);
								return (
									<TouchableOpacity
										key={dep.id}
										style={{
											padding: 10,
											borderRadius: 8,
											borderWidth: 1,
											borderColor: selected ? "#007aff" : "#cbd5e1",
											backgroundColor: selected ? "#e0f2fe" : "transparent",
											marginBottom: 8,
										}}
										onPress={() => toggleDepartment(dep.id)}
									>
										<Text style={{ fontWeight: "500" }}>{dep.name}</Text>
										<Text style={{ opacity: 0.6, fontSize: 12 }}>#{dep.id}</Text>
									</TouchableOpacity>
								);
							})
						) : (
							<Text style={{ opacity: 0.6 }}>Отделы не найдены</Text>
						)}
					</View>
				</View>
			)}

			<View style={{ gap: 6 }}>
				<Text>Конкретные пользователи (ID через запятую)</Text>
				<TextInput
					value={userIdsRaw}
					onChangeText={setUserIdsRaw}
					placeholder='Например: 1, 7, 42'
					autoCapitalize='none'
					style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
				/>
				<Text style={{ opacity: 0.6, fontSize: 12 }}>
					Если оставить поля пустыми, объявление получат все, кто подходит по
					целевой аудитории (или все сотрудники при отсутствии фильтров).
				</Text>
			</View>

			<Button
				title={submitting ? "Публикуем..." : "Опубликовать"}
				onPress={onSubmit}
				disabled={submitting || loadingMeta}
			/>
		</ScrollView>
	);
}
