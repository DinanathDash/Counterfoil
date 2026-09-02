"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { Product } from "@/types/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useDebounce } from "@/hooks/useDebounce";
import { ProductFormModal } from "@/features/products/ProductFormModal";
import { StockAdjustModal } from "@/features/products/StockAdjustModal";

import Link from "next/link";
import { toast } from "@/components/ui/toast";

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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, AlertCircle, ArrowUpDown } from "lucide-react";

export default function ProductListPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canCreate = user?.role === "ADMIN" || user?.role === "WAREHOUSE";
  const canDelete = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 350);

  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [
      "products",
      { page, limit, search: debouncedSearch, lowStock: lowStockOnly },
    ],
    queryFn: () =>
      productsApi.getProducts({
        page,
        limit,
        search: debouncedSearch,
        lowStock: lowStockOnly ? true : undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.add({
        title: "Product deleted",
        description: "The product was successfully deleted.",
      });
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.add({
        title: "Error",
        description:
          error.response?.data?.error?.message || "Failed to delete product.",
        type: "error",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setIsAdjustOpen(true);
  };

  const openCreateModal = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Products & Inventory
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your product catalog and stock levels.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="w-full sm:w-1/3">
          <Input
            placeholder="Search products by Name or SKU..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="low-stock"
            checked={lowStockOnly}
            onCheckedChange={(checked) => {
              setLowStockOnly(checked);
              setPage(1);
            }}
          />
          <Label
            htmlFor="low-stock"
            className="flex items-center cursor-pointer"
          >
            <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
            Low Stock Only
          </Label>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Product Info</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-ink">{product.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {product.category}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{parseFloat(product.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-semibold ${product.currentStock <= product.minStockAlert ? "text-destructive" : "text-ink"}`}
                      >
                        {product.currentStock}
                      </span>
                      {product.currentStock <= product.minStockAlert && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-destructive border-destructive px-1 py-0 h-4"
                        >
                          Low
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {product.location || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" className="h-8 w-8 p-0" />
                        }
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          render={
                            <Link
                              href={`/products/${product.id}`}
                              className="cursor-pointer"
                            />
                          }
                        >
                          View details & history
                        </DropdownMenuItem>
                        {canCreate && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEdit(product)}
                              className="cursor-pointer"
                            >
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAdjustStock(product)}
                              className="cursor-pointer"
                            >
                              <ArrowUpDown className="mr-2 h-4 w-4" /> Adjust
                              Stock
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              Delete Product
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={selectedProduct}
      />

      <StockAdjustModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
