import { useMemo, useRef, useState } from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Images,
  LoaderCircle,
  Sparkles,
  Upload,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  deleteSourceImage,
  generateImageMcqs,
  saveGeneratedImageMcqs,
  uploadSourceImages,
} from "../../features/ai/aiApi";

import {
  prepareGeneratedQuestions,
  questionToSavePayload,
  validateAiQuestion,
} from "../../features/ai/aiQuestionUtils";

import AiQuestionCard from "../../features/ai/AiQuestionCard";
import SortableSourceImage from "../../features/ai/SortableSourceImage";

import TaxonomyModal from "../../features/questions/TaxonomyModal";

import {
  createSubject,
  createTopic,
  fetchSubjects,
  fetchTopics,
} from "../../features/questions/questionApi";

const MAX_IMAGES = 8;

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function AiImageGeneratorPage() {
  const queryClient = useQueryClient();

  const galleryInputRef = useRef(null);

  const cameraInputRef = useRef(null);

  const [images, setImages] = useState([]);

  const [questionCount, setQuestionCount] = useState(10);

  const [language, setLanguage] = useState("auto");

  const [difficulty, setDifficulty] = useState("mixed");

  const [customInstructions, setCustomInstructions] = useState("");

  const [questions, setQuestions] = useState([]);

  const [generationMeta, setGenerationMeta] = useState(null);

  const [subjectId, setSubjectId] = useState("");

  const [topicId, setTopicId] = useState("");

  const [pageError, setPageError] = useState("");

  const [saveSuccess, setSaveSuccess] = useState(null);

  const [taxonomyModal, setTaxonomyModal] = useState({
    open: false,
    mode: "subject",
    subjectId: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],

    queryFn: fetchSubjects,
  });

  const topicsQuery = useQuery({
    queryKey: ["topics"],

    queryFn: () => fetchTopics(),
  });

  const subjects = subjectsQuery.data?.subjects || [];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const topics = topicsQuery.data?.topics || [];

  const filteredTopics = useMemo(() => {
    if (!subjectId) {
      return [];
    }

    return topics.filter((topic) => {
      const topicSubjectId =
        typeof topic.subject === "object" ? topic.subject?._id : topic.subject;

      return topicSubjectId === subjectId;
    });
  }, [subjectId, topics]);

  const uploadMutation = useMutation({
    mutationFn: uploadSourceImages,

    onSuccess: (data) => {
      setImages((current) => [...current, ...data.images]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSourceImage,

    onSuccess: (_data, imageId) => {
      setImages((current) => current.filter((image) => image.id !== imageId));
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateImageMcqs,

    onSuccess: (data) => {
      const generation = data.generation;

      setGenerationMeta(generation);

      setQuestions(
        prepareGeneratedQuestions(generation.questions, images.length),
      );

      setSaveSuccess(null);

      setPageError("");

      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveGeneratedImageMcqs,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["questions"],
      });

      setSaveSuccess({
        count: data.savedCount,
      });

      setPageError("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  const subjectMutation = useMutation({
    mutationFn: createSubject,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["subjects"],
      });

      setSubjectId(data.subject._id);

      setTopicId("");

      closeTaxonomyModal();
    },
  });

  const topicMutation = useMutation({
    mutationFn: createTopic,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["topics"],
      });

      setTopicId(data.topic._id);

      closeTaxonomyModal();
    },
  });

  const sourceLocked = questions.length > 0;

  const selectedQuestions = questions.filter((question) => question.selected);

  const selectedInvalid = selectedQuestions.filter(
    (question) => !question.isValid,
  );

  const selectedValid = selectedQuestions.filter(
    (question) => question.isValid,
  );

  const handleFiles = async (fileList) => {
    setPageError("");
    setSaveSuccess(null);

    const files = Array.from(fileList || []);

    if (files.length === 0) {
      return;
    }

    if (images.length + files.length > MAX_IMAGES) {
      setPageError(`Maximum ${MAX_IMAGES} source images are allowed.`);

      return;
    }

    const invalidType = files.find((file) => !ALLOWED_TYPES.has(file.type));

    if (invalidType) {
      setPageError(`${invalidType.name} is not a supported image type.`);

      return;
    }

    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversized) {
      setPageError(`${oversized.name} is larger than 8 MB.`);

      return;
    }

    try {
      await uploadMutation.mutateAsync(files);
    } catch (error) {
      setPageError(error.message || "Could not upload images.");
    }
  };

  const handleFileInput = async (event) => {
    await handleFiles(event.target.files);

    event.target.value = "";
  };

  const handleDeleteImage = async (imageId) => {
    if (sourceLocked) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(imageId);
    } catch (error) {
      setPageError(error.message || "Could not delete image.");
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (sourceLocked || !over || active.id === over.id) {
      return;
    }

    setImages((current) => {
      const oldIndex = current.findIndex((image) => image.id === active.id);

      const newIndex = current.findIndex((image) => image.id === over.id);

      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleGenerate = async () => {
    setPageError("");
    setSaveSuccess(null);

    if (images.length === 0) {
      setPageError("Upload at least one book page first.");

      return;
    }

    const normalizedCount = Number(questionCount);

    if (
      !Number.isInteger(normalizedCount) ||
      normalizedCount < 1 ||
      normalizedCount > 40
    ) {
      setPageError("Question count must be between 1 and 40.");

      return;
    }

    try {
      await generateMutation.mutateAsync({
        imageIds: images.map((image) => image.id),

        questionCount: normalizedCount,

        language,

        difficulty,

        customInstructions: customInstructions.trim(),
      });
    } catch (error) {
      setPageError(error.message || "AI generation failed.");
    }
  };

  const handleQuestionChange = (localId, updatedQuestion) => {
    setQuestions((current) =>
      current.map((question) =>
        question.localId === localId
          ? validateAiQuestion(updatedQuestion, images.length)
          : question,
      ),
    );
  };

  const handleQuestionDelete = (localId) => {
    setQuestions((current) =>
      current.filter((question) => question.localId !== localId),
    );
  };

  const selectAll = (selected) => {
    setQuestions((current) =>
      current.map((question) => ({
        ...question,
        selected,
      })),
    );
  };

  const handleEditSources = () => {
    const confirmed = window.confirm(
      "Generated questions will be cleared so you can reorder or change source pages. Continue?",
    );

    if (!confirmed) {
      return;
    }

    setQuestions([]);
    setGenerationMeta(null);
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    setPageError("");

    if (selectedQuestions.length === 0) {
      setPageError("Select at least one question to save.");

      return;
    }

    if (selectedInvalid.length > 0) {
      setPageError("Fix or deselect invalid questions before saving.");

      return;
    }

    try {
      await saveMutation.mutateAsync({
        imageIds: images.map((image) => image.id),

        subjectId: subjectId || null,

        topicId: topicId || null,

        questions: selectedValid.map(questionToSavePayload),
      });
    } catch (error) {
      setPageError(error.message || "Could not save generated questions.");
    }
  };

  const handleNewGeneration = () => {
    setImages([]);
    setQuestions([]);
    setGenerationMeta(null);
    setSaveSuccess(null);
    setPageError("");
    setSubjectId("");
    setTopicId("");
  };

  function closeTaxonomyModal() {
    setTaxonomyModal({
      open: false,
      mode: "subject",
      subjectId: "",
    });
  }

  return (
    <>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            AI Image MCQ Generator
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Upload photographed or scanned book pages, let AI generate grounded
            MCQs, then review every question before saving.
          </p>
        </section>

        {saveSuccess && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" />

              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  {saveSuccess.count} AI-generated questions saved successfully.
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    to="/app/questions"
                    className="text-sm font-semibold text-emerald-700 underline dark:text-emerald-400"
                  >
                    View Question Bank
                  </Link>

                  <button
                    type="button"
                    onClick={handleNewGeneration}
                    className="text-sm font-semibold text-emerald-700 underline dark:text-emerald-400"
                  >
                    Start New Generation
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Images size={21} />
            </div>

            <div>
              <h3 className="font-bold">Source Pages</h3>

              <p className="mt-1 text-sm text-slate-500">
                Upload up to 8 pages in reading order.
              </p>
            </div>
          </div>

          {!sourceLocked && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  uploadMutation.isPending || images.length >= MAX_IMAGES
                }
                onClick={() => galleryInputRef.current?.click()}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-semibold disabled:opacity-40 dark:border-slate-700"
              >
                <ImagePlus size={18} />
                Choose Images
              </button>

              <button
                type="button"
                disabled={
                  uploadMutation.isPending || images.length >= MAX_IMAGES
                }
                onClick={() => cameraInputRef.current?.click()}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 font-semibold disabled:opacity-40 dark:border-slate-700"
              >
                <Camera size={18} />
                Take Photo
              </button>

              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handleFileInput}
                className="hidden"
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950">
              <LoaderCircle
                size={17}
                className="animate-spin text-emerald-600"
              />
              Uploading source pages...
            </div>
          )}

          {images.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <Upload size={30} className="mx-auto text-slate-400" />

              <p className="mt-3 font-semibold">No source pages uploaded</p>

              <p className="mt-1 text-sm text-slate-400">
                Clear, well-lit, straight book photos give better results.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {images.length}/{MAX_IMAGES} pages
                </p>

                {sourceLocked && (
                  <button
                    type="button"
                    onClick={handleEditSources}
                    className="text-sm font-semibold text-emerald-600"
                  >
                    Edit Sources
                  </button>
                )}
              </div>

              {!sourceLocked && (
                <p className="mt-1 text-xs text-slate-400">
                  Drag pages to change reading order.
                </p>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((image) => image.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map((image, index) => (
                      <SortableSourceImage
                        key={image.id}
                        image={image}
                        pageNumber={index + 1}
                        disabled={sourceLocked}
                        isDeleting={deleteMutation.isPending}
                        onDelete={handleDeleteImage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </section>

        {images.length > 0 && questions.length === 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                <Sparkles size={21} />
              </div>

              <div>
                <h3 className="font-bold">Generation Settings</h3>

                <p className="mt-1 text-sm text-slate-500">
                  AI may return fewer questions if the source material is
                  limited.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Number of Questions
                </label>

                <input
                  type="number"
                  min="1"
                  max="40"
                  value={questionCount}
                  onChange={(event) => setQuestionCount(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Language
                </label>

                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="auto">Auto detect</option>

                  <option value="bn">Bengali</option>

                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Difficulty
                </label>

                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="mixed">Mixed</option>

                  <option value="easy">Easy</option>

                  <option value="medium">Medium</option>

                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold">
                Custom Instructions
                <span className="ml-1 font-normal text-slate-400">
                  optional
                </span>
              </label>

              <textarea
                rows="3"
                maxLength={1000}
                value={customInstructions}
                onChange={(event) => setCustomInstructions(event.target.value)}
                placeholder="Example: Focus on BCS-style factual questions. Avoid overly simple questions."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {customInstructions.length}
                /1000
              </p>
            </div>

            <button
              type="button"
              disabled={generateMutation.isPending}
              onClick={handleGenerate}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-bold text-white disabled:opacity-60"
            >
              {generateMutation.isPending ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Generating MCQs...
                </>
              ) : (
                <>
                  <Sparkles size={19} />
                  Generate MCQs
                </>
              )}
            </button>
          </section>
        )}

        {generateMutation.isPending && (
          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/20">
            <div className="flex items-start gap-3">
              <LoaderCircle
                size={22}
                className="mt-0.5 shrink-0 animate-spin text-violet-600"
              />

              <div>
                <p className="font-semibold">
                  AI is reading your source pages...
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  This may take a little time depending on image count and model
                  availability.
                </p>
              </div>
            </div>
          </section>
        )}

        {generationMeta && questions.length > 0 && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryBox
                  label="Requested"
                  value={generationMeta.requestedCount}
                />

                <SummaryBox
                  label="Generated"
                  value={generationMeta.generatedCount}
                />

                <SummaryBox label="Selected" value={selectedQuestions.length} />

                <SummaryBox label="Needs Fix" value={selectedInvalid.length} />
              </div>

              {generationMeta.sourceSummary && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold">Source Summary</h3>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {generationMeta.sourceSummary}
                  </p>
                </div>
              )}

              {generationMeta.warnings?.length > 0 && (
                <div className="mt-5 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    AI Warnings
                  </p>

                  <div className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-400">
                    {generationMeta.warnings.map((warning, index) => (
                      <p key={`${warning}-${index}`}>• {warning}</p>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold">Save Settings</h3>

              <p className="mt-1 text-sm text-slate-500">
                Subject and topic will apply to all selected questions.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold">Subject</label>

                    <button
                      type="button"
                      onClick={() =>
                        setTaxonomyModal({
                          open: true,
                          mode: "subject",
                          subjectId: "",
                        })
                      }
                      className="text-xs font-semibold text-emerald-600"
                    >
                      + New
                    </button>
                  </div>

                  <select
                    value={subjectId}
                    onChange={(event) => {
                      setSubjectId(event.target.value);

                      setTopicId("");
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">No subject</option>

                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold">Topic</label>

                    <button
                      type="button"
                      disabled={!subjectId}
                      onClick={() =>
                        setTaxonomyModal({
                          open: true,
                          mode: "topic",
                          subjectId,
                        })
                      }
                      className="text-xs font-semibold text-emerald-600 disabled:text-slate-400"
                    >
                      + New
                    </button>
                  </div>

                  <select
                    value={topicId}
                    disabled={!subjectId}
                    onChange={(event) => setTopicId(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">No topic</option>

                    {filteredTopics.map((topic) => (
                      <option key={topic._id} value={topic._id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-bold">Review AI Questions</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Verify facts, answers and explanations before saving.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => selectAll(true)}
                    className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold dark:bg-slate-800"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={() => selectAll(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {questions.map((question, index) => (
                  <AiQuestionCard
                    key={question.localId}
                    question={question}
                    index={index}
                    sourceImages={images}
                    onChange={(updated) =>
                      handleQuestionChange(question.localId, updated)
                    }
                    onDelete={() => handleQuestionDelete(question.localId)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {pageError && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {pageError}
          </section>
        )}

        {questions.length > 0 && (
          <section className="sticky bottom-20 z-30 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur lg:bottom-4 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {selectedValid.length} valid selected
                </p>

                {selectedInvalid.length > 0 && (
                  <p className="mt-1 text-xs text-red-500">
                    {selectedInvalid.length} selected questions need fixing.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={
                  saveMutation.isPending ||
                  selectedQuestions.length === 0 ||
                  selectedInvalid.length > 0 ||
                  Boolean(saveSuccess)
                }
                onClick={handleSave}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveMutation.isPending ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Save {selectedQuestions.length} Questions
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </div>

      {taxonomyModal.open && (
        <TaxonomyModal
          key={`${taxonomyModal.mode}-${taxonomyModal.subjectId || "none"}`}
          open
          mode={taxonomyModal.mode}
          subjects={subjects}
          defaultSubjectId={taxonomyModal.subjectId}
          isSubmitting={
            taxonomyModal.mode === "subject"
              ? subjectMutation.isPending
              : topicMutation.isPending
          }
          onClose={closeTaxonomyModal}
          onSubmit={async ({ name, subjectId: selectedSubjectId }) => {
            if (taxonomyModal.mode === "subject") {
              await subjectMutation.mutateAsync(name);

              return;
            }

            await topicMutation.mutateAsync({
              name,

              subjectId: selectedSubjectId,
            });
          }}
        />
      )}
    </>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-950">
      <p className="text-xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

export default AiImageGeneratorPage;
