import { DatabaseManager } from "@/lib/database-manager";

// Copy the getHierarchicalData function logic here for direct testing
async function getHierarchicalData(userId: string) {
	const accountDb = DatabaseManager.getTelephonyAccountClient();
	const masterDb = DatabaseManager.getTelephonyMasterClient();

	console.log(`[DEBUG] Starting hierarchical data lookup for user: ${userId}`);

	// Get user basic information with role and supervisor
	const user = await accountDb.mst_users.findFirst({
		where: { id_user: userId },
		select: {
			id_user: true,
			id_role: true,
			spv_id: true,
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	console.log(
		`[DEBUG] Found user: ${user.id_user}, role: ${user.id_role}, spv_id: ${user.spv_id}`,
	);

	// Get user mapping to determine category and tenant
	const userMapping = await accountDb.mst_user_mapping.findFirst({
		where: { id_user: userId, is_active: true },
		select: {
			id_category: true,
			id_tenant: true,
		},
	});

	// Initialize hierarchy values
	let tenantId = "0";
	let service = "0";
	let categoryId = "0";
	let koordinatorId = "0";
	let tlId = "0";
	let agentId = "0";

	// Get category information from MASTER database to get service
	if (userMapping?.id_category) {
		const category = await masterDb.mst_category_telephony.findFirst({
			where: { id_category: userMapping.id_category, is_active: true },
			select: {
				service: true,
				id_category: true,
				id_tenant: true,
			},
		});

		if (category) {
			service = category.service || "0";
			categoryId = category.id_category || "0";
			tenantId = category.id_tenant || "0";
		}
	}

	// Override tenant from user mapping if available
	if (userMapping?.id_tenant) {
		tenantId = userMapping.id_tenant;
	}

	// Determine hierarchical structure based on role using reverse lookup
	const role = user.id_role?.toLowerCase() || "";

	if (role.includes("agent")) {
		// Agent: TENANT_ID - SERVICE - CATEGORY_ID - KOORDINATOR_ID - TL_ID - AGENT_ID
		agentId = user.id_user;
		console.log(`[DEBUG] Agent role detected. Agent ID: ${agentId}`);

		// Get supervisor (TL) information
		if (user.spv_id) {
			console.log(`[DEBUG] Looking up Team Leader with spv_id: ${user.spv_id}`);
			const tl = await accountDb.mst_users.findFirst({
				where: { id_user: user.spv_id },
				select: { id_user: true, spv_id: true, id_role: true },
			});

			if (tl) {
				console.log(
					`[DEBUG] Found Team Leader: ${tl.id_user}, role: ${tl.id_role}, spv_id: ${tl.spv_id}`,
				);
				tlId = tl.id_user;

				// Get coordinator from TL's supervisor
				if (tl.spv_id) {
					console.log(
						`[DEBUG] Looking up Coordinator with spv_id: ${tl.spv_id}`,
					);
					const koordinator = await accountDb.mst_users.findFirst({
						where: { id_user: tl.spv_id },
						select: { id_user: true, id_role: true },
					});

					if (koordinator) {
						console.log(
							`[DEBUG] Found Coordinator: ${koordinator.id_user}, role: ${koordinator.id_role}`,
						);
						koordinatorId = koordinator.id_user;
					} else {
						console.log(
							`[DEBUG] Coordinator not found for spv_id: ${tl.spv_id}`,
						);
					}
				} else {
					console.log(`[DEBUG] Team Leader has no spv_id`);
				}
			} else {
				console.log(`[DEBUG] Team Leader not found for spv_id: ${user.spv_id}`);
			}
		} else {
			console.log(`[DEBUG] Agent has no spv_id`);
		}
	} else if (role.includes("team") || role.includes("leader")) {
		// Team Leader: TENANT_ID - SERVICE - CATEGORY_ID - KOORDINATOR_ID - TL_ID - 0
		tlId = user.id_user;
		console.log(`[DEBUG] Team Leader role detected. TL ID: ${tlId}`);

		// Get coordinator from supervisor
		if (user.spv_id) {
			console.log(`[DEBUG] Looking up Coordinator with spv_id: ${user.spv_id}`);
			const koordinator = await accountDb.mst_users.findFirst({
				where: { id_user: user.spv_id },
				select: { id_user: true, id_role: true },
			});

			if (koordinator) {
				console.log(
					`[DEBUG] Found Coordinator: ${koordinator.id_user}, role: ${koordinator.id_role}`,
				);
				koordinatorId = koordinator.id_user;
			} else {
				console.log(`[DEBUG] Coordinator not found for spv_id: ${user.spv_id}`);
			}
		} else {
			console.log(`[DEBUG] Team Leader has no spv_id`);
		}
	} else if (role.includes("koordinator") || role.includes("coordinator")) {
		// Koordinator: TENANT_ID - SERVICE - CATEGORY_ID - KOORDINATOR_ID - 0 - 0
		koordinatorId = user.id_user;
		console.log(
			`[DEBUG] Coordinator role detected. Coordinator ID: ${koordinatorId}`,
		);
	} else {
		// Default/Other roles: Use basic structure with placeholders
		// For other roles, we still populate the user's own position
		if (role.includes("supervisor") || role.includes("manager")) {
			koordinatorId = user.id_user;
		} else {
			// For unknown roles, use the user's ID in the appropriate position
			agentId = user.id_user;
		}
	}

	console.log(`[DEBUG] Final hierarchy data:`, {
		tenantId,
		service,
		categoryId,
		koordinatorId,
		tlId,
		agentId,
	});

	return {
		tenantId,
		service,
		categoryId,
		koordinatorId,
		tlId,
		agentId,
	};
}

async function testHierarchyDirect() {
	console.log("=== TESTING HIERARCHY FUNCTION DIRECTLY ===");

	const agentId = "INT1758789178444";

	try {
		const result = await getHierarchicalData(agentId);
		console.log("Hierarchical data result:", result);
		console.log(
			"Formatted:",
			`${result.tenantId} - ${result.service} - ${result.categoryId} - ${result.koordinatorId} - ${result.tlId} - ${result.agentId}`,
		);
	} catch (error) {
		console.error("Error:", error);
	}
}

testHierarchyDirect().catch(console.error);
