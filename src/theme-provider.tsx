import { Theme } from "@radix-ui/themes";
import {
  type FC,
  type PropsWithChildren,
  createContext,
  useState,
} from "react";

type DarkMode = "dark" | "light";

type ThemeContextType = {
  darkMode: DarkMode;
  toggleDarkMode: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  darkMode: "light",
  toggleDarkMode: () => {
    return;
  },
});

export const ThemeProvider: FC<PropsWithChildren> = (props) => {
  const [darkMode, setDarkMode] = useState(getDarkMode);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(LOCALSTORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ toggleDarkMode, darkMode }}>
      <Theme appearance={darkMode}>{props.children}</Theme>
    </ThemeContext.Provider>
  );
};

const LOCALSTORAGE_KEY = "darkmode";

function getDarkMode(): DarkMode {
  const item = localStorage.getItem(LOCALSTORAGE_KEY);
  if (item === "dark" || item === "light") {
    return item;
  }
  const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  localStorage.setItem(LOCALSTORAGE_KEY, darkMode);
  return darkMode;
}
