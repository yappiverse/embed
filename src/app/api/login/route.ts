import { NextRequest, NextResponse } from "next/server";
import { DatabaseManager } from "@/lib/database-manager";
import bcrypt from "bcryptjs";

interface HierarchicalData {
	fullName: string;
	tenantId: string;
	service: string;
	categoryId: string;
	koordinatorId: string;
	tlId: string;
	agentId: string;
	accessLevel: number;
}

/** ============================
 *  getHierarchicalData - Optimized
 *  EARLY STOP for AccessLevel = 4
 * ============================ */
async function getHierarchicalData(userId: string): Promise<HierarchicalData> {
	const accountDb = DatabaseManager.getTelephonyAccountClient();
	const masterDb = DatabaseManager.getTelephonyMasterClient();

	// Fetch base user
	const user = await accountDb.mst_users.findFirst({
		where: { id_user: userId },
		select: {
			full_name: true,
			id_user: true,
			id_role: true,
			spv_id: true,
			id_tenant: true,
		},
	});

	if (!user) throw new Error("User not found");
	if (!user.full_name) throw new Error("User full_name is null");

	// Fetch ROLE FIRST (needed for early stop)
	const role = user.id_role
		? await accountDb.mst_role.findFirst({
				where: { id_role: user.id_role },
				select: { access_level: true, role_name: true },
		  })
		: null;

	const accessLevel = role?.access_level ?? 0;

	if (accessLevel === 4) {
		return {
			fullName: user.full_name,
			tenantId: "0",
			service: "0",
			categoryId: "0",
			koordinatorId: "0",
			tlId: "0",
			agentId: user.id_user,
			accessLevel,
		};
	}

	// ===============================
	// BELOW: Only runs for NON-Agent
	// ===============================

	const mapping = await accountDb.mst_user_mapping.findFirst({
		where: { id_user: userId, is_active: true },
		select: { id_category: true, id_tenant: true },
	});

	let category = null;

	if (mapping?.id_category) {
		category = await masterDb.mst_category_telephony.findFirst({
			where: { id_category: mapping.id_category, is_active: true },
			select: { service: true, id_category: true, id_tenant: true },
		});
	}

	let supervisor1: { id_user: string; spv_id: string | null } | null = null;
	// let supervisor2: { id_user: string; spv_id: string | null } | null = null;

	if (user.spv_id) {
		supervisor1 = await accountDb.mst_users.findFirst({
			where: { id_user: user.spv_id },
			select: { id_user: true, spv_id: true },
		});
	}

	const tenantId =
		mapping?.id_tenant ?? category?.id_tenant ?? user.id_tenant ?? "0";

	const service = category?.service ?? "0";
	const categoryId = category?.id_category ?? "0";

	const agentId = "0";
	let tlId = "0";
	let koordinatorId = "0";

	switch (accessLevel) {
		case 3:
			tlId = user.id_user;
			koordinatorId = supervisor1?.id_user ?? "0";
			break;

		case 2:
			koordinatorId = user.id_user;
			break;

		default:
			break;
	}

	return {
		fullName: user.full_name,
		tenantId,
		service,
		categoryId,
		koordinatorId,
		tlId,
		agentId,
		accessLevel,
	};
}

function formatHierarchy(data: HierarchicalData): string {
	return `${data.fullName} - ${data.tenantId} - ${data.service} - ${data.categoryId} - ${data.koordinatorId} - ${data.tlId} - ${data.agentId}`;
}

/** ============================
 *      POST /api/login
 * ============================ */
export async function POST(req: NextRequest) {
	try {
		const { password, nip, email } = await req.json();

		if (!nip && !email)
			return NextResponse.json(
				{ status: "F", message: "NIP atau Email wajib diisi" },
				{ status: 400 },
			);

		if (!password)
			return NextResponse.json(
				{ status: "F", message: "Password wajib diisi" },
				{ status: 400 },
			);

		const db = DatabaseManager.getTelephonyAccountClient();

		const user = await db.mst_users.findFirst({
			where: nip ? { nip } : { email },
			select: {
				full_name: true,
				id_user: true,
				nip: true,
				email: true,
				password: true,
				id_role: true,
			},
		});

		if (!user)
			return NextResponse.json(
				{ status: "F", message: "User tidak ditemukan" },
				{ status: 404 },
			);

		if (!user.password)
			return NextResponse.json(
				{ status: "F", message: "User tidak memiliki password terdaftar" },
				{ status: 400 },
			);

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch)
			return NextResponse.json(
				{ status: "F", message: "Password salah!" },
				{ status: 417 },
			);

		const hierarchicalData = await getHierarchicalData(user.id_user);

		if (hierarchicalData.accessLevel === 4) {
			return NextResponse.json(
				{
					status: "T",
					message: "Success",
					ID: user.id_user,
					Fullname: user.full_name,
					Role: user.id_role,
					AccessLevel: hierarchicalData.accessLevel,
				},
				{ status: 200 },
			);
		}

		const hierarchy = formatHierarchy(hierarchicalData);

		return NextResponse.json(
			{
				status: "T",
				message: "Success",
				ID: user.id_user,
				Fullname: user.full_name,
				Role: user.id_role,
				AccessLevel: hierarchicalData.accessLevel,
				hierarchical_data: hierarchy,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ status: "F", message: "Internal server error" },
			{ status: 500 },
		);
	}
}
