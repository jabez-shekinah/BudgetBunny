const mongoose = require("mongoose");
const Expense = require("../models/Expense"); // Adjust path if needed
const User = require("../models/User"); // Adjust path if needed

// ==============================================================================
// BUDGETBUNNY UNIT TEST SUITE
// Tests Mongoose Schema Validation (UT-01, UT-02)
// ==============================================================================

describe("Database Model Unit Tests", () => {
  // --------------------------------------------------------------------------
  // Test UT-01: User Model Validation
  // --------------------------------------------------------------------------
  it("Should throw a validation error if User is missing required fields", async () => {
    const user = new User({
      // Missing googleId, email, etc.
      displayName: "Test User",
    });

    let error = null;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
    expect(error.name).toBe("ValidationError");
  });

  // --------------------------------------------------------------------------
  // Test UT-02: Expense Model Validation
  // --------------------------------------------------------------------------
  it("Should reject an Expense with missing required fields", async () => {
    const expense = new Expense({
      description: "Groceries",
      // Missing amount, category, userId
    });

    let error = null;
    try {
      await expense.validate();
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();
    expect(error.errors.amount).toBeDefined(); // amount is required
  });

  // --------------------------------------------------------------------------
  // Test UT-03: Unit - Negative Amount Schema Limitation
  // --------------------------------------------------------------------------
  it("Should allow negative amounts (known limitation - no minimum validation)", async () => {
    const expense = new Expense({
      userId: new mongoose.Types.ObjectId(),
      description: "Refund",
      amount: -999,
      category: "misc",
    });

    let error = null;
    try {
      await expense.validate();
    } catch (err) {
      error = err;
    }

    // This passes — documenting that schema has no minimum amount guard
    expect(error).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Test UT-05: Unit - User Schema Email Uniqueness
  // --------------------------------------------------------------------------
  it("Should have email marked as unique in the User schema", () => {
    const emailPath = User.schema.path("email");
    expect(emailPath.options.unique).toBe(true);
  });
});
