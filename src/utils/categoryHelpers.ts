export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    'Errands': 'Tasks & Errands',
    'Kids': 'Kids',
    'Household': 'Household',
    'Health': 'Health',
    'Me': 'Me',
    'Ideas': 'Ideas',
    'Work': 'Work',
    'Projects': 'Projects',
    'Other': 'Other'
  };
  return names[category] || category;
}
