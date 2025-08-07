import Select from "@/components/common/Select"
import { useSettings } from "@/context/SettingContext"
import useResponsive from "@/hooks/useResponsive"
import { editorFonts } from "@/resources/Fonts"
import { editorThemes } from "@/resources/Themes"
import { langNames } from "@uiw/codemirror-extensions-langs"
import { useEffect } from "react"

function SettingsView() {
    const {
        theme,
        setTheme,
        language,
        setLanguage,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        resetSettings,
    } = useSettings()
    const { viewHeight } = useResponsive()

    const handleFontFamilyChange = (e) => {
        console.log("Font family changing from", fontFamily, "to", e.target.value)
        setFontFamily(e.target.value)
    }
    
    const handleThemeChange = (e) => {
        setTheme(e.target.value)
    }
    
    const handleLanguageChange = (e) => {
        setLanguage(e.target.value)
    }
    
    const handleFontSizeChange = (e) => {
        setFontSize(parseInt(e.target.value))
    }

    const handleResetSettings = () => {
        console.log("Reset button clicked")
        if (typeof resetSettings === 'function') {
            resetSettings()
            console.log("Settings reset successfully")
        } else {
            console.error("resetSettings is not a function", resetSettings)
        }
    }

    // Enhanced font application effect
    useEffect(() => {
        const applyFont = () => {
            // Multiple selectors to target different editor implementations
            const selectors = [
                ".cm-editor .cm-scroller",
                ".cm-editor",
                ".cm-content",
                ".CodeMirror",
                ".monaco-editor"
            ]

            let applied = false
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector)
                elements.forEach(element => {
                    if (element) {
                        element.style.fontFamily = `'${fontFamily}', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace`
                        element.style.fontSize = `${fontSize}px`
                        applied = true
                        console.log(`Font applied to ${selector}: ${fontFamily}, ${fontSize}px`)
                    }
                })
            })

            if (!applied) {
                console.warn("No editor elements found for font application")
            }
        }

        // Apply immediately
        applyFont()
        
        // Apply with delay to ensure editor is mounted
        const timeoutId = setTimeout(applyFont, 200)
        
        return () => clearTimeout(timeoutId)
    }, [fontFamily, fontSize])

    return (
        <div
            className="flex flex-col gap-4 p-4 overflow-y-auto"
            style={{ height: viewHeight }}
        >
            <h1 className="view-title text-xl font-bold text-center text-white">
                Settings
            </h1>
            
            {/* Font Family and Size Row */}
            <div className="flex gap-3">
                <div className="flex-2">
                    <Select
                        onChange={handleFontFamilyChange}
                        value={fontFamily}
                        options={editorFonts}
                        title="Font Family"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-sm text-gray-300 font-medium block mb-1">
                        Font Size
                    </label>
                    <select
                        value={fontSize}
                        onChange={handleFontSizeChange}
                        className="w-full appearance-none rounded-md border-none bg-darkHover px-4 py-2 pr-10 text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Font Size"
                    >
                        {[...Array(13).keys()].map((size) => {
                            const sizeValue = size + 12
                            return (
                                <option key={sizeValue} value={sizeValue} className="bg-darkHover text-white">
                                    {sizeValue}px
                                </option>
                            )
                        })}
                    </select>
                </div>
            </div>
            
            {/* Theme Selection */}
            <Select
                onChange={handleThemeChange}
                value={theme}
                options={Object.keys(editorThemes)}
                title="Editor Theme"
            />
            
            {/* Language Selection */}
            <Select
                onChange={handleLanguageChange}
                value={language}
                options={langNames}
                title="Default Language"
            />

            {/* Current Settings Display (for debugging) */}
            <div className="bg-gray-800 p-3 rounded-md text-sm">
                <h3 className="text-gray-300 font-semibold mb-2">Current Settings:</h3>
                <div className="text-gray-400 space-y-1">
                    <div>Font: {fontFamily} ({fontSize}px)</div>
                    <div>Theme: {theme}</div>
                    <div>Language: {language}</div>
                </div>
            </div>
            
            {/* Reset Button */}
            <button
                className="mt-auto w-full rounded-md border-none bg-red-600 hover:bg-red-700 transition-colors px-4 py-2 text-white outline-none font-medium"
                onClick={handleResetSettings}
            >
                Reset to Default
            </button>
        </div>
    )
}

export default SettingsView
