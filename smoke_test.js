const fs = require('fs');

async function test() {
  const data = {
    base_url: "http://localhost:5173",
    steps_structured: [
      { order: 1, action: "goto", path: "/login", description: "Mở trang login" },
      { order: 2, action: "fill", selector: "#email", value: "test@gmail.com" },
      { order: 3, action: "fill", selector: "#password", value: "123456" },
      { order: 4, action: "click", selector: "button[type=submit]" },
      { order: 5, action: "expect_url", expected: "/dashboard", description: "Redirect về dashboard" }
    ]
  };

  try {
    console.log("Creating test case...");
    const resCreate = await fetch('http://localhost:8080/api/v1/test-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const createBody = await resCreate.json();
    console.log("Create response:", createBody);
    
    if (!createBody || !createBody.data || !createBody.data.id) {
        console.log("Failed to create test case, no ID returned.");
        // If it already exists, let's just try running ID 1
        return runTest(1);
    }
    
    const testCaseId = createBody.data.id;
    console.log("Test case created with ID:", testCaseId);
    
    await runTest(testCaseId);
    
  } catch (err) {
    console.error(err);
  }
}

async function runTest(testCaseId) {
    console.log(`Starting run for test case ${testCaseId}...`);
    const resRun = await fetch(`http://localhost:8080/api/v1/test-cases/${testCaseId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const runBody = await resRun.json();
    console.log("Run response:", runBody);
    
    const runId = runBody?.data?.runId;
    if (!runId) {
        console.log("No run ID returned.");
        return;
    }
    
    console.log("Polling result for run ID:", runId);
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const resPoll = await fetch(`http://localhost:8080/api/v1/test-runs/${runId}/status`);
        const pollBody = await resPoll.json();
        const status = pollBody?.data?.status;
        console.log(`Status at poll ${i}: ${status}`);
        if (status === 'PASS' || status === 'FAIL' || status === 'ERROR') {
            console.log("Final status reached:", status);
            console.log("Details:", JSON.stringify(pollBody.data, null, 2));
            break;
        }
    }
}

test();
