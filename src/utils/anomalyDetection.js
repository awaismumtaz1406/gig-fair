/**
 * FairGig Anomaly Detection Engine
 * 
 * Logic-based detection (not hardcoded):
 * 1. Calculate deduction % = (deductions / gross) * 100
 * 2. Compute rolling average from last N entries
 * 3. Flag if deduction > 30% OR deviation > 15% from rolling average
 */

const THRESHOLD_DEDUCTION_PCT = 30;
const THRESHOLD_DEVIATION_PCT = 15;
const ROLLING_WINDOW = 7;

/**
 * Calculate deduction percentage for a single entry
 */
export function calcDeductionPct(gross, deductions) {
  if (!gross || gross <= 0) return 0;
  return (deductions / gross) * 100;
}

/**
 * Compute rolling average deduction % from previous entries
 */
export function rollingAverageDeductionPct(entries) {
  if (!entries || entries.length === 0) return 20; // industry baseline
  const recent = entries.slice(0, ROLLING_WINDOW);
  const pcts = recent.map((e) =>
    calcDeductionPct(e.grossEarnings || (e.amount + e.deductions), e.deductions || 0)
  );
  return pcts.reduce((a, b) => a + b, 0) / pcts.length;
}

/**
 * Detect anomalies for a single entry against its history
 * Returns { isAnomaly, score, message, reasons }
 */
export function detectAnomaly(entry, history = []) {
  const gross = entry.grossEarnings || (entry.amount + entry.deductions) || 1;
  const deductions = entry.deductions || 0;
  const deductionPct = calcDeductionPct(gross, deductions);
  const avgPct = rollingAverageDeductionPct(history);
  const deviation = Math.abs(deductionPct - avgPct);
  const hourlyRate = (entry.amount || 0) / (entry.hoursWorked || 1);

  const reasons = [];
  let score = 0;

  // Rule 1: Absolute deduction threshold
  if (deductionPct > THRESHOLD_DEDUCTION_PCT) {
    reasons.push(`Deductions are ${deductionPct.toFixed(1)}% of gross — above ${THRESHOLD_DEDUCTION_PCT}% threshold`);
    score += Math.min(50, (deductionPct - THRESHOLD_DEDUCTION_PCT) * 2.5);
  }

  // Rule 2: Deviation from rolling average
  if (deviation > THRESHOLD_DEVIATION_PCT && history.length >= 2) {
    reasons.push(`${deviation.toFixed(1)}% deviation from your rolling average of ${avgPct.toFixed(1)}%`);
    score += Math.min(40, deviation * 1.5);
  }

  // Rule 3: Extremely low hourly rate
  if (hourlyRate < 200 && entry.hoursWorked > 0) {
    reasons.push(`Effective rate PKR ${hourlyRate.toFixed(0)}/hr is below minimum wage threshold`);
    score += 15;
  }

  // Rule 4: Gross-to-hours inconsistency (very high hourly might indicate data entry error)
  if (hourlyRate > 2000 && entry.hoursWorked > 0) {
    reasons.push(`Unusually high hourly rate — possible data entry error`);
    score += 10;
  }

  score = Math.min(100, Math.round(score));

  const isAnomaly = score > 20;

  let message = "";
  if (isAnomaly) {
    message = reasons.join(". ");
    if (deductionPct > 40) {
      message = `Deductions are ${deductionPct.toFixed(1)}% of gross — critical anomaly. Rolling average was ${avgPct.toFixed(1)}%. ${reasons.length > 1 ? reasons.slice(1).join(". ") : ""}`;
    } else if (deductionPct > 30) {
      message = `Deductions are ${deductionPct.toFixed(1)}% of gross — above the ${THRESHOLD_DEDUCTION_PCT}% threshold. ${reasons.length > 1 ? reasons.slice(1).join(". ") : ""}`;
    }
  }

  return { isAnomaly, score, message, reasons, deductionPct, avgPct, deviation };
}

/**
 * Generate smart alerts for a set of earnings entries
 */
export function generateAlerts(entries) {
  if (!entries || entries.length === 0) return [];

  const alerts = [];
  const recent = entries.slice(0, 5);

  // High deduction entries
  const flagged = recent.filter((e) => {
    const gross = e.grossEarnings || (e.amount + e.deductions) || 1;
    return calcDeductionPct(gross, e.deductions || 0) > 30;
  });

  if (flagged.length > 0) {
    const avgDedPct = flagged.reduce((sum, e) => {
      const gross = e.grossEarnings || (e.amount + e.deductions) || 1;
      return sum + calcDeductionPct(gross, e.deductions || 0);
    }, 0) / flagged.length;

    alerts.push({
      severity: avgDedPct > 40 ? "high" : "medium",
      message: `Deductions are ${avgDedPct.toFixed(0)}% of your gross earnings on average across ${flagged.length} recent entries. This is unusually high.`,
      recommendation: "Consider reviewing platform policies or filing a grievance if deductions seem unfair.",
    });
  }

  // Low hourly rate
  const lowHourly = recent.filter((e) => {
    const rate = (e.amount || 0) / (e.hoursWorked || 1);
    return rate < 200 && e.hoursWorked > 0;
  });
  if (lowHourly.length >= 2) {
    alerts.push({
      severity: "medium",
      message: `Your effective hourly rate is below PKR 200 on ${lowHourly.length} recent entries.`,
      recommendation: "This is below minimum wage standards. Consider switching platforms or working during peak hours.",
    });
  }

  // Pending verifications
  const pendingCount = entries.filter((e) => !e.isVerified).length;
  if (pendingCount > 3) {
    alerts.push({
      severity: "low",
      message: `${pendingCount} earnings entries are pending verification.`,
      recommendation: "Verifiers typically review entries within 24-48 hours.",
    });
  }

  return alerts;
}

/**
 * Compute platform exploitation score (0-100)
 * Higher = more exploitative
 */
export function platformExploitationScore(entries, platform) {
  const platformEntries = entries.filter((e) => e.platform === platform);
  if (platformEntries.length < 3) return null;

  const avgDedPct = platformEntries.reduce((sum, e) => {
    const gross = e.grossEarnings || (e.amount + e.deductions) || 1;
    return sum + calcDeductionPct(gross, e.deductions || 0);
  }, 0) / platformEntries.length;

  const anomalyRate = platformEntries.filter((e) => (e.anomalyScore || 0) > 30).length / platformEntries.length;
  const avgHourly = platformEntries.reduce((sum, e) => sum + ((e.amount || 0) / (e.hoursWorked || 1)), 0) / platformEntries.length;

  let score = 0;
  score += Math.min(40, avgDedPct * 1.2); // deduction weight
  score += Math.min(35, anomalyRate * 100); // anomaly rate weight
  if (avgHourly < 300) score += 25; // low pay penalty
  else if (avgHourly < 500) score += 10;

  return Math.min(100, Math.round(score));
}
