"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { useAuthStore } from "@/store/useAuthStore";
import { StockAdjustModal } from "@/features/products/StockAdjustModal";
import { ProductFormModal } from "@/features/products/ProductFormModal";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "@/components/ui/toast";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  ArrowUpDown,
  Trash2,
  Package,
  MapPin,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const canEdit = user?.role === "ADMIN" || user?.role === "WAREHOUSE";
  const canDelete = user?.role === "ADMIN";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getProduct(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.add({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
      router.push("/products");
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.add({
        title: "Delete failed",
        description:
          error.response?.data?.error?.message || "Could not delete product.",
        type: "error",
      });
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this product? This action cannot be undone unless it is a soft delete.",
      )
    ) {
      setIsDeleting(true);
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] md:col-span-1" />
          <Skeleton className="h-[400px] md:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !data?.product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-ink mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The product you are looking for doesn&apos;t exist or has been
          deleted.
        </p>
        <Link
          href="/products"
          className={buttonVariants({ variant: "default" })}
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const { product, recentMovements } = data;
  const isLowStock = product.currentStock <= product.minStockAlert;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/products"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
              {product.name}
              {product.status === "DISCONTINUED" && (
                <Badge variant="destructive">Discontinued</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              SKU: {product.sku}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {canEdit && (
            <>
              <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button onClick={() => setIsAdjustOpen(true)}>
                <ArrowUpDown className="h-4 w-4 mr-2" /> Adjust Stock
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Product Info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm flex items-center">
                  <Package className="w-4 h-4 mr-2" /> Stock Status
                </span>
                <span
                  className={`font-bold text-lg ${isLowStock ? "text-destructive" : "text-primary"}`}
                >
                  {product.currentStock}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm">
                  Min Stock Alert
                </span>
                <span className="font-medium">{product.minStockAlert}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm flex items-center">
                  <Tag className="w-4 h-4 mr-2" /> Category
                </span>
                <Badge variant="secondary">{product.category}</Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm">
                  Unit Price
                </span>
                <span className="font-medium font-mono">
                  ₹{parseFloat(product.unitPrice).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground text-sm flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> Location
                </span>
                <span className="font-medium">
                  {product.location || "Unassigned"}
                </span>
              </div>

              {product.description && (
                <div className="pt-2">
                  <span className="text-muted-foreground text-sm block mb-1">
                    Description
                  </span>
                  <p className="text-sm text-ink">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Movement Log */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMovements && recentMovements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(
                            new Date(movement.createdAt),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </TableCell>
                        <TableCell>
                          {movement.type === "IN" ? (
                            <Badge
                              variant="outline"
                              className="text-emerald-600 border-emerald-600 bg-emerald-50"
                            >
                              <ArrowDownRight className="w-3 h-3 mr-1" /> IN
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-600 bg-orange-50"
                            >
                              <ArrowUpRight className="w-3 h-3 mr-1" /> OUT
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell
                          className={`font-medium ${movement.type === "IN" ? "text-emerald-600" : "text-orange-600"}`}
                        >
                          {movement.type === "IN" ? "+" : "-"}
                          {movement.quantity}
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.balanceAfter}
                        </TableCell>
                        <TableCell
                          className="text-xs max-w-[150px] truncate"
                          title={movement.reason}
                        >
                          {movement.reason}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {movement.createdBy?.name || "System"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No stock movements recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={product}
      />

      <StockAdjustModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        product={product}
      />
    </div>
  );
}
