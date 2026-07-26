import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render } from "@testing-library/react";
import MockDataIndicator from "@/components/dashboard/MockDataIndicator";

/**
 * **Feature: role-based-dashboards, Property 7: Mock data indicator presence**
 * *For any* section component displaying mock data, the component SHALL render
 * a visible "Datos de demostración" indicator element.
 * **Validates: Requirements 5.4**
 */
describe("Property 7: Mock data indicator presence", () => {
  const variantArbitrary = fc.constantFrom("banner", "badge", "inline") as fc.Arbitrary<
    "banner" | "badge" | "inline"
  >;

  it("should render indicator with 'Datos de demostración' text for any variant", () => {
    fc.assert(
      fc.property(variantArbitrary, (variant) => {
        const { container } = render(<MockDataIndicator variant={variant} />);

        // The indicator should be visible in the DOM
        expect(container.firstChild).toBeTruthy();

        // Check for the presence of indicator text
        const text = container.textContent || "";
        const hasIndicatorText =
          text.includes("Datos de demostración") ||
          text.includes("demostración") ||
          text.includes("desarrollo");

        expect(hasIndicatorText).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should render AlertCircle icon for any variant", () => {
    fc.assert(
      fc.property(variantArbitrary, (variant) => {
        const { container } = render(<MockDataIndicator variant={variant} />);

        // Should have an SVG icon (AlertCircle from lucide-react)
        const svgElement = container.querySelector("svg");
        expect(svgElement).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it("banner variant should render with amber styling", () => {
    fc.assert(
      fc.property(fc.constant("banner"), () => {
        const { container } = render(<MockDataIndicator variant="banner" />);

        const element = container.firstChild as HTMLElement;
        expect(element).toBeTruthy();

        // Check for amber color classes
        const className = element.className || "";
        expect(className).toContain("amber");
      }),
      { numRuns: 100 }
    );
  });

  it("badge variant should render as inline-flex with rounded-full", () => {
    fc.assert(
      fc.property(fc.constant("badge"), () => {
        const { container } = render(<MockDataIndicator variant="badge" />);

        const element = container.firstChild as HTMLElement;
        expect(element).toBeTruthy();

        const className = element.className || "";
        expect(className).toContain("inline-flex");
        expect(className).toContain("rounded-full");
      }),
      { numRuns: 100 }
    );
  });

  it("should accept custom message prop", () => {
    const customMessages = [
      "Custom message 1",
      "Sección en desarrollo",
      "Datos de prueba personalizados",
    ];

    fc.assert(
      fc.property(fc.constantFrom(...customMessages), (message) => {
        const { container } = render(<MockDataIndicator message={message} variant="banner" />);

        const text = container.textContent || "";
        expect(text).toContain(message);
      }),
      { numRuns: 100 }
    );
  });

  it("should accept custom className prop", () => {
    const customClasses = ["custom-class", "my-indicator", "test-class"];

    fc.assert(
      fc.property(fc.constantFrom(...customClasses), (customClass) => {
        const { container } = render(
          <MockDataIndicator className={customClass} variant="banner" />
        );

        const element = container.firstChild as HTMLElement;
        expect(element.className).toContain(customClass);
      }),
      { numRuns: 100 }
    );
  });
});
