import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
	guestToken: string | null;
	dashboardId: string | null;
	fullName: string | null;
	userId: string | null;
	userRole: string | null;
	accessLevel: number | null;
	hierarchicalData: string | null;
	_isRehydrated: boolean;

	setSupersetCredentials: (
		token: string,
		dashboardId: string,
		fullName: string,
	) => void;

	setUserCredentials: (
		userId: string,
		userRole: string,
		accessLevel: number,
		hierarchicalData: string,
	) => void;

	clearAuth: () => void;
	_setRehydrated: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			guestToken: null,
			dashboardId: null,
			fullName: null,
			userId: null,
			userRole: null,
			accessLevel: null,
			hierarchicalData: null,
			_isRehydrated: false,

			setSupersetCredentials: (token, dashboardId, fullName) => {
				set({
					guestToken: token,
					dashboardId,
					fullName,
				});
			},

			setUserCredentials: (userId, userRole, accessLevel, hierarchicalData) => {
				set({
					userId,
					userRole,
					accessLevel,
					hierarchicalData,
				});
			},

			clearAuth: () => {
				set({
					guestToken: null,
					dashboardId: null,
					fullName: null,
					userId: null,
					userRole: null,
					accessLevel: null,
					hierarchicalData: null,
				});
			},

			_setRehydrated: (status: boolean) => {
				set({ _isRehydrated: status });
			},
		}),
		{
			name: "auth-storage",
			onRehydrateStorage: () => {
				return (state, error) => {
					if (error) {
						state?._setRehydrated(true);
					} else {
						state?._setRehydrated(true);
					}
				};
			},
		},
	),
);
