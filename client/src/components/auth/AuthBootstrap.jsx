import { useEffect, useRef } from "react";

import { refreshAccessToken } from "../../lib/api";

function AuthBootstrap() {
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    refreshAccessToken();
  }, []);

  return null;
}

export default AuthBootstrap;
