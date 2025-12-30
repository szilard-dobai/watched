"use client"

import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { watchFormSchema, type WatchFormValues } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PLATFORMS, WATCH_STATUS_OPTIONS } from "@/lib/constants"
import type { WatchStatus } from "@/types"

interface WatchFormProps {
  isMovie: boolean
  defaultValues?: Partial<WatchFormValues>
  onSubmit: (data: WatchFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
}

export const WatchForm = ({
  isMovie,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  submittingLabel,
}: WatchFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<WatchFormValues>({
    resolver: zodResolver(watchFormSchema),
    defaultValues: {
      status: "finished",
      ...defaultValues,
    },
    mode: "onChange",
  })

  const status = useWatch({ control, name: "status" })
  const startDate = useWatch({ control, name: "startDate" })
  const endDate = useWatch({ control, name: "endDate" })

  const handleFormSubmit = async (data: WatchFormValues) => {
    await onSubmit(data)
  }

  const showEndDateHelper =
    status === "finished" && isMovie && startDate && !endDate

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => field.onChange(v as WatchStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WATCH_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date *</label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                date={field.value}
                onDateChange={field.onChange}
                placeholder="Pick date"
              />
            )}
          />
          {errors.startDate && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.startDate.message}
            </p>
          )}
        </div>
        {status === "finished" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              End Date {isMovie ? "(optional)" : "*"}
            </label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  date={field.value}
                  onDateChange={field.onChange}
                  placeholder={isMovie ? "Same as start" : "Pick date"}
                  defaultMonth={startDate}
                />
              )}
            />
            {errors.endDate && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.endDate.message}
              </p>
            )}
          </div>
        )}
      </div>

      {showEndDateHelper && (
        <p className="text-sm text-zinc-500">
          For movies, end date defaults to start date.
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Platform</label>
        <Controller
          name="platform"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform..." />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea
              value={field.value ?? ""}
              onChange={field.onChange}
              rows={2}
              placeholder="Any thoughts..."
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !isValid}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}
