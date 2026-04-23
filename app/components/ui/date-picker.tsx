"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerProps) {
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = React.useState<Date>(date || new Date(2000, 0));

  // Generate years from 1920 to current year
  const years = React.useMemo(() => {
    const result = [];
    for (let year = currentYear; year >= 1920; year--) {
      result.push(year);
    }
    return result;
  }, [currentYear]);

  const handleMonthChange = (newMonth: string) => {
    const monthIndex = MONTHS.indexOf(newMonth);
    const newDate = new Date(month.getFullYear(), monthIndex, 1);
    setMonth(newDate);
  };

  const handleYearChange = (newYear: string) => {
    const newDate = new Date(parseInt(newYear), month.getMonth(), 1);
    setMonth(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-background/50 border border-border/60 rounded-lg hover:bg-background/70 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <div className="p-3 space-y-3">
          {/* Month and Year Selectors */}
          <div className="flex items-center justify-center gap-2">
            {/* Month Dropdown */}
            <Select
              value={MONTHS[month.getMonth()]}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Dropdown */}
            <Select
              value={month.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[90px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calendar - hide built-in navigation */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            month={month}
            onMonthChange={setMonth}
            initialFocus
            disabled={disabled}
            classNames={{
              caption: "hidden",
              nav: "hidden",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
