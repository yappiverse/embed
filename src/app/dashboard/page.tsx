"use client";

import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { guestToken, dashboardId, clearAuth, fullName, _isRehydrated } =
    useAuthStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isEmbedding, setIsEmbedding] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  useEffect(() => {
    if (!_isRehydrated) {
      return;
    }

    setIsCheckingAuth(false);

    if (!guestToken || !dashboardId) {
      router.push("/");
      return;
    }

    const mount = containerRef.current;
    if (!mount) return;

    if (mount.childElementCount > 0) return;

    (async () => {
      try {
        await embedDashboard({
          id: dashboardId,
          supersetDomain: process.env.NEXT_PUBLIC_SUPERSET_URL!,
          mountPoint: mount,
          fetchGuestToken: async () => guestToken,
          dashboardUiConfig: {
            hideTitle: true,
          },
        });

        setTimeout(() => {
          const iframe = mount.querySelector("iframe");
          if (iframe) {
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.minHeight = "100%";
            iframe.style.border = "#000";
          }
        }, 300);
      } catch (err) {
        console.error("Failed to embed dashboard:", err);
        router.push("/");
      } finally {
        setIsEmbedding(false);
      }
    })();
  }, [guestToken, dashboardId, _isRehydrated, router]);

  return (
    <div className="w-full h-screen bg-[#f7f7f7] flex flex-col">
      <div className="flex items-center justify-between p-6 flex-none bg-[#f7f7f7">
        <h2 className="text-3xl font-bold text-gray-800">
          Hi, <span className="text-blue-600">{fullName}</span>
        </h2>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {isCheckingAuth && (
        <div className="text-center py-10 text-gray-600 text-lg font-medium">
          Checking authentication...
        </div>
      )}

      {!isCheckingAuth && isEmbedding && (
        <div className="text-center py-10 text-gray-600 text-lg font-medium">
          Loading dashboard...
        </div>
      )}

      <div
        ref={containerRef}
        id="superset-container"
        className="w-full flex-1 overflow-auto p-4 rounded-4xl"
      />
    </div>
  );
}
