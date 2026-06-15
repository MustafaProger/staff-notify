import { Alert, Platform } from "react-native";

type ConfirmOptions = {
	title: string;
	message?: string;
	cancelText?: string;
	confirmText?: string;
	destructive?: boolean;
};

function webMessage(title: string, message?: string) {
	return message ? `${title}\n\n${message}` : title;
}

export function showMessage(title: string, message?: string) {
	if (Platform.OS === "web" && typeof window !== "undefined") {
		return Promise.resolve();
	}

	return new Promise<void>((resolve) => {
		let settled = false;
		const done = () => {
			if (settled) return;
			settled = true;
			resolve();
		};

		Alert.alert(title, message, [{ text: "Ок", onPress: done }], {
			cancelable: true,
			onDismiss: done,
		});
	});
}

export function confirmAction({
	title,
	message,
	cancelText = "Отмена",
	confirmText = "Ок",
	destructive = false,
}: ConfirmOptions) {
	if (Platform.OS === "web" && typeof window !== "undefined") {
		return Promise.resolve(window.confirm(webMessage(title, message)));
	}

	return new Promise<boolean>((resolve) => {
		let settled = false;
		const done = (value: boolean) => {
			if (settled) return;
			settled = true;
			resolve(value);
		};

		Alert.alert(
			title,
			message,
			[
				{ text: cancelText, style: "cancel", onPress: () => done(false) },
				{
					text: confirmText,
					style: destructive ? "destructive" : "default",
					onPress: () => done(true),
				},
			],
			{ cancelable: true, onDismiss: () => done(false) }
		);
	});
}
