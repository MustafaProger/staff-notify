import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	TextInput,
	Button,
	Alert,
	ActivityIndicator,
	ScrollView,
	TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
	Department,
	getDepartments,
	me,
	register as registerRequest,
	saveToken,
} from "../lib/api";

export default function RegisterScreen() {
	const router = useRouter();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [departmentId, setDepartmentId] = useState<number | null>(null);
	const [departments, setDepartments] = useState<Department[]>([]);
	const [loadingDeps, setLoadingDeps] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		let active = true;
		const load = async () => {
			setLoadingDeps(true);
			try {
				const { items } = await getDepartments();
				if (!active) return;
				setDepartments(items);
				if (items.length) {
					setDepartmentId(items[0].id);
				}
			} catch (err: any) {
				Alert.alert(
					"Ошибка",
					err?.response?.data?.message ??
						"Не удалось загрузить список подразделений"
				);
			} finally {
				if (active) setLoadingDeps(false);
			}
		};
		load();
		return () => {
			active = false;
		};
	}, []);

	const onSubmit = async () => {
		if (submitting) return;
		if (!fullName.trim()) {
			Alert.alert("Ошибка", "Укажите полное имя");
			return;
		}
		if (!email.trim()) {
			Alert.alert("Ошибка", "Введите email");
			return;
		}
		if (password.length < 8) {
			Alert.alert("Ошибка", "Пароль должен содержать минимум 8 символов");
			return;
		}
		if (departmentId === null) {
			Alert.alert("Ошибка", "Выберите подразделение");
			return;
		}

		try {
			setSubmitting(true);
			const { token } = await registerRequest({
				email: email.trim(),
				password,
				fullName: fullName.trim(),
				departmentId,
			});
			await saveToken(token);
			await me(); // проверяем токен
			router.replace("/feed");
		} catch (err: any) {
			Alert.alert(
				"Ошибка",
				err?.response?.data?.message ?? "Не удалось зарегистрироваться"
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<ScrollView
			contentContainerStyle={{ padding: 16 }}
			keyboardShouldPersistTaps='handled'
		>
			<View style={{ gap: 12 }}>
				<Text style={{ fontSize: 22, fontWeight: "600" }}>Регистрация</Text>

				<Text>ФИО</Text>
				<TextInput
					value={fullName}
					onChangeText={setFullName}
					placeholder='Иван Иванов'
					style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
				/>

				<Text>Email</Text>
				<TextInput
					value={email}
					onChangeText={setEmail}
					autoCapitalize='none'
					keyboardType='email-address'
					placeholder='user@corp.local'
					style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
				/>

				<Text>Пароль</Text>
				<TextInput
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					placeholder='Не менее 8 символов'
					style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
				/>

				<Text>Отдел</Text>
				{loadingDeps ? (
					<View style={{ paddingVertical: 16 }}>
						<ActivityIndicator />
					</View>
				) : departments.length ? (
					<View>
						{departments.map((dep) => {
							const selected = dep.id === departmentId;
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
									onPress={() => setDepartmentId(dep.id)}
								>
									<Text style={{ fontWeight: "500" }}>{dep.name}</Text>
									<Text style={{ opacity: 0.6, fontSize: 12 }}>#{dep.id}</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				) : (
					<Text style={{ opacity: 0.7 }}>
						Нет доступных подразделений. Обратитесь к администратору.
					</Text>
				)}

				<Button
					title={submitting ? "Отправляем..." : "Создать аккаунт"}
					onPress={onSubmit}
					disabled={submitting || loadingDeps}
				/>

				<TouchableOpacity
					onPress={() => router.back()}
					disabled={submitting}
				>
					<Text style={{ color: "#007aff", textAlign: "center", marginTop: 4 }}>
						Уже есть аккаунт? Войти
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}
