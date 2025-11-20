import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
	guestToken: string | null;
	dashboardId: string | null;
	fullName: string | null;

	setSupersetCredentials: (
		token: string,
		dashboardId: string,
		fullName: string,
	) => void;

	clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			guestToken: null,
			dashboardId: null,
			fullName: null,

			setSupersetCredentials: (token, dashboardId, fullName) =>
				set({
					guestToken: token,
					dashboardId,
					fullName,
				}),

			clearAuth: () =>
				set({
					guestToken: null,
					dashboardId: null,
					fullName: null,
				}),
		}),
		{
			name: "auth-storage",
		},
	),
);
