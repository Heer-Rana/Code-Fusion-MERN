import { AppContextProvider } from "./AppContext.jsx"
import { ChatContextProvider } from "./ChatContext.jsx"
import { FileContextProvider } from "./FileContext.jsx"
import { RunCodeContextProvider } from "./RunCodeContext.jsx"
import { SettingContextProvider } from "./SettingContext.jsx"
import { SocketProvider } from "./SocketContext.jsx"
import { CopilotContextProvider } from "./CopilotContext.jsx" // ✅ Copilot context added

function AppProvider({ children }) {
  return (
    <AppContextProvider>
      <SocketProvider>
        <SettingContextProvider>
          <FileContextProvider>
            <RunCodeContextProvider>
              <ChatContextProvider>
                <CopilotContextProvider>
                  {children}
                </CopilotContextProvider>
              </ChatContextProvider>
            </RunCodeContextProvider>
          </FileContextProvider>
        </SettingContextProvider>
      </SocketProvider>
    </AppContextProvider>
  )
}

export default AppProvider
