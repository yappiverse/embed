"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormData {
	identifier: string;
	password: string;
}

interface ApiResponse {
	status: "T" | "F";
	message: string;
}

export default function LoginPage() {
	const [formData, setFormData] = useState<LoginFormData>({
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

			const res = await fetch("/api/password-validation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			const data: ApiResponse = await res.json();

			if (data.status === "T") {
				setMessage({ type: "success", text: data.message });
			} else {
				setMessage({ type: "error", text: data.message });
			}
		} catch {
			setMessage({
				type: "error",
				text: "Terjadi kesalahan saat menghubungi server.",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex min-h-screen items-center justify-center bg-[#F4F5FA]'>
			<div className='flex flex-col p-16 rounded-lg bg-white shadow-sm'>
				<form
					className='bg-white w-[295px] items-center rounded-lg'
					onSubmit={handleSubmit}>
					{/* Title */}
					<div className='mb-8'>
						<h1 className='text-lg font-bold text-black'>Masuk</h1>
					</div>

					{/* Message */}
					{message && (
						<div
							className={`p-3 mb-4 rounded-lg text-sm ${
								message.type === "success"
									? "bg-green-100 text-green-700 border border-green-300"
									: "bg-red-100 text-red-700 border border-red-300"
							}`}>
							{message.text}
						</div>
					)}

					{/* Username */}
					<div>
						<p className='text-[#757575] text-lg'>Username</p>
						<div className='flex items-center relative'>
							<input
								name='identifier'
								placeholder='Masukkan NPK atau Email Anda'
								value={formData.identifier}
								onChange={handleInput}
								className='w-full py-2 px-3 border rounded-lg outline-none focus:border-teksPrimary/60 disabled:bg-gray-200 disabled:text-gray-400 text-[#000000] border-gray-300'
							/>
						</div>
					</div>

					{/* Password */}
					<div className='mt-3'>
						<p className='text-[#757575] text-lg'>Password</p>
						<div className='flex items-center relative'>
							<input
								type={showPassword ? "text" : "password"}
								name='password'
								placeholder='Password'
								value={formData.password}
								onChange={handleInput}
								className='w-full py-2 px-3 border rounded-lg outline-none focus:border-teksPrimary/60 disabled:bg-gray-200 disabled:text-gray-400 text-[#000000] border-gray-300'
							/>

							<button
								type='button'
								onClick={() => setShowPassword(!showPassword)}
								className='absolute right-2 cursor-pointer bottom-[0.45rem]'>
								{showPassword ? (
									<EyeOff size={20} className='text-gray-600' />
								) : (
									<Eye size={20} className='text-gray-600' />
								)}
							</button>
						</div>
					</div>

					{/* Submit */}
					<div className='flex flex-col items-center mt-8 justify-center'>
						<button
							type='submit'
							disabled={loading}
							className='btn hover:bg-hoverPrimary btn-primary flex w-full h-12 text-white font-bold py-2 px-10 border-2 border-white focus:outline-none rounded-lg items-center justify-center bg-[#1F3273]'
							style={{ textTransform: "none", fontSize: "18px" }}>
							{loading ? "Memproses..." : "Masuk"}
						</button>

						<a
							href='/forgotpass'
							className='text-[#22356F] hover:underline mt-4 text-lg'>
							Lupa password?
						</a>
					</div>
				</form>
			</div>
		</div>
	);
}
