import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { password, nip, email } = body;

		if (!nip && !email) {
			return NextResponse.json(
				{ status: "F", message: "NIP atau Email wajib diisi" },
				{ status: 400 },
			);
		}

		if (!password) {
			return NextResponse.json(
				{ status: "F", message: "Password wajib diisi" },
				{ status: 400 },
			);
		}

		let user = null;

		if (nip) {
			user = await prisma.mst_users.findFirst({
				where: { nip: nip },
			});
		} else if (email) {
			user = await prisma.mst_users.findFirst({
				where: { email: email },
			});
		}

		if (!user) {
			return NextResponse.json(
				{ status: "F", message: "User tidak ditemukan" },
				{ status: 404 },
			);
		}

		const isMatch = await bcrypt.compare(password, user.password ?? "");

		if (isMatch) {
			return NextResponse.json(
				{ status: "T", message: "Berhasil" },
				{ status: 200 },
			);
		} else {
			return NextResponse.json(
				{ status: "F", message: "Password salah!" },
				{ status: 417 },
			);
		}
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ status: "F", message: "Internal server error" },
			{ status: 500 },
		);
	}
}
