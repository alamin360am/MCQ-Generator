import { Navigate, createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import PublicLayout from "../components/layout/PublicLayout";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import GuestOnlyRoute from "../components/auth/GuestOnlyRoute";

import DashboardPage from "../pages/app/DashboardPage";
import CreatePage from "../pages/app/CreatePage";
import QuestionsPage from "../pages/app/QuestionsPage";
import ExamsPage from "../pages/app/ExamsPage";
import HistoryPage from "../pages/app/HistoryPage";
import SettingsPage from "../pages/app/SettingsPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import HomePage from "../pages/public/HomePage";
import PublicExamPage from "../pages/public/PublicExamPage";
import BulkImportPage from "../pages/app/BulkImportPage";
import AiImageGeneratorPage from "../pages/app/AiImageGeneratorPage";

import ExamBuilderPage from "../pages/app/ExamBuilderPage";

import ExamAttemptsPage from "../pages/app/ExamAttemptsPage";
import ExamAttemptDetailPage from "../pages/app/ExamAttemptDetailPage";

import PracticePage from "../pages/app/PracticePage";
import PracticeHistoryPage from "../pages/app/PracticeHistoryPage";

import ReportsPage from "../pages/app/ReportsPage";

import NotFoundPage from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/exam/:shareId",
        element: <PublicExamPage />,
      },
    ],
  },

  {
    element: (
      <GuestOnlyRoute>
        <AuthLayout />
      </GuestOnlyRoute>
    ),

    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },

      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },

  {
    path: "/app",

    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),

    children: [
      {
        index: true,

        element: <Navigate to="/app/dashboard" replace />,
      },

      {
        path: "dashboard",
        element: <DashboardPage />,
      },

      {
        path: "create",
        element: <CreatePage />,
      },

      {
        path: "create/ai-image",
        element: <AiImageGeneratorPage />,
      },

      {
        path: "import",
        element: <BulkImportPage />,
      },

      {
        path: "questions",
        element: <QuestionsPage />,
      },

      {
        path: "exams/new",
        element: <ExamBuilderPage />,
      },

      {
        path: "exams/:examId/edit",
        element: <ExamBuilderPage />,
      },

      {
        path: "exams/:examId/attempts",
        element: <ExamAttemptsPage />,
      },

      {
        path: "exams/:examId/attempts/:attemptId",

        element: <ExamAttemptDetailPage />,
      },

      {
        path: "practice",
        element: <PracticePage />,
      },

      {
        path: "reports",
        element: <ReportsPage />,
      },

      {
        path: "practice/history",

        element: <PracticeHistoryPage />,
      },

      {
        path: "exams",
        element: <ExamsPage />,
      },

      {
        path: "history",
        element: <HistoryPage />,
      },

      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },

  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
