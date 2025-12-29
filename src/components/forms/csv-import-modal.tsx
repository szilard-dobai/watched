"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { entryApi, tmdbApi } from "@/lib/api/fetchers";
import {
  parseCSV,
  mapRowToEntry,
  autoDetectMapping,
  inferStatus,
} from "@/lib/csv-parser";
import type {
  CSVColumnMapping,
  CSVImportResult,
  CSVRow,
  EntryFormData,
  ListWithRole,
  Entry,
} from "@/types";
import {
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lists: ListWithRole[];
  onImportComplete: () => void;
  existingEntries?: Entry[];
}

type Step = "upload" | "mapping" | "importing" | "results";

const MAPPING_OPTIONS = [
  { value: "_none", label: "(Don't import)" },
  { value: "title", label: "Title (required)" },
  { value: "mediaType", label: "Media Type" },
  { value: "status", label: "Status" },
  { value: "startDate", label: "Start Date" },
  { value: "endDate", label: "End Date" },
  { value: "platform", label: "Platform" },
  { value: "notes", label: "Notes" },
  { value: "rating", label: "Your Rating" },
];

const PREVIEW_LIMIT = 100;

export const CSVImportModal = ({
  open,
  onOpenChange,
  lists,
  onImportComplete,
  existingEntries = [],
}: CSVImportModalProps) => {
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<{
    headers: string[];
    rows: CSVRow[];
  } | null>(null);
  const [mapping, setMapping] = useState<CSVColumnMapping>({
    title: null,
    mediaType: null,
    status: null,
    startDate: null,
    endDate: null,
    platform: null,
    notes: null,
    rating: null,
  });
  const [targetListId, setTargetListId] = useState<string>("");
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });
  const [result, setResult] = useState<CSVImportResult>({
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  });

  const resetState = () => {
    setStep("upload");
    setError(null);
    setCsvData(null);
    setMapping({
      title: null,
      mediaType: null,
      status: null,
      startDate: null,
      endDate: null,
      platform: null,
      notes: null,
      rating: null,
    });
    setTargetListId("");
    setImportProgress({ current: 0, total: 0 });
    setResult({ success: 0, failed: 0, skipped: 0, errors: [] });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];

    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    try {
      const data = await parseCSV(file);

      if (data.rows.length === 0) {
        setError("CSV file is empty");
        return;
      }

      setCsvData(data);
      const detectedMapping = autoDetectMapping(data.headers);
      setMapping(detectedMapping);
      setStep("mapping");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const updateMapping = (field: keyof CSVColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value || null }));
  };

  const canImport = mapping.title && targetListId;

  const importableRows =
    csvData?.rows.filter(
      (row) => mapping.title && row[mapping.title]?.trim()
    ) || [];

  const handleImport = async () => {
    if (!csvData || !canImport) return;

    setStep("importing");
    setImportProgress({ current: 0, total: csvData.rows.length });

    const importResult: CSVImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < importableRows.length; i++) {
      const row = importableRows[i];
      setImportProgress({ current: i + 1, total: importableRows.length });

      try {
        const parsed = mapRowToEntry(row, mapping);
        if (!parsed) {
          continue;
        }

        const existingEntry = existingEntries.find(
          (e) =>
            e.listId === targetListId &&
            e.title.toLowerCase() === parsed.title.toLowerCase()
        );

        if (existingEntry) {
          const entryStatus = inferStatus(parsed);

          if (entryStatus !== "planned" && parsed.startDate) {
            const existingWatch = existingEntry.watches.find(
              (w) => w.startDate === parsed.startDate
            );

            if (existingWatch) {
              await entryApi.updateWatch(
                targetListId,
                existingEntry._id,
                existingWatch._id,
                {
                  status: entryStatus,
                  startDate: parsed.startDate || undefined,
                  endDate: parsed.endDate || undefined,
                  platform: parsed.platform || undefined,
                  notes: parsed.notes || undefined,
                }
              );
            } else {
              await entryApi.addWatch(targetListId, existingEntry._id, {
                status: entryStatus,
                startDate: parsed.startDate || undefined,
                endDate: parsed.endDate || undefined,
                platform: parsed.platform || undefined,
                notes: parsed.notes || undefined,
              });
            }
          }

          if (parsed.rating) {
            await entryApi.updateRating(
              targetListId,
              existingEntry._id,
              parsed.rating
            );
          }

          importResult.skipped++;
          continue;
        }

        let entryData: EntryFormData;
        const entryStatus = inferStatus(parsed);

        try {
          const searchResult = await tmdbApi.search(parsed.title);
          const matchingResult =
            searchResult.results.find(
              (r) => r.media_type === parsed.mediaType
            ) || searchResult.results[0];

          if (matchingResult) {
            const details = await tmdbApi.getDetails(
              matchingResult.media_type,
              matchingResult.id
            );

            const baseData = {
              tmdbId: matchingResult.id,
              mediaType: matchingResult.media_type,
              title:
                matchingResult.media_type === "movie"
                  ? (details as { title: string }).title
                  : (details as { name: string }).name,
              originalTitle:
                matchingResult.media_type === "movie"
                  ? (details as { original_title: string }).original_title
                  : (details as { original_name: string }).original_name,
              overview: details.overview,
              posterPath: details.poster_path,
              backdropPath: details.backdrop_path,
              genres: details.genres,
              voteAverage: details.vote_average,
              voteCount: details.vote_count,
              popularity: details.popularity,
              status: details.status,
              originalLanguage: details.original_language,
              platform: parsed.platform || undefined,
              notes: parsed.notes || undefined,
              rating: parsed.rating || undefined,
              ...(matchingResult.media_type === "movie"
                ? {
                    releaseDate: (details as { release_date: string })
                      .release_date,
                    runtime: (details as { runtime: number | null }).runtime,
                    imdbId: (details as { imdb_id: string | null }).imdb_id,
                  }
                : {
                    firstAirDate: (details as { first_air_date: string })
                      .first_air_date,
                    episodeRunTime: (details as { episode_run_time: number[] })
                      .episode_run_time,
                    numberOfSeasons: (details as { number_of_seasons: number })
                      .number_of_seasons,
                    numberOfEpisodes: (
                      details as { number_of_episodes: number }
                    ).number_of_episodes,
                    networks: (
                      details as {
                        networks: {
                          id: number;
                          name: string;
                          logo_path: string | null;
                        }[];
                      }
                    ).networks?.map((n) => ({
                      id: n.id,
                      name: n.name,
                      logoPath: n.logo_path,
                    })),
                  }),
            };

            if (entryStatus === "planned") {
              entryData = {
                ...baseData,
                watchStatus: "planned",
              } as EntryFormData;
            } else if (entryStatus === "in_progress") {
              entryData = {
                ...baseData,
                watchStatus: "in_progress",
                startDate:
                  parsed.startDate || new Date().toISOString().split("T")[0],
              } as EntryFormData;
            } else {
              entryData = {
                ...baseData,
                watchStatus: "finished",
                startDate:
                  parsed.startDate || new Date().toISOString().split("T")[0],
                endDate:
                  parsed.endDate ||
                  parsed.startDate ||
                  new Date().toISOString().split("T")[0],
              } as EntryFormData;
            }
          } else {
            const baseData = {
              tmdbId: 0,
              mediaType: parsed.mediaType,
              title: parsed.title,
              originalTitle: parsed.title,
              overview: "",
              posterPath: null,
              backdropPath: null,
              genres: [],
              voteAverage: 0,
              voteCount: 0,
              popularity: 0,
              status: "",
              originalLanguage: "",
              platform: parsed.platform || undefined,
              notes: parsed.notes || undefined,
              rating: parsed.rating || undefined,
            };

            if (entryStatus === "planned") {
              entryData = {
                ...baseData,
                watchStatus: "planned",
              } as EntryFormData;
            } else if (entryStatus === "in_progress") {
              entryData = {
                ...baseData,
                watchStatus: "in_progress",
                startDate:
                  parsed.startDate || new Date().toISOString().split("T")[0],
              } as EntryFormData;
            } else {
              entryData = {
                ...baseData,
                watchStatus: "finished",
                startDate:
                  parsed.startDate || new Date().toISOString().split("T")[0],
                endDate:
                  parsed.endDate ||
                  parsed.startDate ||
                  new Date().toISOString().split("T")[0],
              } as EntryFormData;
            }
          }
        } catch {
          const baseData = {
            tmdbId: 0,
            mediaType: parsed.mediaType,
            title: parsed.title,
            originalTitle: parsed.title,
            overview: "",
            posterPath: null,
            backdropPath: null,
            genres: [],
            voteAverage: 0,
            voteCount: 0,
            popularity: 0,
            status: "",
            originalLanguage: "",
            platform: parsed.platform || undefined,
            notes: parsed.notes || undefined,
            rating: parsed.rating || undefined,
          };

          if (entryStatus === "planned") {
            entryData = {
              ...baseData,
              watchStatus: "planned",
            } as EntryFormData;
          } else if (entryStatus === "in_progress") {
            entryData = {
              ...baseData,
              watchStatus: "in_progress",
              startDate:
                parsed.startDate || new Date().toISOString().split("T")[0],
            } as EntryFormData;
          } else {
            entryData = {
              ...baseData,
              watchStatus: "finished",
              startDate:
                parsed.startDate || new Date().toISOString().split("T")[0],
              endDate:
                parsed.endDate ||
                parsed.startDate ||
                new Date().toISOString().split("T")[0],
            } as EntryFormData;
          }
        }

        await entryApi.create(targetListId, entryData);
        importResult.success++;
      } catch (err) {
        importResult.failed++;
        importResult.errors.push({
          row: i + 2,
          title: row[mapping.title || ""] || "(unknown)",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    setResult(importResult);
    setStep("results");
    onImportComplete();
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Import from CSV</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file to import entries"}
            {step === "mapping" && "Map CSV columns to entry fields"}
            {step === "importing" && "Importing entries..."}
            {step === "results" && "Import complete"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600 dark:text-blue-400">
                  Drop the CSV file here...
                </p>
              ) : (
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                    Drag and drop a CSV file here, or click to select
                  </p>
                  <p className="text-sm text-zinc-500">
                    Only .csv files are accepted
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {step === "mapping" && csvData && (
          <div className="space-y-6 min-w-0">
            <div>
              <h3 className="font-medium mb-3">Select Target List</h3>
              <Select value={targetListId} onValueChange={setTargetListId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a list..." />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list._id} value={list._id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-medium mb-3">Column Mapping</h3>
              <div className="space-y-2">
                {csvData.headers.map((header) => {
                  const currentMapping = Object.entries(mapping).find(
                    ([, value]) => value === header
                  )?.[0];

                  return (
                    <div
                      key={header}
                      className="flex items-center gap-4 p-2 bg-zinc-50 dark:bg-zinc-900 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                        <FileSpreadsheet className="h-4 w-4 text-zinc-400" />
                        <span className="font-mono text-sm">{header}</span>
                      </div>
                      <span className="text-zinc-400">→</span>
                      <Select
                        value={currentMapping || "_none"}
                        onValueChange={(value) => {
                          if (currentMapping) {
                            setMapping((prev) => ({
                              ...prev,
                              [currentMapping]: null,
                            }));
                          }
                          if (value && value !== "_none") {
                            updateMapping(
                              value as keyof CSVColumnMapping,
                              header
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1 w-[180px]">
                          <SelectValue placeholder="Don't import" />
                        </SelectTrigger>
                        <SelectContent>
                          {MAPPING_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Preview</h3>
              <div className="w-full overflow-x-auto border rounded dark:border-zinc-800">
                <table className="min-w-max text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      {csvData.headers.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left font-medium"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importableRows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                      <tr key={i} className="border-t dark:border-zinc-800">
                        {csvData.headers.map((header) => (
                          <td
                            key={header}
                            className="px-3 py-2 truncate max-w-[150px]"
                          >
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importableRows.length - PREVIEW_LIMIT > 0 && (
                <p className="text-sm text-zinc-500 mt-2">
                  ...and {importableRows.length - PREVIEW_LIMIT} more
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!canImport || importableRows.length === 0}
              >
                Import {importableRows.length} rows
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium mb-2">Importing entries...</p>
            <p className="text-zinc-500">
              Processing row {importProgress.current} of {importProgress.total}
            </p>
            <div className="mt-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(importProgress.current / importProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.success}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Created
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {result.skipped}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Updated
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                <XCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.failed}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Errors</h3>
                <div className="max-h-[200px] overflow-y-auto border rounded dark:border-zinc-800">
                  {result.errors.map((err, i) => (
                    <div
                      key={i}
                      className="p-2 border-b last:border-b-0 dark:border-zinc-800 text-sm"
                    >
                      <span className="text-zinc-500">Row {err.row}:</span>{" "}
                      <span className="font-medium">{err.title}</span> -{" "}
                      <span className="text-red-600 dark:text-red-400">
                        {err.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
