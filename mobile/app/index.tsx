import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { getToken, me } from "../lib/api";

export default function Index() {
	const router = useRouter();
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		let active = true;
		const check = async () => {
			try {
				const token = await getToken();
				if (token) {
					await me();
					if (active) router.replace("/feed");
				} else if (active) {
					router.replace("/login");
				}
			} catch {
				if (active) router.replace("/login");
			} finally {
				if (active) setChecking(false);
			}
		};
		check();
		return () => {
			active = false;
		};
	}, [router]);

	if (!checking) return null;

	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<ActivityIndicator />
		</View>
	);
}
