import { TimelineItem, Box, Nudge } from './types';

export const timelineItems: TimelineItem[] = [
  {
    id: '1',
    time: '9:00',
    title: 'Drop Noah at football',
    subtitle: 'Riverside Park',
    category: 'Kids',
  },
  {
    id: '2',
    time: '11:30',
    title: 'Grocery run',
    subtitle: 'Milk, bread, fruit for lunches',
    category: 'Errands',
    completed: true,
  },
  {
    id: '3',
    time: '14:00',
    title: 'Call mum',
    subtitle: 'Check in about next weekend',
    category: 'Family',
  },
  {
    id: '4',
    time: '16:30',
    title: 'Pick up Noah',
    subtitle: 'Riverside Park',
    category: 'Kids',
  },
];

export const boxes: Box[] = [
  { id: '1', name: 'Kids', emoji: '🧒', count: 7 },
  { id: '2', name: 'Household', emoji: '🏠', count: 3 },
  { id: '3', name: 'Shopping', emoji: '🛍', count: 5 },
  { id: '4', name: 'Ideas', emoji: '✈️', count: 2 },
  { id: '5', name: 'Me', emoji: '🏃‍♀️', count: 1 },
];

export const nudges: Nudge[] = [
  {
    id: '1',
    icon: '✈️',
    title: 'Visit Tiffany in France',
    suggestion: 'Still on the list — want to start thinking about dates?',
  },
  {
    id: '2',
    icon: '🎂',
    title: "Birthday gift — Noah's party",
    suggestion: "Party is in 10 days. You said you'd sort this week.",
  },
  {
    id: '3',
    icon: '📚',
    title: 'Book club next Thursday',
    suggestion: "You're 3 chapters behind — maybe tonight?",
  },
];
