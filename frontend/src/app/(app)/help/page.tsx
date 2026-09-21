export default function HelpPage() {
  const items: [string, string][] = [
    ["What is review risk?",
     "A ranked signal from the model indicating how strongly the transaction resembles historical fraud patterns. It is not a fraud verdict."],
    ["What does probability mean?",
     "The model's confidence that a transaction belongs to the fraud-like class. High values indicate a stronger signal, not proof."],
    ["How are alerts generated?",
     "Transactions above the review threshold automatically create alerts in the Alert Center."],
    ["How do cases work?",
     "Cases are analyst-owned investigations. Each case tracks related transactions, notes and status changes."],
    ["What is precision and recall?",
     "Precision = fraction of flagged transactions that are truly fraud. Recall = fraction of actual fraud the model caught."],
    ["What is PR-AUC?",
     "Precision-Recall AUC is more informative than ROC-AUC when the positive class is very rare, as in fraud."],
    ["Model limitations",
     "False positives/negatives are possible. Historical patterns may not generalise. Predictions are not confirmed fraud."],
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold">Help Center</h1>
      <p className="text-muted text-sm mt-1">Understand how the platform works.</p>
      <div className="mt-6 space-y-4 max-w-3xl">
        {items.map(([q, a]) => (
          <div key={q} className="bg-surface border border-border rounded-2xl p-5">
            <div className="font-semibold">{q}</div>
            <p className="text-sm text-muted mt-2">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
