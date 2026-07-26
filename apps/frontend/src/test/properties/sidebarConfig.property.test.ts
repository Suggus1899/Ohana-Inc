import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  clientSidebarItems,
  operatorSidebarItems,
  adminSidebarItems,
  getSidebarItemsByRole,
  getPermissionsByRole,
  getTitleByRole,
  clientPermissions,
  operatorPermissions,
  adminPermissions,
} from "@/config/sidebarConfig";

/**
 * **Feature: role-based-dashboards, Property 1: Sidebar items match role configuration**
 * *For any* user role (cliente, operator, admin), the sidebar component SHALL render
 * exactly the items defined in that role's sidebar configuration.
 * **Validates: Requirements 1.1, 2.1, 3.1**
 */
describe("Property 1: Sidebar items match role configuration", () => {
  const roleArbitrary = fc.constantFrom("cliente", "operator", "admin");

  it("should return correct sidebar items for any role", () => {
    fc.assert(
      fc.property(roleArbitrary, (role) => {
        const items = getSidebarItemsByRole(role);

        // Verify items is an array with at least one item
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);

        // Verify each item has required properties
        items.forEach((item) => {
          expect(item).toHaveProperty("id");
          expect(item).toHaveProperty("label");
          expect(item).toHaveProperty("icon");
          expect(typeof item.id).toBe("string");
          expect(typeof item.label).toBe("string");
        });

        // Verify correct items are returned for each role
        if (role === "cliente") {
          expect(items).toEqual(clientSidebarItems);
        } else if (role === "operator") {
          expect(items).toEqual(operatorSidebarItems);
        } else if (role === "admin") {
          expect(items).toEqual(adminSidebarItems);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should have unique ids within each role's sidebar items", () => {
    fc.assert(
      fc.property(roleArbitrary, (role) => {
        const items = getSidebarItemsByRole(role);
        const ids = items.map((item) => item.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: role-based-dashboards, Property 5: Header title matches role**
 * *For any* user role, the dashboard header SHALL display the correct title text
 * for that role (Estudiante, Operador, Administrador) while maintaining the same color scheme.
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */
describe("Property 5: Header title matches role", () => {
  const roleArbitrary = fc.constantFrom("cliente", "operator", "admin");

  it("should return correct title for any role", () => {
    fc.assert(
      fc.property(roleArbitrary, (role) => {
        const title = getTitleByRole(role);

        // Verify title is a non-empty string
        expect(typeof title).toBe("string");
        expect(title.length).toBeGreaterThan(0);

        // Verify correct title for each role
        if (role === "cliente") {
          expect(title).toBe("Panel Estudiante");
        } else if (role === "operator") {
          expect(title).toBe("Panel Operador");
        } else if (role === "admin") {
          expect(title).toBe("Panel Administrador");
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: role-based-dashboards, Property 6: Action buttons match role permissions**
 * *For any* component rendered with a permissions object, the component SHALL only
 * display action buttons where the corresponding permission is true.
 * **Validates: Requirements 4.4, 5.2**
 */
describe("Property 6: Action buttons match role permissions", () => {
  const roleArbitrary = fc.constantFrom("cliente", "operator", "admin");

  it("should return correct permissions for any role", () => {
    fc.assert(
      fc.property(roleArbitrary, (role) => {
        const permissions = getPermissionsByRole(role);

        // Verify permissions object has all required properties
        expect(permissions).toHaveProperty("canView");
        expect(permissions).toHaveProperty("canCreate");
        expect(permissions).toHaveProperty("canEdit");
        expect(permissions).toHaveProperty("canDelete");
        expect(permissions).toHaveProperty("canApprove");
        expect(permissions).toHaveProperty("canAssignTasks");

        // All roles can view
        expect(permissions.canView).toBe(true);

        // Verify role-specific permissions
        if (role === "cliente") {
          expect(permissions).toEqual(clientPermissions);
          expect(permissions.canCreate).toBe(false);
          expect(permissions.canEdit).toBe(false);
          expect(permissions.canDelete).toBe(false);
          expect(permissions.canApprove).toBe(false);
        } else if (role === "operator") {
          expect(permissions).toEqual(operatorPermissions);
          expect(permissions.canCreate).toBe(false);
          expect(permissions.canDelete).toBe(false);
          expect(permissions.canEdit).toBe(true);
          expect(permissions.canApprove).toBe(true);
        } else if (role === "admin") {
          expect(permissions).toEqual(adminPermissions);
          expect(permissions.canCreate).toBe(true);
          expect(permissions.canEdit).toBe(true);
          expect(permissions.canDelete).toBe(true);
          expect(permissions.canApprove).toBe(true);
          expect(permissions.canAssignTasks).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("cliente permissions should never allow CRUD operations", () => {
    fc.assert(
      fc.property(fc.constant("cliente"), () => {
        const permissions = getPermissionsByRole("cliente");
        expect(permissions.canCreate).toBe(false);
        expect(permissions.canEdit).toBe(false);
        expect(permissions.canDelete).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("operator permissions should never allow create or delete", () => {
    fc.assert(
      fc.property(fc.constant("operator"), () => {
        const permissions = getPermissionsByRole("operator");
        expect(permissions.canCreate).toBe(false);
        expect(permissions.canDelete).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
