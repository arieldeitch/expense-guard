// @vitest-environment jsdom
import { useState } from "react";
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DurationField } from "@/components/inputs/DurationField";
afterEach(cleanup);
it("stores 37 minutes and 20 seconds as 2240 seconds without blur", () => {
  function Harness() {
    const [value, setValue] = useState<number | null>(null);
    return (
      <>
        <DurationField value={value} onChange={setValue} />
        <output>{value}</output>
      </>
    );
  }
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("משך בדקות"), { target: { value: "37" } });
  fireEvent.change(screen.getByLabelText("משך בשניות"), { target: { value: "20" } });
  expect(screen.getByRole("status").textContent).toBe("2240");
});
