"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { challansApi } from "@/api/challans";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "@/components/ui/toast";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, CheckCircle2, Download } from "lucide-react";

export default function ChallanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const {
    data: challan,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["challan", id],
    queryFn: () => challansApi.getChallan(id),
  });

  const confirmMutation = useMutation({
    mutationFn: () => challansApi.confirmChallan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challan", id] });
      queryClient.invalidateQueries({ queryKey: ["challans"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.add({
        title: "Challan Confirmed",
        description: "Stock has been successfully deducted.",
      });
      setIsConfirming(false);
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.add({
        title: "Failed to confirm",
        description:
          error.response?.data?.error?.message || "Could not confirm challan.",
        type: "error",
      });
      setIsConfirming(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => challansApi.cancelChallan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challan", id] });
      queryClient.invalidateQueries({ queryKey: ["challans"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.add({
        title: "Challan Cancelled",
        description: "Challan cancelled and stock restored if applicable.",
      });
      setIsCancelling(false);
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.add({
        title: "Failed to cancel",
        description:
          error.response?.data?.error?.message || "Could not cancel challan.",
        type: "error",
      });
      setIsCancelling(false);
    },
  });

  const handleConfirm = () => {
    if (
      confirm(
        "Are you sure you want to confirm this challan? This will deduct stock and cannot be easily undone.",
      )
    ) {
      setIsConfirming(true);
      confirmMutation.mutate();
    }
  };

  const handleCancel = () => {
    if (
      confirm(
        "Are you sure you want to cancel this challan? This will restore any deducted stock.",
      )
    ) {
      setIsCancelling(true);
      cancelMutation.mutate();
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/challans/${id}/pdf`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (isError || !challan) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-ink mb-2">Challan Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The challan you are looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <Link
          href="/challans"
          className={buttonVariants({ variant: "default" })}
        >
          Back to Challans
        </Link>
      </div>
    );
  }

  const isDraft = challan.status === "DRAFT";
  const isConfirmed = challan.status === "CONFIRMED";
  const isCancelled = challan.status === "CANCELLED";

  const canEdit = isDraft && (user?.role === "ADMIN" || user?.role === "SALES");
  const canConfirm =
    isDraft &&
    (user?.role === "ADMIN" ||
      user?.role === "SALES" ||
      user?.role === "WAREHOUSE");
  const canCancelUser = user?.role === "ADMIN";

  return (
    <div className="pb-8 tracking-[0.01em] space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/challans"
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "rounded-[10px]",
            })}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
              Challan{" "}
              {challan.challanNumber ? `#${challan.challanNumber}` : "(Draft)"}
              {isDraft && (
                <Badge variant="secondary" className="rounded-[6px]">
                  Draft
                </Badge>
              )}
              {isConfirmed && (
                <Badge
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-[6px]"
                >
                  Confirmed
                </Badge>
              )}
              {isCancelled && (
                <Badge variant="destructive" className="rounded-[6px]">
                  Cancelled
                </Badge>
              )}
            </h1>
            <p className="text-[13px] leading-tight text-muted-foreground mt-1">
              Created on{" "}
              {format(new Date(challan.createdAt), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link href={`/challans/${id}/edit`}>
              <Button
                variant="outline"
                className="rounded-[10px] h-9 shadow-sm border-[0.5px] border-border/50"
              >
                <Edit className="h-4 w-4 mr-2" strokeWidth={1} /> Edit draft
              </Button>
            </Link>
          )}
          {canConfirm && (
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] h-9 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" strokeWidth={1} /> Confirm
              & issue
            </Button>
          )}
          {canCancelUser && !isCancelled && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
              className="rounded-[10px] h-9 shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1} /> Cancel challan
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="rounded-[10px] h-9 shadow-sm border-[0.5px] border-border/50"
          >
            <Download className="h-4 w-4 mr-2" strokeWidth={1} /> Download PDF
          </Button>
        </div>
      </div>

      {/* Snapshot Document */}
      <Card className="overflow-hidden rounded-2xl border-[0.5px] border-border/50 shadow-sm bg-card">
        <div className="bg-muted/30 p-6 md:p-10 border-b-[0.5px] border-border/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Billed To
              </h2>
              <p className="font-bold text-lg text-ink">
                {challan.customerName}
              </p>
              {challan.customerBusiness && (
                <p className="text-[13px] leading-tight text-muted-foreground">
                  {challan.customerBusiness}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Challan Details
              </h2>
              <p className="font-medium text-[13px] leading-tight">
                No: {challan.challanNumber || "N/A"}
              </p>
              <p className="text-[13px] leading-tight text-muted-foreground mt-1">
                Date:{" "}
                {challan.confirmedAt
                  ? format(new Date(challan.confirmedAt), "dd MMM yyyy")
                  : "Pending"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-canvas/50 hover:bg-canvas/50 border-b-[0.5px] border-border/50">
                <TableHead className="w-[50px] text-center text-[12px] font-medium text-muted-foreground tracking-wider">
                  #
                </TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground tracking-wider">
                  Item Details
                </TableHead>
                <TableHead className="text-right text-[12px] font-medium text-muted-foreground tracking-wider">
                  Quantity
                </TableHead>
                <TableHead className="text-right text-[12px] font-medium text-muted-foreground tracking-wider">
                  Rate
                </TableHead>
                <TableHead className="text-right pr-6 md:pr-10 text-[12px] font-medium text-muted-foreground tracking-wider">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challan.items?.map((item, index) => (
                <TableRow
                  key={item.id}
                  className="border-b-[0.5px] border-border/50"
                >
                  <TableCell className="text-center text-[13px] leading-tight text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-[13px] leading-tight">
                      {item.productName}
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight">
                      SKU: {item.sku}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-[13px] leading-tight">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right text-[13px] leading-tight">
                    ₹{parseFloat(item.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right pr-6 md:pr-10 font-medium text-[13px] leading-tight">
                    ₹{parseFloat(item.lineTotal).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals */}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}></TableCell>
                <TableCell className="text-right font-semibold pt-6 text-[13px] leading-tight">
                  Gross Total:
                </TableCell>
                <TableCell className="text-right font-bold text-lg pt-6 pr-6 md:pr-10">
                  ₹{parseFloat(challan.totalAmount).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {challan.notes && (
          <div className="p-6 md:p-10 border-t-[0.5px] border-border/50 bg-muted/10">
            <h3 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Notes / Terms
            </h3>
            <p className="text-[13px] leading-tight whitespace-pre-wrap">
              {challan.notes}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
