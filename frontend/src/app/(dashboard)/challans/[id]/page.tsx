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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/challans"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
              Challan{" "}
              {challan.challanNumber ? `#${challan.challanNumber}` : "(Draft)"}
              {isDraft && <Badge variant="secondary">Draft</Badge>}
              {isConfirmed && (
                <Badge
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirmed
                </Badge>
              )}
              {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created on{" "}
              {format(new Date(challan.createdAt), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link href={`/challans/${id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" /> Edit Draft
              </Button>
            </Link>
          )}
          {canConfirm && (
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm & Issue
            </Button>
          )}
          {canCancelUser && !isCancelled && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Cancel Challan
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Snapshot Document */}
      <Card className="overflow-hidden">
        <div className="bg-muted/30 p-6 md:p-10 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Billed To
              </h2>
              <p className="font-bold text-lg text-ink">
                {challan.customerName}
              </p>
              {challan.customerBusiness && (
                <p className="text-muted-foreground">
                  {challan.customerBusiness}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Challan Details
              </h2>
              <p className="font-medium">
                No: {challan.challanNumber || "N/A"}
              </p>
              <p className="text-muted-foreground mt-1">
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
              <TableRow className="bg-muted/10 hover:bg-muted/10">
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead>Item Details</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right pr-6 md:pr-10">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challan.items?.map((item, index) => (
                <TableRow key={item.id} className="border-b">
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">
                      SKU: {item.sku}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ₹{parseFloat(item.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right pr-6 md:pr-10 font-medium">
                    ₹{parseFloat(item.lineTotal).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals */}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}></TableCell>
                <TableCell className="text-right font-semibold pt-6">
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
          <div className="p-6 md:p-10 border-t bg-muted/10">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Notes / Terms
            </h3>
            <p className="text-sm whitespace-pre-wrap">{challan.notes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
