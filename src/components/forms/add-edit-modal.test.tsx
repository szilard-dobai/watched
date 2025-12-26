import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddEditModal } from "./add-edit-modal";
import type { WatchedItem } from "@/types";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    sizes?: string;
    // eslint-disable-next-line @next/next/no-img-element
  }) => <img src={src} alt={alt} {...props} />,
}));

vi.mock("./tmdb-search", () => ({
  TMDBSearch: ({ onSelect }: { onSelect: (result: unknown) => void }) => (
    <button
      data-testid="mock-tmdb-search"
      onClick={() =>
        onSelect({
          id: 123,
          media_type: "movie",
          title: "Test Movie",
          poster_path: "/test.jpg",
          overview: "Test overview",
          vote_average: 8.5,
        })
      }
    >
      Mock TMDB Search
    </button>
  ),
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div data-testid="mock-calendar">Calendar</div>,
}));

describe("AddEditModal", () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with 'Add New Item' title when no item is provided", () => {
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText("Add New Item")).toBeInTheDocument();
  });

  it("renders with 'Edit Item' title when item is provided", () => {
    const existingItem: WatchedItem = {
      _id: "1",
      title: "Existing Movie",
      type: "movie",
      status: "completed",
      platform: "Netflix",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };

    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        item={existingItem}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText("Edit Item")).toBeInTheDocument();
  });

  it("populates form with existing item data", () => {
    const existingItem: WatchedItem = {
      _id: "1",
      title: "Existing Movie",
      type: "movie",
      status: "completed",
      platform: "Netflix",
      notes: "Great movie!",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };

    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        item={existingItem}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue("Existing Movie")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Great movie!")).toBeInTheDocument();
  });

  it("disables submit button when title is empty", () => {
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByRole("button", { name: "Add" });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when title is provided", async () => {
    const user = userEvent.setup();
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByPlaceholderText("Title *");
    await user.type(titleInput, "New Movie");

    const submitButton = screen.getByRole("button", { name: "Add" });
    expect(submitButton).not.toBeDisabled();
  });

  it("calls onSave with form data when submitted", async () => {
    const user = userEvent.setup();
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByPlaceholderText("Title *");
    await user.type(titleInput, "New Movie");

    const submitButton = screen.getByRole("button", { name: "Add" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Movie",
          type: "movie",
          status: "want_to_watch",
        })
      );
    });
  });

  it("closes modal after successful save", async () => {
    const user = userEvent.setup();
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByPlaceholderText("Title *");
    await user.type(titleInput, "New Movie");

    const submitButton = screen.getByRole("button", { name: "Add" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows 'Saving...' while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const slowSave = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={slowSave}
      />
    );

    const titleInput = screen.getByPlaceholderText("Title *");
    await user.type(titleInput, "New Movie");

    const submitButton = screen.getByRole("button", { name: "Add" });
    await user.click(submitButton);

    expect(
      screen.getByRole("button", { name: "Saving..." })
    ).toBeInTheDocument();

    resolvePromise!();
    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("calls onOpenChange when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows 'Update' button text when editing existing item", () => {
    const existingItem: WatchedItem = {
      _id: "1",
      title: "Existing Movie",
      type: "movie",
      status: "completed",
      platform: "Netflix",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };

    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        item={existingItem}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("populates form data from TMDB search selection", async () => {
    const user = userEvent.setup();
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await user.click(screen.getByTestId("mock-tmdb-search"));

    expect(screen.getByDisplayValue("Test Movie")).toBeInTheDocument();
  });

  it("shows seasons input for TV shows", () => {
    const existingItem: WatchedItem = {
      _id: "1",
      title: "Breaking Bad",
      type: "tv_show",
      status: "completed",
      platform: "Netflix",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };

    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        item={existingItem}
        onSave={mockOnSave}
      />
    );

    expect(
      screen.getByPlaceholderText("Number of seasons")
    ).toBeInTheDocument();
  });

  it("hides seasons input for movies", () => {
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(
      screen.queryByPlaceholderText("Number of seasons")
    ).not.toBeInTheDocument();
  });

  it("displays poster image when posterPath is set", async () => {
    const user = userEvent.setup();
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    await user.click(screen.getByTestId("mock-tmdb-search"));

    const posterImage = screen.getByAltText("Test Movie");
    expect(posterImage).toBeInTheDocument();
    expect(posterImage).toHaveAttribute(
      "src",
      expect.stringContaining("/test.jpg")
    );
  });

  it("resets form when modal is reopened for new item", async () => {
    const existingItem: WatchedItem = {
      _id: "1",
      title: "Existing Movie",
      type: "movie",
      status: "completed",
      platform: "Netflix",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };

    const { rerender } = render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        item={existingItem}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue("Existing Movie")).toBeInTheDocument();

    rerender(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        item={null}
        onSave={mockOnSave}
      />
    );

    expect(
      screen.queryByDisplayValue("Existing Movie")
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Title *")).toHaveValue("");
  });

  it("allows entering notes", async () => {
    const user = userEvent.setup();
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByPlaceholderText("Title *");
    await user.type(titleInput, "Test Movie");

    const notesInput = screen.getByPlaceholderText("Notes (optional)");
    await user.type(notesInput, "My notes about this movie");

    const submitButton = screen.getByRole("button", { name: "Add" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: "My notes about this movie",
        })
      );
    });
  });

  it("does not submit form when title contains only whitespace", async () => {
    const user = userEvent.setup();
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByPlaceholderText("Title *");
    await user.type(titleInput, "   ");

    const submitButton = screen.getByRole("button", { name: "Add" });
    expect(submitButton).toBeDisabled();
  });

  it("shows star rating component", () => {
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText("Your Rating")).toBeInTheDocument();
  });

  it("shows date picker components", () => {
    render(
      <AddEditModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText("Start Date")).toBeInTheDocument();
    expect(screen.getByText("End Date")).toBeInTheDocument();
  });
});
