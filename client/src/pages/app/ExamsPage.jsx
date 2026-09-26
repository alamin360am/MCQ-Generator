import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ClipboardList, Plus } from "lucide-react";

import { Link } from "react-router-dom";

import ExamCard from "../../features/exams/ExamCard";

import {
  archiveExam,
  deleteExam,
  fetchExams,
  publishExam,
} from "../../features/exams/examApi";

function ExamsPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const examsQuery = useQuery({
    queryKey: ["exams", statusFilter],

    queryFn: () => fetchExams(statusFilter),
  });

  const publishMutation = useMutation({
    mutationFn: publishExam,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });

      setError("");

      setMessage(data.message);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveExam,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });

      setMessage("Exam archived successfully.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExam,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });

      setMessage("Draft deleted successfully.");
    },
  });

  const exams = examsQuery.data?.exams || [];

  const handlePublish = async (exam) => {
    setMessage("");
    setError("");

    const confirmed = window.confirm(
      exam.currentVersion > 0
        ? "Publish a new version of this exam?"
        : "Publish this exam?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await publishMutation.mutateAsync(exam.id);
    } catch (publishError) {
      setError(publishError.message);
    }
  };

  const handleArchive = async (exam) => {
    const confirmed = window.confirm("Archive this exam?");

    if (!confirmed) {
      return;
    }

    try {
      await archiveMutation.mutateAsync(exam.id);
    } catch (archiveError) {
      setError(archiveError.message);
    }
  };

  const handleDelete = async (exam) => {
    const confirmed = window.confirm("Delete this draft permanently?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(exam.id);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleCopyLink = async (exam) => {
    const url = `${window.location.origin}/exam/${exam.shareId}`;

    try {
      await navigator.clipboard.writeText(url);

      setMessage("Share link copied.");

      setError("");
    } catch {
      window.prompt("Copy this exam link:", url);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Exams</h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create, publish and manage shareable MCQ exams.
          </p>
        </div>

        <Link
          to="/app/exams/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white"
        >
          <Plus size={18} />
          Create Exam
        </Link>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {[
          {
            value: "",
            label: "All",
          },
          {
            value: "draft",
            label: "Draft",
          },
          {
            value: "published",
            label: "Published",
          },
          {
            value: "archived",
            label: "Archived",
          },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setStatusFilter(item.value)}
            className={[
              "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition",
              statusFilter === item.value
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6">
        {examsQuery.isLoading ? (
          <div className="flex min-h-56 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800" />
          </div>
        ) : examsQuery.isError ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {examsQuery.error.message}
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <ClipboardList size={36} className="mx-auto text-slate-400" />

            <h3 className="mt-4 font-bold">No exams found</h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Select questions from your Question Bank and create your first
              exam.
            </p>

            <Link
              to="/app/exams/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Create Exam
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onPublish={handlePublish}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onCopyLink={handleCopyLink}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExamsPage;
