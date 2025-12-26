import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TMDBSearch } from "./tmdb-search";
import type { TMDBSearchResult } from "@/types";

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

const mockResults: TMDBSearchResult[] = [
  {
    id: 1,
    media_type: "movie",
    title: "The Matrix",
    poster_path: "/matrix.jpg",
    backdrop_path: "/matrix-bg.jpg",
    overview: "A computer hacker learns about the true nature of reality.",
    vote_average: 8.7,
    vote_count: 25000,
    popularity: 100.5,
    release_date: "1999-03-31",
    genre_ids: [28, 878],
    original_language: "en",
    original_title: "The Matrix",
  },
  {
    id: 2,
    media_type: "tv",
    name: "Breaking Bad",
    poster_path: "/bb.jpg",
    backdrop_path: "/bb-bg.jpg",
    overview: "A chemistry teacher turns to making meth.",
    vote_average: 9.5,
    vote_count: 12500,
    popularity: 150.5,
    first_air_date: "2008-01-20",
    genre_ids: [18, 80],
    original_language: "en",
    original_name: "Breaking Bad",
  },
  {
    id: 3,
    media_type: "movie",
    title: "No Poster Movie",
    poster_path: null,
    backdrop_path: null,
    overview: "A movie without a poster.",
    vote_average: 0,
    vote_count: 0,
    popularity: 0,
    release_date: "",
    genre_ids: [],
    original_language: "en",
    original_title: "No Poster Movie",
  },
]

describe("TMDBSearch", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders search input and button", () => {
    render(<TMDBSearch onSelect={mockOnSelect} />);

    expect(screen.getByPlaceholderText("Search TMDB...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("disables search button when input is empty", () => {
    render(<TMDBSearch onSelect={mockOnSelect} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("enables search button when input has value", async () => {
    const user = userEvent.setup();
    render(<TMDBSearch onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText("Search TMDB...");
    await user.type(input, "Matrix");

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
  });

  it("performs search on button click", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText("Search TMDB...");
    await user.type(input, "Matrix");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tmdb/search?query=Matrix"
      );
    });
  });

  it("performs search on Enter key press", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText("Search TMDB...");
    await user.type(input, "Matrix{Enter}");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tmdb/search?query=Matrix"
      );
    });
  });

  it("displays search results", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText("Search TMDB...");
    await user.type(input, "test{Enter}");

    await waitFor(() => {
      expect(screen.getByText("The Matrix")).toBeInTheDocument();
      expect(screen.getByText("Breaking Bad")).toBeInTheDocument();
    });
  });

  it("displays movie type and year for movies", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [mockResults[0]] }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "Matrix");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/Movie/)).toBeInTheDocument();
      expect(screen.getByText(/1999/)).toBeInTheDocument();
    });
  });

  it("displays TV type and year for TV shows", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [mockResults[1]] }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "Breaking");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/TV/)).toBeInTheDocument();
      expect(screen.getByText(/2008/)).toBeInTheDocument();
    });
  });

  it("displays rating when available", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [mockResults[0]] }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "Matrix");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText(/8.7/)).toBeInTheDocument();
    });
  });

  it("shows 'No results found' when search returns empty", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "xyznotfound");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("No results found")).toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "error");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("No results found")).toBeInTheDocument();
    });
  });

  it("calls onSelect with result when clicking a result", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [mockResults[0]] }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "Matrix");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("The Matrix")).toBeInTheDocument();
    });

    await user.click(screen.getByText("The Matrix"));

    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it("clears results after selection", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [mockResults[0]] }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "Matrix");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("The Matrix")).toBeInTheDocument();
    });

    await user.click(screen.getByText("The Matrix"));

    expect(screen.queryByText("The Matrix")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search TMDB...")).toHaveValue("");
  });

  it("shows N/A placeholder for items without poster", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [mockResults[2]] }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "no poster");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });

  it("encodes special characters in search query", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    render(<TMDBSearch onSelect={mockOnSelect} />);

    await user.type(screen.getByPlaceholderText("Search TMDB..."), "test & query");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tmdb/search?query=test%20%26%20query"
      );
    });
  });

  it("does not search when query is only whitespace", async () => {
    const user = userEvent.setup();

    render(<TMDBSearch onSelect={mockOnSelect} />);

    const input = screen.getByPlaceholderText("Search TMDB...");
    fireEvent.change(input, { target: { value: "   " } });
    await user.click(screen.getByRole("button"));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<TMDBSearch onSelect={mockOnSelect} className="custom-class" />);

    const container = screen.getByPlaceholderText("Search TMDB...").closest("div")?.parentElement;
    expect(container).toHaveClass("custom-class");
  });
});
