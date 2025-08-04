export interface TextInputRef {
    focus: () => void
    blur: () => void
    getCursorPosition: () => DOMRect | undefined
  }
  