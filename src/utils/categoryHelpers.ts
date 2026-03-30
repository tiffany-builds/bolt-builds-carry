export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    'Errands': 'Tasks & Errands',
    'Family': 'Family',
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
