import { create } from "zustand";

interface LoginFormData {
	identifier: string;
	password: string;
}

interface ApiResponse {
	status: "T" | "F";
	message: string;
	hierarchical_data?: string;
	AccessLevel?: number;
}

interface LoginState {
	formData: LoginFormData;
	loading: boolean;
	message: { type: "success" | "error"; text: string } | null;

	setField: (name: string, value: string) => void;
	resetMessage: () => void;

	login: () => Promise<ApiResponse | null>;
}

export const useLoginStore = create<LoginState>((set, get) => ({
	formData: { identifier: "", password: "" },
	loading: false,
	message: null,

	setField: (name, value) =>
		set((state) => ({
			formData: { ...state.formData, [name]: value },
			message: null,
		})),

	resetMessage: () => set({ message: null }),

	login: async () => {
		const { formData } = get();

		// Simple validation
		if (!formData.identifier.trim()) {
			set({ message: { type: "error", text: "Masukkan NPK atau Email Anda" } });
			return null;
		}

		if (!formData.password.trim()) {
			set({ message: { type: "error", text: "Password wajib diisi" } });
			return null;
		}

		set({ loading: true, message: null });

		try {
			const isNumeric = /^\d+$/.test(formData.identifier);

			const requestBody = isNumeric
				? { nip: formData.identifier, password: formData.password }
				: { email: formData.identifier, password: formData.password };

			const res = await fetch("/api/password-validation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			const data: ApiResponse = await res.json();

			if (data.status === "F") {
				set({ message: { type: "error", text: data.message } });
				return null;
			}

			set({ message: { type: "success", text: data.message } });
			return data;
		} catch (error) {
			console.error(error);
			set({
				message: {
					type: "error",
					text: "Terjadi kesalahan saat menghubungi server.",
				},
			});
			return null;
		} finally {
			set({ loading: false });
		}
	},
}));
