import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Link, useNavigate, useParams } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import ExamBuilderForm from "../../features/exams/ExamBuilderForm";

import {
  createExam,
  fetchExam,
  updateExam,
} from "../../features/exams/examApi";

function ExamBuilderPage() {
  const { examId } = useParams();

  const isEditing = Boolean(examId);

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const examQuery = useQuery({
    queryKey: ["exam", examId],

    queryFn: () => fetchExam(examId),

    enabled: isEditing,
  });

  const createMutation = useMutation({
    mutationFn: createExam,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });

      navigate("/app/exams", {
        replace: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateExam,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });

      queryClient.invalidateQueries({
        queryKey: ["exam", examId],
      });

      navigate("/app/exams", {
        replace: true,
      });
    },
  });

  if (isEditing && examQuery.isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800" />
      </div>
    );
  }

  if (isEditing && examQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        {examQuery.error.message}
      </div>
    );
  }

  const exam = examQuery.data?.exam || null;

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/app/exams"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to exams
        </Link>

        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          {isEditing ? "Edit Exam" : "Create Exam"}
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Select questions, configure the exam and save it as a draft.
        </p>
      </div>

      {isEditing && exam ? (
        <ExamBuilderForm
          key={exam.id}
          initialExam={exam}
          isSubmitting={updateMutation.isPending}
          onSubmit={(payload) =>
            updateMutation.mutateAsync({
              id: exam.id,

              payload,
            })
          }
        />
      ) : (
        <ExamBuilderForm
          key="new-exam"
          isSubmitting={createMutation.isPending}
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
        />
      )}
    </div>
  );
}

export default ExamBuilderPage;
