const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");

// ==============================================================================
// BUDGETBUNNY AUTOMATED TEST SUITE (Terminal Assessment)
// ==============================================================================

describe("BudgetBunny API & Security Tests", () => {
  // Clean up database connections after all tests finish
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // --------------------------------------------------------------------------
  // Test ST-01: Security - RBAC / Route Protection (GET)
  // --------------------------------------------------------------------------
  it("Should block unauthorized access to a users expenses (GET)", async () => {
    // Added a fake ID to match your /api/expenses/:userId route
    const response = await request(app).get("/api/expenses/test_user_123");

    // We expect requireAuth to intercept this and return 401 or 403
    expect(response.statusCode).toBeGreaterThanOrEqual(401);
    expect(response.statusCode).toBeLessThanOrEqual(403);
  });

  // --------------------------------------------------------------------------
  // Test ST-02: Security - Route Protection (POST)
  // --------------------------------------------------------------------------
  it("Should block unauthorized attempts to create an expense (POST)", async () => {
    const payload = {
      description: "Security Test",
      category: "food",
      amount: 50,
    };

    const response = await request(app).post("/api/expenses").send(payload);

    // Expect requireAuth to block the robot before it can post
    expect(response.statusCode).toBe(401);
  });

  // --------------------------------------------------------------------------
  // Test UT-04: Security - Headers Check (Helmet.js)
  // --------------------------------------------------------------------------
  it("Should include secure HTTP headers configured by Helmet.js", async () => {
    const response = await request(app).get("/");

    expect(response.headers["x-dns-prefetch-control"]).toBe("off");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
});
