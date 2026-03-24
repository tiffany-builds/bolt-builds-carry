import { Category } from '../types';

export const getCategoryColor = (category: Category): string => {
  const colors: Record<Category, string> = {
    Kids: '#8BA888',
    Health: '#7BA5C8',
    Family: '#C4714A',
    Errands: '#D4A574',
    Me: '#B8A3C8',
    Ideas: '#A6968A',
    Household: '#A6968A',
    Shopping: '#D4A574',
  };
  return colors[category] || '#A6968A';
};
