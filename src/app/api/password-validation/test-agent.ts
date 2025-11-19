async function testAgentPasswordValidation() {
	const testData = {
		nip: "3332", // Using actual NIP from database
		password: "password123", // Assuming this is the test password
	};

	console.log("=== TESTING PASSWORD VALIDATION FOR AGENT ===");
	console.log("Request data:", testData);

	try {
		const response = await fetch(
			"http://localhost:3000/api/password-validation",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(testData),
			},
		);

		const result = await response.json();
		console.log("Response status:", response.status);
		console.log("Response data:", JSON.stringify(result, null, 2));

		if (result.status === "T") {
			console.log("✅ Password validation successful");
			console.log("Hierarchical data:", result.hierarchical_data);
		} else {
			console.log("❌ Password validation failed:", result.message);
		}
	} catch (error) {
		console.error("❌ Request failed:", error);
	}
}

// Run the test
testAgentPasswordValidation();
