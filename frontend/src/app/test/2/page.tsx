"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { date, z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import DatePick from "@/components/dropdown-normal/datePick_dd"
import DistributorDD from "@/components/dropdown-normal/distributor_dd"
import { useState } from "react"
import { Popover } from "@/components/ui/popover"
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import {  CalendarIcon } from "lucide-react"
import { format, setDate } from 'date-fns'
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"



const formSchema = z.object({
  th_date: z.string({
    required_error: "Pilih Tanggal!"
  }),
  supplier: z.number({
    required_error: "Pilih Supplier!"
  }),
})

export function ProfileForm() {

  const [distributor, setDistributor] = useState<number | null>(null);
  const [date, setDate] = useState<Date>()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      th_date: "",
      supplier: undefined,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    toast.success("Form berhasil disubmit!")
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Tanggal Field */}
        <FormField
          control={form.control}
          name="th_date"
          render={({ field }) => (
            <FormItem>
            <FormLabel>Tanggal</FormLabel>
            <FormControl>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(new Date(field.value), "PPP")
                      : <span>Pilih Tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border rounded-md">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      field.onChange(date?.toISOString() ?? "")
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormMessage />
          </FormItem>
          )}
        />

        {/* Supplier Field */}
        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <FormControl>

                <DistributorDD
                  value={distributor}
                  onChange={(val: number | null) => {
                    setDistributor(val)
                    field.onChange(val)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default ProfileForm;
