import { DatabaseManager } from "@/lib/database-manager";

async function checkUserExists() {
	const accountDb = DatabaseManager.getTelephonyAccountClient();

	const userId = "INT1758789178444";

	console.log("=== CHECKING USER EXISTENCE ===");

	// Check by id_user
	const userById = await accountDb.mst_users.findFirst({
		where: { id_user: userId },
		select: {
			id_user: true,
			nip: true,
			email: true,
			full_name: true,
			id_role: true,
			spv_id: true,
			password: true,
		},
	});

	console.log("User by id_user:", userById);

	// Check by NIP
	const userByNip = await accountDb.mst_users.findFirst({
		where: { nip: userId },
		select: {
			id_user: true,
			nip: true,
			email: true,
			full_name: true,
			id_role: true,
			spv_id: true,
			password: true,
		},
	});

	console.log("User by NIP:", userByNip);

	// Check if there are any users with similar patterns
	const similarUsers = await accountDb.mst_users.findMany({
		where: {
			OR: [
				{ id_user: { contains: "INT1758789178444" } },
				{ nip: { contains: "INT1758789178444" } },
				{ full_name: { contains: "AgentSIT2" } },
			],
		},
		select: {
			id_user: true,
			nip: true,
			email: true,
			full_name: true,
			id_role: true,
			spv_id: true,
		},
		take: 10,
	});

	console.log("Similar users:", similarUsers);
}

checkUserExists().catch(console.error);
