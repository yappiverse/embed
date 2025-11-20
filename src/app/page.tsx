"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { setSupersetCredentials, setUserCredentials } = useAuthStore();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage(null);
  };

  const validate = () => {
    if (!formData.identifier.trim()) {
      setMessage({ type: "error", text: "Masukkan NPK atau Email Anda" });
      return false;
    }
    if (!formData.password.trim()) {
      setMessage({ type: "error", text: "Password wajib diisi" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMessage(null);

    try {
      const isNumeric = /^\d+$/.test(formData.identifier);
      const requestBody = isNumeric
        ? { nip: formData.identifier, password: formData.password }
        : { email: formData.identifier, password: formData.password };

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (data.status !== "T") {
        setMessage({ type: "error", text: data.message });
        return;
      }

      const level = data.AccessLevel;

      const username = level === 4 ? data.ID : data.hierarchical_data;
      const guestRes = await fetch("/api/superset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, level }),
      });

      const guestTokenData = await guestRes.json();

      if (!guestTokenData?.token) {
        setMessage({
          type: "error",
          text: "Gagal mendapatkan token Superset.",
        });
        return;
      }

      setUserCredentials(
        data.ID,
        data.Role,
        data.AccessLevel,
        data.hierarchical_data || data.ID
      );

      setSupersetCredentials(
        guestTokenData.token,
        guestTokenData.dashboardId,
        data.Fullname
      );

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Terjadi kesalahan saat menghubungi server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F5FA]">
      <div className="flex flex-col p-16 rounded-lg bg-white shadow-sm">
        <form className="bg-white w-[295px]" onSubmit={handleSubmit}>
          <h1 className="mb-8 text-lg font-bold text-black">Masuk</h1>

          {message && (
            <div
              className={`p-3 mb-4 rounded-lg text-sm border ${
                message.type === "success"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-red-100 text-red-700 border-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          <label className="text-[#757575] text-lg">
            Username
            <input
              name="identifier"
              placeholder="Masukkan NPK atau Email Anda"
              value={formData.identifier}
              onChange={handleInput}
              className="w-full py-2 px-3 border rounded-lg border-gray-300"
            />
          </label>

          <label className="block mt-3 text-[#757575] text-lg">
            Password
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInput}
                className="w-full py-2 px-3 border rounded-lg border-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 bottom-[0.45rem]"
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-gray-600" />
                ) : (
                  <Eye size={20} className="text-gray-600" />
                )}
              </button>
            </div>
          </label>

          <div className="flex flex-col items-center mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-white font-bold bg-[#1F3273] rounded-lg"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>

            <a
              href="/forgotpass"
              className="text-[#22356F] hover:underline mt-4 text-lg"
            >
              Lupa password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
