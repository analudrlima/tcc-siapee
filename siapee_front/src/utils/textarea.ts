import { useEffect, useRef } from 'react'

// Auto-resize textarea utility
export const autoResizeTextarea = (element: HTMLTextAreaElement) => {
  element.style.height = 'auto'
  element.style.height = Math.max(element.scrollHeight, 100) + 'px'
}

// Hook for auto-resizing textarea
export const useAutoResizeTextarea = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    autoResizeTextarea(e.target)
    return e
  }

  return { textareaRef, handleChange }
}
