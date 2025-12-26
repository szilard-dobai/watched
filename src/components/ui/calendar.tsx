"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import * as React from "react";
import { DayPicker, type DropdownProps } from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
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
          className="h-8 gap-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 relative"
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

const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("bg-white dark:bg-zinc-950 p-3", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "long" }),
        ...formatters,
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption:
          "relative flex justify-center items-center h-9",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 flex justify-between px-1 z-10",
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-7 p-0"
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-7 p-0"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-zinc-500 dark:text-zinc-400 w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal",
          "aria-selected:bg-zinc-900 aria-selected:text-white dark:aria-selected:bg-zinc-50 dark:aria-selected:text-zinc-900",
          "focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 dark:focus:ring-zinc-600",
          "aria-selected:focus:ring-zinc-600 dark:aria-selected:focus:ring-zinc-400"
        ),
        range_start: "day-range-start rounded-l-md",
        range_end: "day-range-end rounded-r-md",
        selected:
          "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-md",
        today:
          "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 rounded-md",
        outside: "text-zinc-400 dark:text-zinc-600 opacity-50",
        disabled: "text-zinc-400 opacity-50",
        range_middle:
          "aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50 rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className="size-4" {...props} />;
          }
          if (orientation === "right") {
            return <ChevronRightIcon className="size-4" {...props} />;
          }
          return <ChevronDownIcon className="size-4" {...props} />;
        },
        MonthsDropdown:
          captionLayout === "dropdown-months" ? MonthsDropdown : undefined,
        ...components,
      }}
      {...props}
    />
  );
};

export { Calendar };
