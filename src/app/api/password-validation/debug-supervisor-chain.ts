import { DatabaseManager } from "@/lib/database-manager";

async function debugSupervisorChain() {
	const accountDb = DatabaseManager.getTelephonyAccountClient();

	const agentId = "INT1758789178444";

	console.log(`=== DEBUGGING SUPERVISOR CHAIN FOR AGENT: ${agentId} ===`);

	// 1. Check the agent's data
	const agent = await accountDb.mst_users.findFirst({
		where: { id_user: agentId },
		select: {
			id_user: true,
			id_role: true,
			spv_id: true,
			full_name: true,
		},
	});

	console.log("1. AGENT DATA:", agent);

	if (!agent) {
		console.log("❌ Agent not found!");
		return;
	}

	// 2. Check the agent's role and access level
	let agentRole = null;
	if (agent.id_role) {
		agentRole = await accountDb.mst_role.findFirst({
			where: { id_role: agent.id_role },
			select: {
				id_role: true,
				role_name: true,
				access_level: true,
			},
		});
	}

	console.log("2. AGENT ROLE:", agentRole);

	// 3. Check Team Leader (spv_id of agent)
	if (agent.spv_id) {
		const teamLeader = await accountDb.mst_users.findFirst({
			where: { id_user: agent.spv_id },
			select: {
				id_user: true,
				id_role: true,
				spv_id: true,
				full_name: true,
			},
		});

		console.log("3. TEAM LEADER:", teamLeader);

		if (teamLeader) {
			// Check Team Leader role
			let tlRole = null;
			if (teamLeader.id_role) {
				tlRole = await accountDb.mst_role.findFirst({
					where: { id_role: teamLeader.id_role },
					select: {
						id_role: true,
						role_name: true,
						access_level: true,
					},
				});
			}

			console.log("4. TEAM LEADER ROLE:", tlRole);

			// 4. Check Coordinator (spv_id of Team Leader)
			if (teamLeader.spv_id) {
				const coordinator = await accountDb.mst_users.findFirst({
					where: { id_user: teamLeader.spv_id },
					select: {
						id_user: true,
						id_role: true,
						spv_id: true,
						full_name: true,
					},
				});

				console.log("5. COORDINATOR:", coordinator);

				if (coordinator) {
					// Check Coordinator role
					let coordinatorRole = null;
					if (coordinator.id_role) {
						coordinatorRole = await accountDb.mst_role.findFirst({
							where: { id_role: coordinator.id_role },
							select: {
								id_role: true,
								role_name: true,
								access_level: true,
							},
						});
					}

					console.log("6. COORDINATOR ROLE:", coordinatorRole);
				} else {
					console.log(
						"❌ Coordinator not found for spv_id:",
						teamLeader.spv_id,
					);
				}
			} else {
				console.log("❌ Team Leader has no spv_id");
			}
		} else {
			console.log("❌ Team Leader not found for spv_id:", agent.spv_id);
		}
	} else {
		console.log("❌ Agent has no spv_id");
	}

	// 5. Check user mapping
	const userMapping = await accountDb.mst_user_mapping.findFirst({
		where: { id_user: agentId, is_active: true },
		select: {
			id_category: true,
			id_tenant: true,
		},
	});

	console.log("7. USER MAPPING:", userMapping);

	console.log("=== DEBUG COMPLETE ===");
}

// Run the debug function
debugSupervisorChain().catch(console.error);
