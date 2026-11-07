import { describe, it, expect } from "vitest";
import { calculateAmortization } from "./index.js";

describe("calculateAmortization", () => {
    it("calculates a standard 12-month fixed loan accurately", () => {
        const result = calculateAmortization({
            principal: 10000,
            annualRatePercent: 6,
            termMonths: 12,
        });

        expect(result.monthlyPayment).toBe(860.66);
        expect(result.schedule).toHaveLength(12);
        expect(result.schedule[11].remainingBalance).toBe(0);
        expect(result.totalCost).toBe(result.totalPrincipal + result.totalInterest);
    });

    it("handles 0% interest loans without division-by-zero errors", () => {
        const result = calculateAmortization({
            principal: 1200,
            annualRatePercent: 0,
            termMonths: 12,
        });

        expect(result.monthlyPayment).toBe(100);
        expect(result.totalInterest).toBe(0);
        expect(result.schedule[11].remainingBalance).toBe(0);
    });

    it("throws an error for non-positive inputs", () => {
        expect(() =>
            calculateAmortization({
                principal: 0,
                annualRatePercent: 5,
                termMonths: 12,
            })
        ).toThrow("Principal and term months must be greater than zero.");
    });
});