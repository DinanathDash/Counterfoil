"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { challansApi } from "@/api/challans";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Plus, Search, FileText } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function ChallanListPage() {
  const user = useAuthStore((state) => state.user);
  const canCreate = user?.role === "ADMIN" || user?.role === "SALES";

  const [page, setPage] = useState(1);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 350);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: [
      "challans",
      {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      },
    ],
    queryFn: () =>
      challansApi.getChallans({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 hover:bg-gray-100"
          >
            Draft
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Confirmed
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Sales Challans
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage delivery challans and shipments.
          </p>
        </div>
        {canCreate && (
          <Link href="/challans/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Challan
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Challan # or Customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val || "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[120px]">Challan No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="w-[120px] text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-6 w-16 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground"
                >
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  No challans found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((challan) => (
                <TableRow key={challan.id}>
                  <TableCell className="font-mono font-medium">
                    {challan.challanNumber || (
                      <span className="text-muted-foreground text-xs italic">
                        Draft
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(challan.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-ink">
                      {challan.customerName || "Unknown"}
                    </div>
                    {challan.customerBusiness && (
                      <div className="text-xs text-muted-foreground">
                        {challan.customerBusiness}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {challan.items?.length || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{parseFloat(challan.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(challan.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/challans/${challan.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground mx-4">
                Page {page} of {data.meta.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(data.meta.totalPages, p + 1))
                }
                disabled={page === data.meta.totalPages}
              >
                Next
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
