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

export function calculateAmortization(params: AmortizationRequest): AmortizationResult {
    const { principal, annualRatePercent, termMonths } = params;

    if (principal <= 0 || termMonths <= 0) {
        throw new Error("Principal and term months must be greater than zero.");
    }

    const monthlyRate = annualRatePercent > 0 ? annualRatePercent / 100 / 12 : 0;

    let monthlyPayment: number;
    if (monthlyRate === 0) {
        monthlyPayment = Math.round((principal / termMonths) * 100) / 100;
    } else {
        const factor = Math.pow(1 + monthlyRate, termMonths);
        monthlyPayment = Math.round((principal * (monthlyRate * factor) / (factor - 1)) * 100) / 100;
    }

    const schedule: AmortizationMonth[] = [];
    let currentBalance = principal;
    let totalInterest = 0;

    for (let month = 1; month <= termMonths; month++) {
        const interestForMonth = monthlyRate === 0 ? 0 : Math.round(currentBalance * monthlyRate * 100) / 100;
        let principalForMonth = Math.round((monthlyPayment - interestForMonth) * 100) / 100;

        // Final month adjustment to zero out residual penny discrepancies
        if (month === termMonths || currentBalance - principalForMonth < 0) {
            principalForMonth = currentBalance;
        }

        currentBalance = Math.round((currentBalance - principalForMonth) * 100) / 100;
        totalInterest = Math.round((totalInterest + interestForMonth) * 100) / 100;

        schedule.push({
            month,
            payment: Math.round((principalForMonth + interestForMonth) * 100) / 100,
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
        totalCost: Math.round((principal + totalInterest) * 100) / 100,
        schedule,
    };
}