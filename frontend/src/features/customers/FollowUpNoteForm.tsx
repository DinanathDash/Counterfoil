"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/api/customers";
import { toast } from "@/components/ui/toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const noteSchema = z.object({
  note: z.string().min(1, "Note text is required").max(1000),
  followUpDate: z.string().optional().or(z.literal("")),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).optional(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface FollowUpNoteFormProps {
  customerId: string;
  currentStatus: string;
}

export function FollowUpNoteForm({
  customerId,
  currentStatus,
}: FollowUpNoteFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      status: currentStatus as "LEAD" | "ACTIVE" | "INACTIVE",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: NoteFormValues) => {
      let isoDate = undefined;
      if (data.followUpDate) {
        isoDate = new Date(data.followUpDate).toISOString();
      } else if (data.followUpDate === "") {
        isoDate = null; // Backend accepts null to clear
      }

      return customersApi.addCustomerNote(customerId, {
        note: data.note,
        followUpDate: isoDate,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({
        queryKey: ["customer-notes", customerId],
      });
      toast.add({
        title: "Note added",
        description: "Your follow-up note has been added.",
      });
      reset({ note: "", followUpDate: "" });
      setValue("status", currentStatus as "LEAD" | "ACTIVE" | "INACTIVE");
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.add({
        title: "Error",
        description:
          error.response?.data?.error?.message || "Failed to add note.",
        type: "error",
      });
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const statusValue = watch("status");

  const onSubmit = (data: NoteFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="bg-surface p-4 rounded-md border border-line shadow-sm">
      <h3 className="font-semibold text-ink mb-3">Add Follow-up Note</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <textarea
            {...register("note")}
            placeholder="Type your note here..."
            className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-transparent shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {errors.note && (
            <p className="text-xs text-destructive">{errors.note.message}</p>
          )}
        </div>

        <div className="flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label htmlFor="followUpDate">Next Follow-up Date (Optional)</Label>
            <Input
              id="followUpDate"
              type="date"
              {...register("followUpDate")}
            />
          </div>

          <div className="space-y-2 flex-1">
            <Label>Update Status (Optional)</Label>
            <Select
              value={statusValue}
              onValueChange={(val) =>
                setValue("status", val as "LEAD" | "ACTIVE" | "INACTIVE")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-accent hover:bg-accent/90"
          >
            {mutation.isPending ? "Saving..." : "Save Note"}
          </Button>
        </div>
      </form>
    </div>
  );
}
