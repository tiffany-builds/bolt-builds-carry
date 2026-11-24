import { Category } from '../types';

export const getCategoryColor = (category: Category): string => {
  const colors: Record<Category, string> = {
    Family: '#8BA888',
    Health: '#7BA5C8',
    Errands: '#D4A574',
    Me: '#B8A3C8',
    Ideas: '#A6968A',
    Household: '#A6968A',
    Shopping: '#D4A574',
    Home: '#C4714A',
    Work: '#8B7355',
    Admin: '#7E8C9E',
    'Special dates': '#D9A5A0',
  };
  return colors[category] || '#A6968A';
};
