import { DatabaseManager } from "@/lib/database-manager";

// Copy the updated getHierarchicalData function for testing
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
			id_tenant: true,
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	console.log(
		`[DEBUG] Found user: ${user.id_user}, role: ${user.id_role}, spv_id: ${user.spv_id}, id_tenant: ${user.id_tenant}`,
	);

	// Get user mapping to determine category and tenant
	const userMapping = await accountDb.mst_user_mapping.findFirst({
		where: { id_user: userId, is_active: true },
		select: {
			id_category: true,
			id_tenant: true,
		},
	});

	console.log(`[DEBUG] User mapping found:`, userMapping);

	// Initialize hierarchy values
	let tenantId = "0";
	let service = "0";
	let categoryId = "0";
	let koordinatorId = "0";
	let tlId = "0";
	let agentId = "0";

	// Get user's role with access level and role name
	let userAccessLevel = 0;
	let userRoleName = "";
	if (user.id_role) {
		const userRole = await accountDb.mst_role.findFirst({
			where: { id_role: user.id_role },
			select: { access_level: true, role_name: true },
		});
		userAccessLevel = userRole?.access_level || 0;
		userRoleName = userRole?.role_name || "";
		console.log(
			`[DEBUG] User role: ${userRoleName}, access level: ${userAccessLevel}`,
		);
	}

	// Handle tenant and service data with fallback logic
	if (userMapping) {
		// User has mapping - use existing logic
		console.log(`[DEBUG] Using user mapping data for tenant/category`);

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
	} else {
		// No user mapping found - implement fallback logic based on role
		console.log(
			`[DEBUG] No user mapping found, using fallback logic for role: ${userRoleName}`,
		);

		// Role-specific fallback logic
		if (
			userRoleName.toLowerCase().includes("tenant") ||
			user.id_role === "ROLE0007"
		) {
			// Tenant role - use their tenant ID if available
			if (user.id_tenant) {
				tenantId = user.id_tenant;
				console.log(
					`[DEBUG] Tenant role detected, using tenant ID: ${tenantId}`,
				);
			} else {
				// Try to find tenant from user ID pattern (EXT users)
				if (user.id_user.startsWith("EXT")) {
					tenantId = user.id_user;
					console.log(
						`[DEBUG] Tenant role with EXT user ID, using as tenant: ${tenantId}`,
					);
				}
			}
			// For tenant roles, set service to "ALL" or default
			service = "ALL";
		} else if (
			userRoleName.toLowerCase().includes("super admin") ||
			user.id_role === "ROLE001"
		) {
			// Super Admin role - access to all tenants
			tenantId = "ALL";
			service = "ALL";
			console.log(
				`[DEBUG] Super Admin role detected, using ALL for tenant and service`,
			);
		} else {
			// Other roles without mapping - use default values
			console.log(`[DEBUG] Other role without mapping, using default values`);
			// Try to use user's tenant if available
			if (user.id_tenant) {
				tenantId = user.id_tenant;
			}
		}
	}

	console.log(`[DEBUG] User access level: ${userAccessLevel}`);

	// Determine hierarchical structure based on access level using reverse lookup
	if (userAccessLevel === 4) {
		// Agent (access_level = 4): TENANT_ID - SERVICE - CATEGORY_ID - KOORDINATOR_ID - TL_ID - AGENT_ID
		agentId = user.id_user;
		console.log(
			`[DEBUG] Agent role detected (access_level=4). Agent ID: ${agentId}`,
		);

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
	} else if (userAccessLevel === 3) {
		// Team Leader (access_level = 3): TENANT_ID - SERVICE - CATEGORY_ID - KOORDINATOR_ID - TL_ID - 0
		tlId = user.id_user;
		console.log(
			`[DEBUG] Team Leader role detected (access_level=3). TL ID: ${tlId}`,
		);

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
	} else if (userAccessLevel === 2) {
		// Koordinator (access_level = 2): TENANT_ID - SERVICE - CATEGORY_ID - KOORDINATOR_ID - 0 - 0
		koordinatorId = user.id_user;
		console.log(
			`[DEBUG] Coordinator role detected (access_level=2). Coordinator ID: ${koordinatorId}`,
		);
	} else {
		// Default/Other roles: Use basic structure with placeholders
		// For other roles, we still populate the user's own position
		if (userAccessLevel <= 2) {
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

interface HierarchicalData {
	tenantId: string;
	service: string;
	categoryId: string;
	koordinatorId: string;
	tlId: string;
	agentId: string;
}

function formatHierarchy(data: HierarchicalData): string {
	return `${data.tenantId} - ${data.service} - ${data.categoryId} - ${data.koordinatorId} - ${data.tlId} - ${data.agentId}`;
}

async function testFallbackLogic() {
	console.log("=== TESTING FALLBACK LOGIC FOR USERS WITHOUT MAPPING ===");

	// Test cases for problematic users
	const testUsers = [
		{
			id: "EXT000369",
			description: "Tenant role (ROLE0007) - should have tenant data",
		},
		{
			id: "INT000367",
			description: "Super Admin role (ROLE001) - should have proper hierarchy",
		},
		{
			id: "INT1758789178444",
			description: "Regular agent with mapping - should work as before",
		},
	];

	for (const testUser of testUsers) {
		console.log(`\n--- Testing: ${testUser.description} ---`);
		console.log(`User ID: ${testUser.id}`);

		try {
			const result = await getHierarchicalData(testUser.id);
			const hierarchy = formatHierarchy(result);

			console.log("✅ SUCCESS");
			console.log("Hierarchical data result:", result);
			console.log("Formatted hierarchy:", hierarchy);

			// Validate specific expectations
			if (testUser.id === "EXT000369") {
				// Tenant role should have tenant data, not "0 - 0 - 0 - 0 - 0 - EXT000369"
				if (result.tenantId === "0" && result.service === "0") {
					console.log(
						"❌ ISSUE: Tenant role still returning zeros for tenant and service",
					);
				} else {
					console.log("✅ Tenant role properly handled with fallback logic");
				}
			}

			if (testUser.id === "INT000367") {
				// Super Admin should have proper hierarchy, not "0 - 0 - 0 - INT000367 - 0 - 0"
				if (result.tenantId === "0" && result.service === "0") {
					console.log(
						"❌ ISSUE: Super Admin still returning zeros for tenant and service",
					);
				} else {
					console.log("✅ Super Admin properly handled with fallback logic");
				}
			}
		} catch (error) {
			console.log("❌ ERROR:", error);
		}
	}
}

testFallbackLogic().catch(console.error);
