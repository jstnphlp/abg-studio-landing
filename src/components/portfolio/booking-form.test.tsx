import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BookingForm } from "./booking-form";

beforeEach(() => {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:local-photo"),
    revokeObjectURL: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows one step at a time, preserves edits on Back and previews local photos", () => {
  render(<BookingForm />);
  expect(
    screen.queryByLabelText("What should we call you?"),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  const calendar = screen.getByRole("group", { name: "Preferred date" });
  const date = within(calendar)
    .getAllByRole("button")
    .find((button) => button.hasAttribute("aria-current"))!;
  fireEvent.click(date);
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(
    screen.queryByRole("group", { name: "Preferred date" }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("What should we call you?"), {
    target: { value: "Alex Example" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(
    screen
      .getByRole("group", { name: "Preferred date" })
      .querySelector('[aria-pressed="true"]'),
  ).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByLabelText("What should we call you?")).toHaveValue(
    "Alex Example",
  );
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText("Choose a preferred time"), {
    target: { value: "10:30" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText(/Anything we should know/), {
    target: { value: "Pearl nail inspiration" },
  });
  fireEvent.change(screen.getByLabelText("Add inspiration photos"), {
    target: {
      files: [new File(["demo"], "nails.jpg", { type: "image/jpeg" })],
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview request" }));
  const preview = screen.getByRole("region", { name: "Request preview" });
  expect(within(preview).getByText("Alex Example")).toBeInTheDocument();
  expect(
    within(preview).getByText("Pearl nail inspiration"),
  ).toBeInTheDocument();
  expect(
    within(preview).getByRole("img", { name: "nails.jpg" }),
  ).toHaveAttribute("src", "blob:local-photo");
  expect(within(preview).getByText(/NOT been sent/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Back to edit" }));
  expect(screen.getByLabelText(/Anything we should know/)).toHaveValue(
    "Pearl nail inspiration",
  );
  expect(
    screen.getByRole("list", { name: "Attached photos" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText("Choose a preferred time")).toHaveValue("10:30");
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove nails.jpg" }));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-photo");
  expect(
    screen.queryByRole("list", { name: "Attached photos" }),
  ).not.toBeInTheDocument();
});
