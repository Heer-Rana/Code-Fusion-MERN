import axiosInstance from "@/api/pistonApi";
import langMap from "lang-map";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useFileSystem } from "./FileContext";

const RunCodeContext = createContext(null);

export const useRunCode = () => {
  const context = useContext(RunCodeContext);
  if (context === null) {
    throw new Error("useRunCode must be used within a RunCodeContextProvider");
  }
  return context;
};

const RunCodeContextProvider = ({ children }) => {
  const { activeFile } = useFileSystem();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState([]);

  useEffect(() => {
    const fetchSupportedLanguages = async () => {
      try {
        const res = await axiosInstance.get("/runtimes");
        setSupportedLanguages(res.data);
      } catch (error) {
        toast.error("Failed to fetch supported languages");
        console.error(error?.response?.data || error);
      }
    };

    fetchSupportedLanguages();
  }, []);

  const runCode = async () => {
    if (!activeFile?.name || !activeFile?.content) {
      toast.error("Please open a file to run the code");
      return;
    }

    const extension = activeFile.name.split(".").pop();
    const languageNames = langMap.languages(extension);

    if (!languageNames || languageNames.length === 0) {
      toast.error("Could not determine language from file extension");
      return;
    }

    let matchedLanguage = null;

    // --- Start of improved language matching logic ---
    // 1. Try to find a direct match by language name from langMap
    for (const name of languageNames) {
      matchedLanguage = supportedLanguages.find(
        (lang) => lang.language.toLowerCase() === name.toLowerCase()
      );
      if (matchedLanguage) break;
    }

    // 2. If no direct language name match, try by extension in aliases
    if (!matchedLanguage) {
        matchedLanguage = supportedLanguages.find((lang) =>
            lang.aliases.includes(extension)
        );
    }

    // 3. Special handling for Python if still not matched (common alias is "py")
    // This provides a fallback if langMap doesn't return "python" explicitly but the extension is "py"
    if (!matchedLanguage && extension === "py") {
        matchedLanguage = supportedLanguages.find(
            (lang) => lang.language.toLowerCase() === "python" || lang.aliases.includes("python") || lang.aliases.includes("py")
        );
        // As a last resort, if multiple python versions, pick the first one, or specific one.
        // For public API, it's usually "python" and a recent version.
        if (!matchedLanguage) {
            matchedLanguage = supportedLanguages.find(lang => lang.language.toLowerCase().startsWith("python"));
        }
    }

    // --- End of improved language matching logic ---

    // Temporary log for debugging: Check what language object was picked
    console.log("--- Language Matching Debug Info ---");
    console.log("File Extension:", extension);
    console.log("Language Names from lang-map:", languageNames);
    console.log("Supported Languages (fetched from API):", supportedLanguages);
    console.log("Chosen Matched Language:", matchedLanguage);
    console.log("------------------------------------");


    if (!matchedLanguage) {
      toast.error("Language not supported or detected for this file.");
      return;
    }

    // Crucial: Use the language and version from the *matched* language object
    const { language, version } = matchedLanguage;

    try {
      toast.dismiss();
      toast.loading("Running code...");
      setIsRunning(true);
      setOutput(""); // Clear previous output

      const payload = {
        language,
        version,
        files: [
          {
            name: activeFile.name,
            content: activeFile.content.trim(), // optional cleanup
          },
        ],
        stdin: input,
      };

      // Log the payload to confirm language and version before sending
      console.log("Payload being sent:", payload);

      const response = await axiosInstance.post("/execute", payload);

      const { stdout, stderr, signal } = response.data.run;

      if (stderr) {
        setOutput(stderr);
      } else if (signal) {
        setOutput(`Execution terminated with signal: ${signal}`);
      } else {
        setOutput(stdout);
      }
    } catch (error) {
      console.error("Execution error:", error?.response?.data || error);
      setOutput("Failed to run the code");
      toast.error("Execution failed");
    } finally {
      setIsRunning(false);
      toast.dismiss();
    }
  };

  return (
    <RunCodeContext.Provider
      value={{
        setInput,
        input,
        output,
        isRunning,
        supportedLanguages,
        runCode,
      }}
    >
      {children}
    </RunCodeContext.Provider>
  );
};

export { RunCodeContextProvider };
export default RunCodeContext;