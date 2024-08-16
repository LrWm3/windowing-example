# Windowing in browser example

Playing around with creating a simple windowing library.

Mostly as a way to learn more about more complicated front-end development.

## See it live

[Github Project Page - Windowing Example](https://lrwm3.github.io/windowing-example/)

## Features

- [x] Can create windows
- [x] Can drag and drop windows around
- [x] Can resize windows from the bottom right corner
- [x] Have a side bar and nav bar
- [x] Can maximize windows (sort of, doesn't work very well)
- [x] Can drag window to left, right to take up half the screen
- [x] Can close windows
- [x] Dragging drags the window from the right spot
- [x] Dragging when maximized reverts to previous size
- [x] Better drag events; sometimes want the main drag event to fire once we've dragged far enough away from the origin point of the window.
- [x] A really bad 'event' interceptor to avoid lower events intercepting upper events
- [x] Can combine windows via the tab bar
- [x] Can load other html snippets in the windows and have them work appropriately (or something)
- [ ] Change window title to match selected tab
- [ ] Can close individual tabs inside a window
- [ ] Can drag & reorder tabs within a window
- [ ] Can move individual tabs between windows
- [ ] Can promote a tab to a window by dragging it out of a window
- [ ] Better event intercepter between dragging and clicking buttons; don't want interaction to flow through windows
- [ ] More example window types
- [ ] As browser window resizes, the windows also resize appropriately, if maximized
