import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { login, saveToken, me } from "../lib/api";

export default function LoginScreen() {
	const [email, setEmail] = useState("user1@corp.local");
	const [password, setPassword] = useState("User123!");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const onLogin = async () => {
		try {
			setLoading(true);
			const resp = await login({ email, password });
			await saveToken(resp.token);
			await me(); // проверка токена
			router.replace("/feed");
		} catch (e: any) {
			Alert.alert("Ошибка", e?.response?.data?.message ?? "Не удалось войти");
		} finally {
			setLoading(false);
		}
	};

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "#f8fafc",
				padding: 20,
				justifyContent: "center",
			}}
		>
			<View
				style={{
					backgroundColor: "#ffffff",
					borderRadius: 16,
					padding: 24,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
				}}
			>
				<Text
					style={{
						fontSize: 28,
						fontWeight: "700",
						marginBottom: 8,
						color: "#1e293b",
					}}
				>
					Добро пожаловать
				</Text>
				<Text style={{ fontSize: 16, color: "#64748b", marginBottom: 32 }}>
					Войдите в свой аккаунт
				</Text>

				<View style={{ gap: 20 }}>
					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							Email
						</Text>
						<TextInput
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							keyboardType="email-address"
							style={{
								borderWidth: 1.5,
								borderColor: "#e2e8f0",
								padding: 14,
								borderRadius: 10,
								fontSize: 16,
								backgroundColor: "#f8fafc",
							}}
						/>
					</View>

					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 14, fontWeight: "600", color: "#475569" }}>
							Пароль
						</Text>
						<TextInput
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							style={{
								borderWidth: 1.5,
								borderColor: "#e2e8f0",
								padding: 14,
								borderRadius: 10,
								fontSize: 16,
								backgroundColor: "#f8fafc",
							}}
						/>
					</View>

					<TouchableOpacity
						onPress={onLogin}
						disabled={loading}
						style={{
							backgroundColor: loading ? "#94a3b8" : "#6366f1",
							paddingVertical: 14,
							borderRadius: 10,
							alignItems: "center",
							marginTop: 8,
						}}
					>
						<Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
							{loading ? "Входим..." : "Войти"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => router.push({ pathname: "/register" })}
						disabled={loading}
						style={{ marginTop: 8 }}
					>
						<Text
							style={{
								color: "#6366f1",
								textAlign: "center",
								fontSize: 14,
								fontWeight: "500",
							}}
						>
							Нет аккаунта? Зарегистрируйтесь
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
