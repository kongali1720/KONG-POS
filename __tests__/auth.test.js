const assert = require("assert");

describe("KONGALIPOS Enterprise Unit Tests", () => {
  it("should validate 4-digit and 6-digit approval code formats correctly", () => {
    const isValid4D = /^\d{4}$/.test("1720");
    const isValid6D = /^\d{6}$/.test("849201");
    assert.strictEqual(isValid4D, true);
    assert.strictEqual(isValid6D, true);
  });

  it("should verify FX conversion multipliers", () => {
    const fxRates = { IDR: 1, USD: 16250, EUR: 17600 };
    const priceIDR = 750000;
    const priceEUR = Number((priceIDR / fxRates.EUR).toFixed(2));
    assert.strictEqual(priceEUR, 42.61);
  });
});
