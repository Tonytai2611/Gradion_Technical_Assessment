import { createBrowserRouter, Navigate } from "react-router-dom";
import { IdentityPage } from "../features/auth/ui/IdentityPage";
import { RequireAuth } from "../features/auth/ui/RequireAuth";
import { ProjectsPage } from "../features/projects/ui/ProjectsPage";
import { NewProjectPage } from "../features/projects/ui/NewProjectPage";
import { ProjectDetailPage } from "../features/pipeline/ui/ProjectDetailPage";

export const router = createBrowserRouter([
  { path: "/", element: <IdentityPage /> },
  { path: "/projects", element: <RequireAuth><ProjectsPage /></RequireAuth> },
  { path: "/projects/new", element: <RequireAuth><NewProjectPage /></RequireAuth> },
  { path: "/projects/:projectId", element: <RequireAuth><ProjectDetailPage /></RequireAuth> },
  { path: "*", element: <Navigate to="/projects" replace /> }
]);
