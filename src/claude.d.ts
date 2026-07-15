// The `window.claude.complete` API is only available inside the Claude
// Artifacts runtime. When deployed elsewhere it's absent, and the app
// falls back to "copy the prompt into Claude" mode.
interface Window {
  claude?: {
    complete: (prompt: string) => Promise<string>
  }
}
