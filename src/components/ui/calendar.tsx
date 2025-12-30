"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import * as React from "react";
import {
  DayButton,
  DayPicker,
  getDefaultClassNames,
  type DropdownProps,
} from "react-day-picker";

import { BaseButton, Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MonthsDropdown = (props: DropdownProps) => {
  const [open, setOpen] = React.useState(false);

  const currentValue =
    props.value !== undefined ? Number(props.value) : new Date().getMonth();

  const months = [
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

  const currentMonthName = months[currentValue];

  const handleMonthSelect = (monthIndex: number) => {
    if (props.onChange) {
      const event = {
        target: { value: monthIndex.toString() },
      } as React.ChangeEvent<HTMLSelectElement>;
      props.onChange(event);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 gap-1 px-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {currentMonthName}
          <ChevronDownIcon className="size-4 text-zinc-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-3 gap-1">
          {months.map((month, index) => {
            const isSelected = index === currentValue;
            const option = props.options?.find((opt) => opt.value === index);
            const isDisabled = option?.disabled;

            return (
              <Button
                key={month}
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                onClick={() => handleMonthSelect(index)}
                className={cn(
                  "h-9 text-sm font-normal hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800",
                  isSelected && "bg-zinc-100 font-medium dark:bg-zinc-800"
                )}
              >
                {month}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const YearsDropdown = (props: DropdownProps) => {
  const [open, setOpen] = React.useState(false);

  const currentValue =
    props.value !== undefined ? Number(props.value) : new Date().getFullYear();

  const years = props.options?.map((opt) => Number(opt.value)) ?? [];

  const handleYearSelect = (year: number) => {
    if (props.onChange) {
      const event = {
        target: { value: year.toString() },
      } as React.ChangeEvent<HTMLSelectElement>;
      props.onChange(event);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 gap-1 px-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {currentValue}
          <ChevronDownIcon className="size-4 text-zinc-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="grid max-h-64 grid-cols-3 gap-1 overflow-y-auto">
          {years.map((year) => {
            const isSelected = year === currentValue;
            const option = props.options?.find((opt) => opt.value === year);
            const isDisabled = option?.disabled;

            return (
              <Button
                key={year}
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                onClick={() => handleYearSelect(year)}
                className={cn(
                  "h-9 text-sm font-normal hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800",
                  isSelected && "bg-zinc-100 font-medium dark:bg-zinc-800"
                )}
              >
                {year}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CalendarDayButton = ({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) => {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <BaseButton
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "flex size-9 items-center justify-center font-normal leading-none",
        "data-[selected-single=true]:bg-zinc-900 data-[selected-single=true]:text-white dark:data-[selected-single=true]:bg-zinc-50 dark:data-[selected-single=true]:text-zinc-900",
        "data-[range-middle=true]:bg-zinc-100 data-[range-middle=true]:text-zinc-900 dark:data-[range-middle=true]:bg-zinc-800 dark:data-[range-middle=true]:text-zinc-50",
        "data-[range-start=true]:bg-zinc-900 data-[range-start=true]:text-white dark:data-[range-start=true]:bg-zinc-50 dark:data-[range-start=true]:text-zinc-900",
        "data-[range-end=true]:bg-zinc-900 data-[range-end=true]:text-white dark:data-[range-end=true]:bg-zinc-50 dark:data-[range-end=true]:text-zinc-900",
        "data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-l-md",
        "[&>span]:hidden",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
};

const Calendar = ({
  className,
  classNames,
  showOutsideDays = false,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) => {
  const defaultClassNames = getDefaultClassNames();
  const showDropdowns =
    captionLayout === "dropdown" ||
    captionLayout === "dropdown-months" ||
    captionLayout === "dropdown-years";

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("group/calendar bg-white p-3 dark:bg-zinc-950", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "long" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex w-full flex-col gap-4 sm:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "relative flex h-8 w-full items-center justify-center",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex items-center justify-center gap-1 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        caption_label: cn(
          "select-none text-sm font-medium",
          showDropdowns && "hidden",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "w-9 select-none text-center text-[0.8rem] font-normal text-zinc-500 dark:text-zinc-400",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-9 select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "select-none text-[0.8rem] text-zinc-500 dark:text-zinc-400",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative size-9 select-none p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-zinc-100 dark:bg-zinc-800",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-r-md bg-zinc-100 dark:bg-zinc-800",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-md bg-zinc-100 text-zinc-900 data-[selected=true]:rounded-none dark:bg-zinc-800 dark:text-zinc-50",
          defaultClassNames.today
        ),
        outside: cn(
          "text-zinc-400 aria-selected:text-zinc-400 dark:text-zinc-600",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-zinc-400 opacity-50 dark:text-zinc-600",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-9 items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        MonthsDropdown: showDropdowns ? MonthsDropdown : undefined,
        YearsDropdown: showDropdowns ? YearsDropdown : undefined,
        ...components,
      }}
      {...props}
    />
  );
};

export { Calendar, CalendarDayButton };
