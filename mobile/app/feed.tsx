import React from "react";
import { useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { getAnnouncements } from "../lib/api";

type Ann = {
	id: number;
	title: string;
	body: string;
	createdAt: string;
	author: { id: number; fullName: string; email: string };
};

export default function FeedScreen() {
	const [items, setItems] = useState<Ann[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const load = async () => {
		setLoading(true);
		try {
			const data = await getAnnouncements({ limit: 20, offset: 0 });
			setItems(data.items);
		} finally {
			setLoading(false);
		}
	};
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await load();
		} finally {
			setRefreshing(false);
		}
	};
	useEffect(() => {
		load();
	}, []);

	if (loading)
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator />
			</View>
		);

	return (
		<FlatList
			data={items}
			keyExtractor={(x) => String(x.id)}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
				/>
			}
			contentContainerStyle={{ padding: 12, gap: 12 }}
			renderItem={({ item }) => (
				<View style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}>
					<Text style={{ fontSize: 16, fontWeight: "600" }}>{item.title}</Text>
					<Text style={{ marginTop: 6 }}>{item.body}</Text>
					<Text style={{ marginTop: 8, opacity: 0.6 }}>
						Автор: {item.author.fullName} •{" "}
						{new Date(item.createdAt).toLocaleString()}
					</Text>
				</View>
			)}
			ListEmptyComponent={
				<Text style={{ textAlign: "center", marginTop: 40 }}>
					Нет объявлений
				</Text>
			}
		/>
	);
}
