import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
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
		<View style={{ padding: 16, gap: 12 }}>
			<Text style={{ fontSize: 22, fontWeight: "600" }}>Вход</Text>
			<Text>Email</Text>
			<TextInput
				value={email}
				onChangeText={setEmail}
				autoCapitalize='none'
				keyboardType='email-address'
				style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
			/>
			<Text>Пароль</Text>
			<TextInput
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
			/>
			<Button
				title={loading ? "Входим..." : "Войти"}
				onPress={onLogin}
				disabled={loading}
			/>
		</View>
	);
}
