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
				console.log("Setting Superset credentials:", { token, dashboardId, fullName });
				set({
					guestToken: token,
					dashboardId,
					fullName,
				});
			},

			setUserCredentials: (userId, userRole, accessLevel, hierarchicalData) => {
				console.log("Setting user credentials:", { userId, userRole, accessLevel, hierarchicalData });
				set({
					userId,
					userRole,
					accessLevel,
					hierarchicalData,
				});
			},

			clearAuth: () => {
				console.log("Clearing auth credentials");
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
				console.log("Setting rehydration status:", status);
				set({ _isRehydrated: status });
			},
		}),
		{
			name: "auth-storage",
			onRehydrateStorage: () => {
				console.log("Auth store rehydration started");
				return (state, error) => {
					if (error) {
						console.error("Auth store rehydration error:", error);
						state?._setRehydrated(true);
					} else {
						console.log("Auth store rehydration completed:", state);
						state?._setRehydrated(true);
					}
				};
			},
		},
	),
);
