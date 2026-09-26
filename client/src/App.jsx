import { RouterProvider } from "react-router-dom";

import { router } from "./app/router";

import AuthBootstrap from "./components/auth/AuthBootstrap";
import ThemeSync from "./components/theme/ThemeSync";

function App() {
  return (
    <>
      <ThemeSync />

      <AuthBootstrap />

      <RouterProvider router={router} />
    </>
  );
}

export default App;
