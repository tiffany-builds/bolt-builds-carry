import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { TimelineItem } from '../types';
import { getContextualEmoji } from '../utils/mindNudges';
import { parseDateString } from '../utils/dateFormatting';
import { supabase } from '../lib/supabase';

interface CalendarViewProps {
  userId: string;
  items: TimelineItem[];
  onBack: () => void;
  onItemComplete: (itemId: string) => void;
  onShowToast: (message: string) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: TimelineItem[];
  dateString: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Family: '#A8B89A',
  Home: '#C4714A',
  Health: '#A0B4C0',
  Errands: '#D4C285',
  Me: '#B0A8C4',
  Work: '#8B7355',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarView({ userId, items, onBack, onItemComplete, onShowToast }: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convert to Monday = 0, Sunday = 6
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: CalendarDay[] = [];

    // Add previous month's days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        items: items.filter(item => item.date === dateString && item.hasDateTime),
        dateString,
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateString === todayString,
        items: items.filter(item => item.date === dateString && item.hasDateTime),
        dateString,
      });
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        items: items.filter(item => item.date === dateString && item.hasDateTime),
        dateString,
      });
    }

    return days;
  }, [currentMonth, currentYear, items, today]);

  const selectedDayItems = useMemo(() => {
    if (!selectedDate) return [];
    return items.filter(item => item.date === selectedDate && item.hasDateTime);
  }, [selectedDate, items]);

  const lookforwardItems = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateObj = parseDateString(selectedDate);
    return items.filter(item => {
      if (item.type !== 'lookforward' || !item.start_date || !item.end_date) return false;
      const startDate = parseDateString(item.start_date);
      const endDate = parseDateString(item.end_date);
      return selectedDateObj >= startDate && selectedDateObj <= endDate;
    });
  }, [selectedDate, items]);

  const getMultiDayRanges = (day: CalendarDay) => {
    const dayDate = parseDateString(day.dateString);
    return items.filter(item => {
      if (item.type !== 'lookforward' || !item.start_date || !item.end_date) return false;
      const startDate = parseDateString(item.start_date);
      const endDate = parseDateString(item.end_date);
      return dayDate >= startDate && dayDate <= endDate;
    });
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleComplete = async (itemId: string) => {
    try {
      await supabase.from('items').update({ completed: true }).eq('id', itemId);
      onItemComplete(itemId);
      onShowToast('Done — one less thing to carry');
    } catch (err) {
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'all day';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = parseDateString(startDate);
    const end = parseDateString(endDate);
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = MONTH_NAMES[start.getMonth()].slice(0, 3);
    const endMonth = MONTH_NAMES[end.getMonth()].slice(0, 3);

    if (start.getMonth() === end.getMonth()) {
      return `${startDay}–${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
  };

  return (
    <div className="min-h-screen bg-[#E8DDD0] pb-32">
      <div className="max-w-2xl mx-auto px-5 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#FDF9F4] border border-[rgba(44,36,32,0.15)] flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-[#2C2420]" />
          </button>
          <h1 className="font-serif italic text-3xl text-[#C4714A]">Calendar</h1>
        </div>

        {/* Calendar Card */}
        <div className="bg-[#FDF9F4] rounded-[14px] border border-[rgba(44,36,32,0.08)] p-5 mb-6">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif italic text-[28px] text-[#C4714A]">
                {MONTH_NAMES[currentMonth]}
              </h2>
              <p className="text-[12px] text-[#8B7355]">{currentYear}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={goToPreviousMonth}
                className="w-9 h-9 rounded-full bg-[#FDF9F4] border border-[rgba(44,36,32,0.15)] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
              >
                <ChevronLeft size={18} className="text-[#2C2420]" />
              </button>
              <button
                onClick={goToNextMonth}
                className="w-9 h-9 rounded-full bg-[#FDF9F4] border border-[rgba(44,36,32,0.15)] flex items-center justify-center hover:bg-[#F5EDE3] transition-colors"
              >
                <ChevronRight size={18} className="text-[#2C2420]" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_LETTERS.map((letter, i) => (
              <div key={i} className="text-center text-[11px] text-[#8B7355] font-ui font-medium py-1">
                {letter}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              const hasMultiDay = getMultiDayRanges(day).length > 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.dateString)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-lg
                    transition-all
                    ${day.isToday ? 'bg-white border border-[rgba(44,36,32,0.15)]' : ''}
                    ${selectedDate === day.dateString ? 'bg-[#C4714A] bg-opacity-10' : ''}
                    ${!day.isToday && !selectedDate ? 'hover:bg-[rgba(44,36,32,0.03)]' : ''}
                    ${hasMultiDay && !day.isToday && selectedDate !== day.dateString ? 'bg-[#C4714A20]' : ''}
                  `}
                >
                  <span
                    className={`
                      text-[13px] font-ui
                      ${!day.isCurrentMonth ? 'opacity-30' : ''}
                      ${isWeekend ? 'text-[#8B7355]' : 'text-[#2C2420]'}
                    `}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Dots for items */}
                  {day.items.length > 0 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {day.items.slice(0, 3).map((item, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#8B7355' }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Panel */}
        {selectedDate && selectedDayItems.length > 0 && (
          <div className="bg-[#FDF9F4] rounded-[14px] border border-[rgba(44,36,32,0.08)] p-5 mb-4">
            <h3 className="text-sm font-ui font-medium text-[#2C2420] mb-4">
              {parseDateString(selectedDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </h3>
            <div className="space-y-3">
              {selectedDayItems.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-16 text-[12px] text-[#8B7355] font-ui pt-0.5">
                    {formatTime(item.time)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">
                        {getContextualEmoji(item.title, item.category)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-ui font-medium text-[#2C2420]">
                          {item.title}
                        </p>
                        <p className="text-[12px] text-[#8B7355] font-ui">
                          {item.category}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleComplete(item.id)}
                    className="flex-shrink-0 w-5 h-5 rounded-full border-[1.5px] border-[rgba(44,36,32,0.2)] bg-transparent flex items-center justify-center transition-all duration-200 hover:border-[#C4714A]"
                  >
                    <Check size={12} className="opacity-0" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Look Forward Banner */}
        {selectedDate && lookforwardItems.length > 0 && (
          <div className="space-y-3">
            {lookforwardItems.map(item => (
              <div
                key={item.id}
                className="bg-[#C4714A12] border border-[#C4714A30] rounded-[14px] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#C4714A20] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">✈️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-ui font-medium text-[#2C2420] mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[12px] text-[#8B7355] font-ui mb-1">
                      {item.start_date && item.end_date && formatDateRange(item.start_date, item.end_date)}
                    </p>
                    {item.excitement && (
                      <p className="text-[11px] text-[#8B7355] font-ui italic">
                        {item.excitement}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
