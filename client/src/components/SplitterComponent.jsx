import { useViews } from "@/context/ViewContext"
import useLocalStorage from "@/hooks/useLocalStorage"
import useWindowDimensions from "@/hooks/useWindowDimensions"
import Split from "react-split"
import React from "react"

function SplitterComponent({ children }) {
    const { isSidebarOpen } = useViews()
    const { isMobile, width } = useWindowDimensions()
    const { setItem, getItem } = useLocalStorage()

    const getGutter = () => {
        const gutter = document.createElement("div")
        gutter.className = "gutter"
        gutter.style.backgroundColor = "#444"
        gutter.style.cursor = "col-resize"
        gutter.style.width = "6px"
        gutter.style.zIndex = "10"
        return gutter
    }

    const getSizes = () => {
        if (isMobile) return [0, 100]
        const saved = getItem("editorSizes")
        try {
            const parsed = JSON.parse(saved)
            return isSidebarOpen ? parsed : [0, 100]
        } catch {
            return isSidebarOpen ? [25, 75] : [0, 100]
        }
    }

    const getMinSizes = () => {
        if (isMobile) return [0, width]
        return isSidebarOpen ? [200, 300] : [0, width]
    }

    const getMaxSizes = () => {
        if (isMobile) return [0, Infinity]
        return isSidebarOpen ? [600, Infinity] : [0, Infinity]
    }

    const handleGutterDrag = (sizes) => {
        setItem("editorSizes", JSON.stringify(sizes))
    }

    const getGutterStyle = () => ({
        width: "6px",
        backgroundColor: "#555",
        display: isSidebarOpen && !isMobile ? "block" : "none",
    })

    return (
        <Split
            sizes={getSizes()}
            minSize={getMinSizes()}
            maxSize={getMaxSizes()}
            direction="horizontal"
            gutter={getGutter}
            gutterStyle={getGutterStyle}
            onDrag={handleGutterDrag}
            snapOffset={20}
            dragInterval={1}
            className="flex h-screen w-screen overflow-hidden"
        >
            {children}
        </Split>
    )
}

export default SplitterComponent
