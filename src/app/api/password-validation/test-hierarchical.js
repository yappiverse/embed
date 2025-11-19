/**
 * Comprehensive test script for password validation API with hierarchical data
 * Tests multiple user roles and scenarios
 */

const testCases = [
	{
		name: "Agent User - agentSIT2@yopmail.com",
		email: "agentSIT2@yopmail.com",
		password: "Password1!",
		expectedStatus: "T",
		expectedMessage: "Berhasil",
		expectedFormat:
			"TENANT_ID - SERVICE - CATEGORY_ID - KOORDINATOR_ID - TL_ID - AGENT_ID",
	},
	{
		name: "Invalid Password",
		email: "agentSIT2@yopmail.com",
		password: "WrongPassword123!",
		expectedStatus: "F",
		expectedMessage: "Password salah!",
	},
	{
		name: "Non-existent User",
		email: "nonexistent@yopmail.com",
		password: "Password1!",
		expectedStatus: "F",
		expectedMessage: "User tidak ditemukan",
	},
	{
		name: "Missing Email",
		email: "",
		password: "Password1!",
		expectedStatus: "F",
		expectedMessage: "NIP atau Email wajib diisi",
	},
	{
		name: "Missing Password",
		email: "agentSIT2@yopmail.com",
		password: "",
		expectedStatus: "F",
		expectedMessage: "Password wajib diisi",
	},
];

async function runTests() {
	console.log("🧪 Testing Password Validation API with Hierarchical Data\n");
	console.log("=".repeat(80));

	let passed = 0;
	let failed = 0;

	for (const testCase of testCases) {
		console.log(`\n📋 Test: ${testCase.name}`);
		console.log("-".repeat(50));

		try {
			const response = await fetch(
				"http://localhost:3000/api/password-validation",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: testCase.email,
						password: testCase.password,
					}),
				},
			);

			const data = await response.json();

			console.log(
				`📤 Request: email=${testCase.email}, password=${testCase.password}`,
			);
			console.log(`📥 Response Status: ${response.status}`);
			console.log(`📥 Response Body:`, JSON.stringify(data, null, 2));

			// Validate response
			let testPassed = true;
			let errorMessages = [];

			// Check status
			if (data.status !== testCase.expectedStatus) {
				testPassed = false;
				errorMessages.push(
					`Expected status "${testCase.expectedStatus}" but got "${data.status}"`,
				);
			}

			// Check message
			if (data.message !== testCase.expectedMessage) {
				testPassed = false;
				errorMessages.push(
					`Expected message "${testCase.expectedMessage}" but got "${data.message}"`,
				);
			}

			// Check hierarchical data format for successful cases
			if (testCase.expectedStatus === "T" && data.status === "T") {
				if (!data.hierarchical_data) {
					testPassed = false;
					errorMessages.push(
						"Missing hierarchical_data field in successful response",
					);
				} else {
					const parts = data.hierarchical_data.split(" - ");
					if (parts.length !== 6) {
						testPassed = false;
						errorMessages.push(
							`Expected 6 parts in hierarchical data but got ${parts.length}: "${data.hierarchical_data}"`,
						);
					} else {
						console.log(
							`✅ Hierarchical Data Format: ${data.hierarchical_data}`,
						);
						console.log(`   - Tenant ID: ${parts[0]}`);
						console.log(`   - Service: ${parts[1]}`);
						console.log(`   - Category ID: ${parts[2]}`);
						console.log(`   - Koordinator ID: ${parts[3]}`);
						console.log(`   - Team Leader ID: ${parts[4]}`);
						console.log(`   - Agent ID: ${parts[5]}`);
					}
				}
			}

			if (testPassed) {
				console.log("✅ TEST PASSED");
				passed++;
			} else {
				console.log("❌ TEST FAILED");
				errorMessages.forEach((msg) => console.log(`   - ${msg}`));
				failed++;
			}
		} catch (error) {
			console.log("❌ TEST FAILED - Network/Server Error");
			console.log(`   - Error: ${error.message}`);
			failed++;
		}
	}

	console.log("\n" + "=".repeat(80));
	console.log("📊 TEST SUMMARY");
	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	console.log(
		`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`,
	);

	if (failed === 0) {
		console.log(
			"\n🎉 All tests passed! The hierarchical data implementation is working correctly.",
		);
	} else {
		console.log("\n⚠️ Some tests failed. Please review the implementation.");
	}
}

// Run the tests
runTests().catch(console.error);
