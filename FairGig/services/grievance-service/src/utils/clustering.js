export const keywordMap = {
  "Payment Issues": ["late payment", "not paid", "delay", "pending", "missing payment", "withheld"],
  "Platform Issues": ["banned", "account suspended", "locked", "blocked", "deactivated"],
  "Rating Manipulation": ["unfair rating", "fake review", "rating dropped", "wrong score"],
  "Safety Concerns": ["harassment", "unsafe", "threat", "abuse", "dangerous"],
  "Technical Issues": ["app crash", "gps wrong", "glitch", "bug", "not working"],
  "Unfair Deductions": ["deducted", "fined", "charged", "penalty", "deduction"]
};

export function clusterComplaint(text) {
  const normalized = text.toLowerCase();
  for (const [label, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return label;
    }
  }
  return "General Complaint";
}

export function extractTags(text) {
  const normalized = text.toLowerCase();
  const tags = [];
  for (const keywords of Object.values(keywordMap)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        tags.push(keyword);
      }
    }
  }
  return [...new Set(tags)];
}
