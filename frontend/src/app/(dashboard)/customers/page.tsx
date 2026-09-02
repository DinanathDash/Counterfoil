"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customersApi } from "@/api/customers";
import { useDebounce } from "@/hooks/useDebounce";
import { CustomerFormModal } from "@/features/customers/CustomerFormModal";
import { useAuthStore } from "@/store/useAuthStore";
import { hasPermission } from "@/auth/permissions";
import { format } from "date-fns";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  const debouncedSearch = useDebounce(searchTerm, 350);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "customers",
      {
        page,
        limit,
        q: debouncedSearch,
        status: statusFilter,
        type: typeFilter,
      },
    ],
    queryFn: () =>
      customersApi.getCustomers({
        page,
        limit,
        q: debouncedSearch || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      }),
  });

  const canCreate = user ? hasPermission(user.role, "CREATE_CUSTOMER") : false;

  const handleNextPage = () => {
    if (data?.meta && page < data.meta.totalPages) setPage((p) => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ink">Customers</h1>
        {canCreate && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        )}
      </div>

      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <Input
            placeholder="Search name, mobile, email..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // reset to first page on search
            }}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="LEAD">Lead</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="RETAIL">Retail</SelectItem>
            <SelectItem value="WHOLESALE">Wholesale</SelectItem>
            <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-surface rounded-md border border-line overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-canvas">
              <TableHead>Name</TableHead>
              <TableHead>Business / Mobile</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-12 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-destructive"
                >
                  Failed to load customers.{" "}
                  <Button variant="link" onClick={() => refetch()}>
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="hover:bg-canvas/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-accent hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.businessName || "-"}
                    </div>
                    <div className="text-xs text-muted">{customer.mobile}</div>
                  </TableCell>
                  <TableCell className="text-sm">{customer.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === "ACTIVE"
                          ? "default"
                          : customer.status === "LEAD"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {customer.followUpDate
                      ? format(new Date(customer.followUpDate), "dd MMM yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/customers/${customer.id}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data?.meta && (
          <div className="flex items-center justify-between p-4 border-t border-line">
            <div className="text-sm text-muted">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, data.meta.total)} of {data.meta.total}{" "}
              results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={handlePrevPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={handleNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
