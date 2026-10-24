'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';

/**
 * Bọc next-themes (attribute="class") để đồng bộ với
 * `@custom-variant dark` trong globals.css.
 * Mặc định "light" (nền trắng); người dùng có thể đổi sang "dark".
 */
export function ThemeController({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
