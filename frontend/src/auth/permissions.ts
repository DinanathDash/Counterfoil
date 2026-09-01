import { Role } from "@/types/api";

export const PERMISSIONS = {
  // Customers
  CREATE_CUSTOMER: ["ADMIN", "MANAGER", "SALES"],
  VIEW_CUSTOMER: ["ADMIN", "MANAGER", "SALES", "WAREHOUSE"],
  UPDATE_CUSTOMER: ["ADMIN", "MANAGER", "SALES"],
  DELETE_CUSTOMER: ["ADMIN", "MANAGER"],
  ADD_CUSTOMER_NOTE: ["ADMIN", "MANAGER", "SALES"],

  // Products
  CREATE_PRODUCT: ["ADMIN", "MANAGER"],
  VIEW_PRODUCT: ["ADMIN", "MANAGER", "SALES", "WAREHOUSE"],
  UPDATE_PRODUCT: ["ADMIN", "MANAGER"],
  DELETE_PRODUCT: ["ADMIN", "MANAGER"],
  ADJUST_STOCK: ["ADMIN", "MANAGER", "WAREHOUSE"],

  // Challans
  CREATE_CHALLAN: ["ADMIN", "MANAGER", "SALES"],
  VIEW_CHALLAN: ["ADMIN", "MANAGER", "SALES", "WAREHOUSE"],
  CONFIRM_CHALLAN: ["ADMIN", "MANAGER", "WAREHOUSE"],
  CANCEL_CHALLAN: ["ADMIN", "MANAGER"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
