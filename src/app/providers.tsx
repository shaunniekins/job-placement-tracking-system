"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Provider as ReduxProvider } from "react-redux"; // Import Redux Provider
import { store } from "./reduxUtils/store"; // Import your Redux store

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Wrap with Redux Provider
    <ReduxProvider store={store}>
      {/* Assuming NextUIProvider is also used */}
      <NextUIProvider>{children}</NextUIProvider>
    </ReduxProvider>
  );
}
