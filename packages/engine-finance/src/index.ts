export interface AmortizationRequest {
    principal: number;
    annualRatePercent: number;
    termMonths: number;
}

export interface AmortizationMonth {
    month: number;
    payment: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
}

export interface AmortizationResult {
    monthlyPayment: number;
    totalPrincipal: number;
    totalInterest: number;
    totalCost: number;
    schedule: AmortizationMonth[];
}

export type CompoundingFrequency = "daily" | "monthly" | "quarterly" | "annually";

export interface CompoundInterestRequest {
    principal: number;
    monthlyContribution?: number;
    annualRatePercent: number;
    years: number;
    compoundingFrequency?: CompoundingFrequency;
}

export interface CompoundInterestYear {
    year: number;
    totalContributions: number;
    interestEarned: number;
    endingBalance: number;
}

export interface CompoundInterestResult {
    finalBalance: number;
    totalPrincipalAndContributions: number;
    totalInterestEarned: number;
    effectiveAnnualYieldPercent: number;
    yearlyBreakdown: CompoundInterestYear[];
}

export interface ExtraPaymentRequest extends AmortizationRequest {
    extraMonthlyPayment?: number;
    oneTimeExtraPayment?: number;
    oneTimePaymentMonth?: number;
}

export interface ExtraPaymentComparisonResult {
    baseline: {
        monthlyPayment: number;
        totalInterest: number;
        totalCost: number;
        payoffMonths: number;
    };
    accelerated: {
        totalInterest: number;
        totalCost: number;
        payoffMonths: number;
        schedule: AmortizationMonth[];
    };
    interestSaved: number;
    monthsSaved: number;
}

export interface CashFlowRequest {
    discountRatePercent: number;
    cashFlows: number[];
}

export interface CashFlowResult {
    npv: number;
    irrPercent: number | null;
    paybackPeriodPeriods: number | null;
    totalNetCashFlow: number;
}

function roundCents(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateAmortization(params: AmortizationRequest): AmortizationResult {
    const { principal, annualRatePercent, termMonths } = params;

    if (principal <= 0 || termMonths <= 0) {
        throw new Error("Principal and term months must be greater than zero.");
    }
    if (annualRatePercent < 0) {
        throw new Error("Annual interest rate cannot be negative.");
    }

    const monthlyRate = annualRatePercent > 0 ? annualRatePercent / 100 / 12 : 0;

    let monthlyPayment: number;
    if (monthlyRate === 0) {
        monthlyPayment = roundCents(principal / termMonths);
    } else {
        const factor = Math.pow(1 + monthlyRate, termMonths);
        monthlyPayment = roundCents((principal * (monthlyRate * factor)) / (factor - 1));
    }

    const schedule: AmortizationMonth[] = [];
    let currentBalance = principal;
    let totalInterest = 0;

    for (let month = 1; month <= termMonths; month++) {
        const interestForMonth = monthlyRate === 0 ? 0 : roundCents(currentBalance * monthlyRate);
        let principalForMonth = roundCents(monthlyPayment - interestForMonth);

        // Final month adjustment to zero out residual penny discrepancies
        if (month === termMonths || currentBalance - principalForMonth < 0) {
            principalForMonth = currentBalance;
        }

        currentBalance = roundCents(currentBalance - principalForMonth);
        totalInterest = roundCents(totalInterest + interestForMonth);

        schedule.push({
            month,
            payment: roundCents(principalForMonth + interestForMonth),
            principalPaid: principalForMonth,
            interestPaid: interestForMonth,
            remainingBalance: Math.max(0, currentBalance),
        });

        if (currentBalance <= 0) break;
    }

    return {
        monthlyPayment,
        totalPrincipal: principal,
        totalInterest,
        totalCost: roundCents(principal + totalInterest),
        schedule,
    };
}

export function calculateCompoundInterest(params: CompoundInterestRequest): CompoundInterestResult {
    const {
        principal,
        monthlyContribution = 0,
        annualRatePercent,
        years,
        compoundingFrequency = "monthly",
    } = params;

    if (principal < 0 || monthlyContribution < 0) {
        throw new Error("Principal and monthly contributions cannot be negative.");
    }
    if (years <= 0 || !Number.isInteger(years)) {
        throw new Error("Years must be a positive integer.");
    }
    if (annualRatePercent < 0) {
        throw new Error("Annual rate cannot be negative.");
    }

    const periodsPerYearMap: Record<CompoundingFrequency, number> = {
        daily: 365,
        monthly: 12,
        quarterly: 4,
        annually: 1,
    };

    const n = periodsPerYearMap[compoundingFrequency];
    const r = annualRatePercent / 100;
    const effectiveAnnualYieldPercent =
        r === 0 ? 0 : Math.round((Math.pow(1 + r / n, n) - 1) * 1000000) / 10000;

    // Convert nominal rate to equivalent monthly growth factor for monthly simulation
    const monthlyGrowthRate = r === 0 ? 0 : Math.pow(1 + r / n, n / 12) - 1;

    let balance = principal;
    let totalContributed = principal;
    const yearlyBreakdown: CompoundInterestYear[] = [];

    for (let year = 1; year <= years; year++) {
        for (let m = 1; m <= 12; m++) {
            balance = balance * (1 + monthlyGrowthRate) + monthlyContribution;
            totalContributed += monthlyContribution;
        }

        const roundedBalance = roundCents(balance);
        const roundedContributions = roundCents(totalContributed);
        yearlyBreakdown.push({
            year,
            totalContributions: roundedContributions,
            interestEarned: roundCents(roundedBalance - roundedContributions),
            endingBalance: roundedBalance,
        });
    }

    const finalBalance = yearlyBreakdown[yearlyBreakdown.length - 1].endingBalance;
    const totalPrincipalAndContributions = roundCents(totalContributed);
    const totalInterestEarned = roundCents(finalBalance - totalPrincipalAndContributions);

    return {
        finalBalance,
        totalPrincipalAndContributions,
        totalInterestEarned,
        effectiveAnnualYieldPercent,
        yearlyBreakdown,
    };
}

export function simulateExtraPayments(params: ExtraPaymentRequest): ExtraPaymentComparisonResult {
    const {
        principal,
        annualRatePercent,
        termMonths,
        extraMonthlyPayment = 0,
        oneTimeExtraPayment = 0,
        oneTimePaymentMonth = 1,
    } = params;

    if (extraMonthlyPayment < 0 || oneTimeExtraPayment < 0) {
        throw new Error("Extra payments cannot be negative.");
    }

    const baselineResult = calculateAmortization({ principal, annualRatePercent, termMonths });
    const monthlyRate = annualRatePercent > 0 ? annualRatePercent / 100 / 12 : 0;
    const baseMonthlyPayment = baselineResult.monthlyPayment;

    const schedule: AmortizationMonth[] = [];
    let currentBalance = principal;
    let totalInterest = 0;

    for (let month = 1; month <= termMonths; month++) {
        const interestForMonth = monthlyRate === 0 ? 0 : roundCents(currentBalance * monthlyRate);
        const extraThisMonth =
            extraMonthlyPayment + (month === oneTimePaymentMonth ? oneTimeExtraPayment : 0);

        let principalForMonth = roundCents(baseMonthlyPayment - interestForMonth + extraThisMonth);

        if (month === termMonths || currentBalance - principalForMonth <= 0) {
            principalForMonth = currentBalance;
        }

        currentBalance = roundCents(currentBalance - principalForMonth);
        totalInterest = roundCents(totalInterest + interestForMonth);

        schedule.push({
            month,
            payment: roundCents(principalForMonth + interestForMonth),
            principalPaid: principalForMonth,
            interestPaid: interestForMonth,
            remainingBalance: Math.max(0, currentBalance),
        });

        if (currentBalance <= 0) break;
    }

    const acceleratedTotalCost = roundCents(principal + totalInterest);

    return {
        baseline: {
            monthlyPayment: baselineResult.monthlyPayment,
            totalInterest: baselineResult.totalInterest,
            totalCost: baselineResult.totalCost,
            payoffMonths: baselineResult.schedule.length,
        },
        accelerated: {
            totalInterest,
            totalCost: acceleratedTotalCost,
            payoffMonths: schedule.length,
            schedule,
        },
        interestSaved: roundCents(baselineResult.totalInterest - totalInterest),
        monthsSaved: baselineResult.schedule.length - schedule.length,
    };
}

export function calculateCashFlowMetrics(params: CashFlowRequest): CashFlowResult {
    const { discountRatePercent, cashFlows } = params;

    if (!cashFlows || cashFlows.length < 2) {
        throw new Error("At least two cash flow periods (initial + 1 return period) are required.");
    }

    const rate = discountRatePercent / 100;
    let npv = 0;
    let totalNetCashFlow = 0;

    for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + rate, t);
        totalNetCashFlow += cashFlows[t];
    }

    // Payback period calculation (interpolated)
    let cumulative = cashFlows[0];
    let paybackPeriodPeriods: number | null = cumulative >= 0 ? 0 : null;
    if (paybackPeriodPeriods === null) {
        for (let t = 1; t < cashFlows.length; t++) {
            const prevCumulative = cumulative;
            cumulative += cashFlows[t];
            if (cumulative >= 0 && cashFlows[t] > 0) {
                const fraction = Math.abs(prevCumulative) / cashFlows[t];
                paybackPeriodPeriods = roundCents(t - 1 + fraction);
                break;
            }
        }
    }

    // IRR via Newton-Raphson with bisection fallback
    let irrPercent: number | null = null;
    const hasPositive = cashFlows.some((cf) => cf > 0);
    const hasNegative = cashFlows.some((cf) => cf < 0);

    if (hasPositive && hasNegative) {
        let guess = 0.1;
        const maxIterations = 200;
        const tolerance = 1e-7;

        for (let i = 0; i < maxIterations; i++) {
            let fValue = 0;
            let fDerivative = 0;

            for (let t = 0; t < cashFlows.length; t++) {
                const denom = Math.pow(1 + guess, t);
                fValue += cashFlows[t] / denom;
                if (t > 0) {
                    fDerivative -= (t * cashFlows[t]) / Math.pow(1 + guess, t + 1);
                }
            }

            if (Math.abs(fValue) < tolerance) {
                irrPercent = roundCents(guess * 100);
                break;
            }

            if (Math.abs(fDerivative) < 1e-10) break;

            const nextGuess = guess - fValue / fDerivative;
            if (nextGuess <= -0.9999) {
                guess = -0.9;
            } else {
                guess = nextGuess;
            }
        }
    }

    return {
        npv: roundCents(npv),
        irrPercent,
        paybackPeriodPeriods,
        totalNetCashFlow: roundCents(totalNetCashFlow),
    };
}
