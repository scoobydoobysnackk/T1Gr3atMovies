# Gr3at AI chat upgrade

## Build
- Add a prominent Back to Gr3atMovies control in the chat header on desktop and mobile.
- Redesign the chat into a cleaner, more polished assistant workspace while preserving the Oceanic theme, conversation history, Markdown, stop, delete, and mobile sidebar behavior.
- Improve empty, active, loading, and error states with stronger hierarchy and responsive spacing.
- Animate each completed AI response at 20 letters per second, adding 20 letters per second for every 20 words in that response (for example, 100 words displays at 100 letters per second).
- Keep streamed responses smooth, allow stopping at any time, and save the complete response rather than only the currently revealed text.
- Remove the current random-link hydration mismatch in the New chat control.

## Validation
- Check the chat at desktop and mobile sizes.
- Verify Back, new chat, sidebar, send, stop, response reveal, and persistence behavior.
- Confirm the preview builds without errors.

## Technical details
- Keep Groq and the existing streaming endpoint unchanged.
- Separate received response text from displayed response text so the reveal speed can be calculated from final word count without losing data.
- Use only the existing semantic Oceanic design tokens and icon set.
