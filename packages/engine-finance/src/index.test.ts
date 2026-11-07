import { describe, it, expect } from "vitest";
import {
    calculateAmortization,
    calculateCompoundInterest,
    simulateExtraPayments,
    calculateCashFlowMetrics,
} from "./index.js";

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

describe("calculateCompoundInterest", () => {
    it("calculates compound interest with monthly contributions accurately", () => {
        const result = calculateCompoundInterest({
            principal: 10000,
            monthlyContribution: 500,
            annualRatePercent: 7,
            years: 10,
            compoundingFrequency: "monthly",
        });

        expect(result.totalPrincipalAndContributions).toBe(70000);
        expect(result.finalBalance).toBeGreaterThan(100000);
        expect(result.totalInterestEarned).toBeCloseTo(
            result.finalBalance - result.totalPrincipalAndContributions,
            2
        );
        expect(result.yearlyBreakdown).toHaveLength(10);
        expect(result.effectiveAnnualYieldPercent).toBeCloseTo(7.229, 2);
    });

    it("handles 0% interest rate cleanly", () => {
        const result = calculateCompoundInterest({
            principal: 5000,
            monthlyContribution: 100,
            annualRatePercent: 0,
            years: 2,
        });

        expect(result.finalBalance).toBe(7400);
        expect(result.totalInterestEarned).toBe(0);
        expect(result.effectiveAnnualYieldPercent).toBe(0);
    });
});

describe("simulateExtraPayments", () => {
    it("reduces total interest and loan term when extra payments are applied", () => {
        const result = simulateExtraPayments({
            principal: 250000,
            annualRatePercent: 6.5,
            termMonths: 360,
            extraMonthlyPayment: 300,
            oneTimeExtraPayment: 5000,
            oneTimePaymentMonth: 6,
        });

        expect(result.interestSaved).toBeGreaterThan(70000);
        expect(result.monthsSaved).toBeGreaterThan(80);
        expect(result.accelerated.payoffMonths).toBe(
            result.baseline.payoffMonths - result.monthsSaved
        );
        expect(
            result.accelerated.schedule[result.accelerated.schedule.length - 1].remainingBalance
        ).toBe(0);
    });
});

describe("calculateCashFlowMetrics", () => {
    it("calculates NPV, IRR, and interpolated payback period for an investment", () => {
        const result = calculateCashFlowMetrics({
            discountRatePercent: 10,
            cashFlows: [-10000, 3000, 4000, 5000, 6000],
        });

        expect(result.npv).toBeCloseTo(3887.71, 2);
        expect(result.irrPercent).toBeCloseTo(24.89, 1);
        expect(result.paybackPeriodPeriods).toBe(2.6);
        expect(result.totalNetCashFlow).toBe(8000);
    });
});
