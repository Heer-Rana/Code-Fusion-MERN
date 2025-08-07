import { useCopilot } from "@/context/CopilotContext";
import { useFileSystem } from "@/context/FileContext";
import { useSocket } from "@/context/SocketContext";
import useResponsive from "@/hooks/useResponsive";
import { SocketEvent } from "@/types/socket";
import toast from "react-hot-toast";
import { LuClipboardPaste, LuCopy, LuRepeat } from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

function CopilotView() {
  const { socket } = useSocket() || {};
  const { viewHeight } = useResponsive();

  const copilot = useCopilot();
  const {
    generateCode,
    output = "",
    isRunning,
    setInput,
  } = copilot ?? {};

  const fileSystem = useFileSystem();
  const {
    activeFile,
    updateFileContent,
    setActiveFile,
  } = fileSystem ?? {};

  const [inputText, setInputText] = useState("");

  const cleanOutput = (rawOutput) =>
    rawOutput.replace(/^```[\w]*\n|```$/gm, "").trim();

  const copyOutput = async () => {
    try {
      const content = cleanOutput(output);
      if (!content) return toast.error("Nothing to copy");
      await navigator.clipboard.writeText(content);
      toast.success("Output copied to clipboard");
    } catch (error) {
      toast.error("Unable to copy output to clipboard");
      console.error(error);
    }
  };

  const pasteCodeInFile = () => {
    if (!activeFile || !output) return;

    const existingContent = activeFile.content || "";
    const newContent = `${existingContent}\n${cleanOutput(output)}`;
    updateFileContent(activeFile.id, newContent);
    setActiveFile({ ...activeFile, content: newContent });

    toast.success("Code pasted successfully");

    socket?.emit(SocketEvent.FILE_UPDATED, {
      fileId: activeFile.id,
      newContent,
    });
  };

  const replaceCodeInFile = () => {
    if (!activeFile || !output) return;

    const confirmReplace = confirm(
      "Replace current file content with Copilot output?"
    );
    if (!confirmReplace) return;

    const newContent = cleanOutput(output);
    updateFileContent(activeFile.id, newContent);
    setActiveFile({ ...activeFile, content: newContent });

    toast.success("Code replaced successfully");

    socket?.emit(SocketEvent.FILE_UPDATED, {
      fileId: activeFile.id,
      newContent,
    });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    setInput?.(value);
  };

  return (
    <div
      className="flex max-h-full min-h-[400px] w-full flex-col gap-2 p-4"
      style={{ height: viewHeight }}
    >
      <h1 className="view-title">Copilot</h1>

      <textarea
        className="min-h-[120px] w-full rounded-md border-none bg-darkHover p-2 text-white outline-none"
        placeholder="What code do you want to generate?"
        value={inputText}
        onChange={handleInputChange}
      />

      <button
        className="mt-1 flex w-full justify-center rounded-md bg-primary p-2 font-bold text-black outline-none disabled:cursor-not-allowed disabled:opacity-50"
        onClick={generateCode}
        disabled={isRunning || !inputText.trim()}
      >
        {isRunning ? "Generating..." : "Generate Code"}
      </button>

      {output && (
        <div className="flex justify-end gap-4 pt-2">
          <button title="Copy Output" onClick={copyOutput}>
            <LuCopy size={18} className="cursor-pointer text-white" />
          </button>
          <button title="Replace code in file" onClick={replaceCodeInFile}>
            <LuRepeat size={18} className="cursor-pointer text-white" />
          </button>
          <button title="Paste code in file" onClick={pasteCodeInFile}>
            <LuClipboardPaste size={18} className="cursor-pointer text-white" />
          </button>
        </div>
      )}

      <div className="h-full w-full overflow-y-auto rounded-lg p-0">
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "javascript";

              return !inline ? (
                <SyntaxHighlighter
                  style={dracula}
                  language={language}
                  PreTag="div" // ✅ prevent <pre> inside <p>
                  className="!m-0 !h-full !rounded-lg !bg-gray-900 !p-2"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            pre({ children }) {
              return <div className="h-full">{children}</div>; // ✅ render <pre> as <div>
            },
            p({ children }) {
              return <div className="mb-2">{children}</div>; // ✅ replace <p> with <div>
            },
          }}
        >
          {output}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default CopilotView;
