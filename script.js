const WINDOW_MODE = "data-window-mode";
const WINDOW_MODE_FLOATING = "floating";
const WINDOW_MODE_MAXIMIZED = "maximized";
const WINDOW_MODE_MAXIMIZED_TYPE = "data-window-mode-maximized";
const WINDOW_DRAG_DISABLED = "data-window-drag-disabled";
const WINDOW_MODE_MAXIMIZED_TYPES = {
  full: "full",
  left: "left",
  right: "right",
  top: "top",
  bottom: "bottom",
};

let windowCount = 0;
let highestZIndex = 1;

function bringToFront(element) {
  highestZIndex++;
  element.style.zIndex = highestZIndex;
}
function makeDraggableWindow(element, header) {
  let offsetX = 0,
    offsetY = 0,
    mouseX = 0,
    mouseY = 0,
    initRect = element.getBoundingClientRect();

  header.onmousedown = elementPreDragMouseDown;

  function elementPreDragMouseDown(e) {
    e.preventDefault();
    mouseX = e.clientX;
    mouseY = e.clientY;
    initRect = element.getBoundingClientRect();

    if (element.getAttribute(WINDOW_DRAG_DISABLED) === "true") {
      // don't allow dragging if the window is has just been maximized
      elementPreDragStop();
      return;
    }

    if (element.getAttribute(WINDOW_MODE) === WINDOW_MODE_MAXIMIZED) {
      document.onmousemove = (ev) => checkDragThreshold(ev, elementDragStart);
      document.onmouseup = elementPreDragStop;
    } else {
      // no precondition for dragging if the window is not currently considered "full"
      elementDragStart(e);
    }
  }

  function checkDragThreshold(e, startDrag) {
    const distanceY = e.clientY - initRect.top;
    const distanceX = e.clientX - initRect.left;
    const distanceYMouse = Math.abs(e.clientY - mouseY);

    if (element.getAttribute(WINDOW_DRAG_DISABLED) === "true") {
      elementPreDragStop();
    }

    if (distanceX < 8 || distanceX > initRect.width - 4) {
      elementPreDragStop();
    }

    if (distanceYMouse > 4 && (distanceY < 8 || distanceY > 24)) {
      startDrag(e);
    }
  }

  function elementPreDragStop() {
    document.onmousemove = null;
    document.onmouseup = null;
  }

  function elementDragStart(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // Get the data attributes for width and height & if present, restore the element to its original size
    const width = element.getAttribute("data-width");
    const height = element.getAttribute("data-height");
    if (width && height) {
      // Center the location of the window on the mouse
      const pWidth = parseInt(getComputedStyle(element).width);

      element.style.width = width;
      element.style.height = height;
      // remove the data attributes, if present
      element.removeAttribute("data-top");
      element.removeAttribute("data-left");
      element.removeAttribute("data-width");
      element.removeAttribute("data-height");
      element.setAttribute(WINDOW_MODE, WINDOW_MODE_FLOATING);

      // we want position the resized window so that the window is positioned relative to the mouse,
      //   relative as in where it would be if the window was not resized

      // First we need to get the mouse offset from the center of the window
      const offsetX = mouseX - element.getBoundingClientRect().left;
      const offsetY = mouseY - element.getBoundingClientRect().top;

      // Next we need to calculate the new top and left positions
      const widthDiff = parseInt(getComputedStyle(element).width) - pWidth;
      const newTop = mouseY - offsetY;
      const newLeft =
        mouseX -
        offsetX -
        (widthDiff * (mouseX - element.getBoundingClientRect().left)) / pWidth;

      // Finally we set the new top and left positions
      element.style.top = `${newTop}px`;
      element.style.left = `${newLeft}px`;
    }

    document.onmousemove = elementDrag;
    document.onmouseup = elementDragStop;
  }

  function elementDrag(e) {
    e.preventDefault();
    offsetX = mouseX - e.clientX;
    offsetY = mouseY - e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    element.style.top = element.offsetTop - offsetY + "px";
    element.style.left = element.offsetLeft - offsetX + "px";

    // Check for intersections with drag-insertable elements
    const dragInsertables = document.querySelectorAll(".drag-insertable");
    dragInsertables.forEach((insertable) => {
      if (isMouseOver(mouseX, mouseY, insertable)) {
        console.log(`Intersecting with ${insertable.className}`);
      }
    });
  }

  function elementDragStop() {
    document.onmouseup = null;
    document.onmousemove = null;

    // Check if the mouse is over any drag-insertable elements, ordering by z-index
    const dragInsertables = Array.from(
      document.querySelectorAll(".drag-insertable")
    ).sort((a, b) => {
      const zIndexA = parseInt(getComputedStyle(a).zIndex);
      const zIndexB = parseInt(getComputedStyle(b).zIndex);
      return zIndexB - zIndexA;
    });

    for (const insertable of dragInsertables) {
      if (isMouseOver(mouseX, mouseY, insertable)) {
        const viewportElement = document.querySelector(".viewport");
        if (insertable.getAttribute("drag-insertable") === "expand") {
          console.log(`Resizing to ${insertable.className}`);
          resizeElementTo(element, viewportElement, insertable.className);
          break;
        } else if (insertable.getAttribute("drag-insertable") === "tabify") {
          console.log(`Resizing to ${insertable.className}`);

          // TODO - tabify the window
          //  we assume here the parent element contains both a content section and a tab section
          newTabFromWindow(insertable.parentElement, element);
          break;
        }
      }
    }
  }

  function resizeElementTo(element, target, content) {
    const targetRect = target.getBoundingClientRect();
    const regex = /(left|right|top|bottom)/;

    // add previous element width and height as attributes we can use to restore the element to its original size
    // when we drag the element out of the drag-insertable element
    element.setAttribute(
      "data-width",
      `${element.getBoundingClientRect().width}px`
    );
    element.setAttribute(
      "data-height",
      `${element.getBoundingClientRect().height}px`
    );
    element.setAttribute(WINDOW_MODE, WINDOW_MODE_MAXIMIZED);

    element.style.width = `${targetRect.width}px`;
    element.style.height = `${targetRect.height}px`;
    element.style.top = `${targetRect.top}px`;
    element.style.left = `${targetRect.left}px`;

    if (content && regex.test(content)) {
      const halfWidth = targetRect.width / 2;
      const halfHeight = targetRect.height / 2;
      if (content.includes("left")) {
        element.style.width = `${halfWidth}px`;
        element.style.left = `${targetRect.left}px`;
        element.setAttribute(
          WINDOW_MODE_MAXIMIZED_TYPE,
          WINDOW_MODE_MAXIMIZED_TYPES.left
        );
      }
      if (content.includes("right")) {
        element.style.width = `${halfWidth}px`;
        element.style.left = `${targetRect.right - halfWidth}px`;
        element.setAttribute(
          WINDOW_MODE_MAXIMIZED_TYPE,
          WINDOW_MODE_MAXIMIZED_TYPES.right
        );
      }
      if (content.includes("top")) {
        element.style.height = `${halfHeight}px`;
        element.style.top = `${targetRect.top}px`;
        element.setAttribute(
          WINDOW_MODE_MAXIMIZED_TYPE,
          WINDOW_MODE_MAXIMIZED_TYPES.top
        );
      }
      if (content.includes("bottom")) {
        element.style.height = `${halfHeight}px`;
        element.style.top = `${targetRect.bottom - halfHeight}px`;
        element.setAttribute(
          WINDOW_MODE_MAXIMIZED_TYPE,
          WINDOW_MODE_MAXIMIZED_TYPES.bottom
        );
      }
    }
  }

  function isMouseOver(mouseX, mouseY, element) {
    const rect = element.getBoundingClientRect();
    return (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );
  }
}
function makeResizableWindow(element, resizer) {
  let startX, startY, startWidth, startHeight;

  resizer.onmousedown = function (e) {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(
      document.defaultView.getComputedStyle(element).width,
      10
    );
    startHeight = parseInt(
      document.defaultView.getComputedStyle(element).height,
      10
    );
    document.onmouseup = stopResize;
    document.onmousemove = resizeElement;
  };

  function resizeElement(e) {
    e.preventDefault();
    element.style.width = startWidth + e.clientX - startX + "px";
    element.style.height = startHeight + e.clientY - startY + "px";
  }

  function stopResize() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
function makeMaximizableWindow(element, viewport, maximizeButton) {
  maximizeButton.addEventListener("click", () => {
    // disable drag for now
    // will likely need a better event interception mechanism in the long run.
    element.setAttribute(WINDOW_DRAG_DISABLED, "true");
    setTimeout(() => {
      element.removeAttribute(WINDOW_DRAG_DISABLED);
    }, 80);

    if (
      element.getAttribute(WINDOW_MODE) === WINDOW_MODE_MAXIMIZED &&
      element.getAttribute(WINDOW_MODE_MAXIMIZED_TYPE) ===
        WINDOW_MODE_MAXIMIZED_TYPES.full
    ) {
      // Restore to original size and position
      element.style.top = element.getAttribute("data-top");
      element.style.left = element.getAttribute("data-left");
      element.style.width = element.getAttribute("data-width");
      element.style.height = element.getAttribute("data-height");

      element.style.zIndex = ++highestZIndex; // Bring to front

      element.removeAttribute("data-top");
      element.removeAttribute("data-left");
      element.removeAttribute("data-width");
      element.removeAttribute("data-height");
      element.setAttribute(WINDOW_MODE, WINDOW_MODE_FLOATING);
      element.removeAttribute(WINDOW_MODE_MAXIMIZED_TYPE);
    } else {
      // Save original size
      element.setAttribute("data-top", element.style.top);
      element.setAttribute("data-left", element.style.left);
      element.setAttribute("data-width", element.style.width);
      element.setAttribute("data-height", element.style.height);
      element.setAttribute(WINDOW_MODE, WINDOW_MODE_MAXIMIZED);
      element.setAttribute(
        WINDOW_MODE_MAXIMIZED_TYPE,
        WINDOW_MODE_MAXIMIZED_TYPES.full
      );

      // Maximize window
      element.style.width = viewport.getBoundingClientRect().width + "px";
      element.style.height = viewport.getBoundingClientRect().height + "px";
      element.style.top = viewport.getBoundingClientRect().top + "px";
      element.style.left = viewport.getBoundingClientRect().left + "px";
      element.style.zIndex = ++highestZIndex; // Bring to front
    }
  });
}

function newTabFromWindow(window, windowToMakeTab) {
  // if window and windowToMakeTab are the same, do nothing
  // this happens sometimes when we resize a lot and then move due to weird html jank
  if (window === windowToMakeTab) {
    console.log("Trying to add window to its own tab group.");
    return;
  }

  // We get the window contents and tabs from 'windowToMakeTab' and insert them into 'window'
  //   we make the selected tab from windowToMakeTab the new selected tab in 'window'
  const tabSection = window.querySelector(".window-tabs");
  const contentSection = window.querySelector(".window-content");

  const tabSectionToTabify = windowToMakeTab.querySelector(".window-tabs");
  const contentSectionToTabify =
    windowToMakeTab.querySelector(".window-content");

  // Get the selected tab from the window to tabify
  const selectedTab = tabSectionToTabify.querySelector(".selected");
  const selectedTabContent = contentSectionToTabify.querySelector(
    `.${selectedTab.id}`
  );

  // For each tab in the window to tabify, create a new tab in the window
  tabSectionToTabify.querySelectorAll(".window-tab").forEach((tab) => {
    // FIXME - ends up being n^2 complexity, could do everything in a single pass
    const tabContent = contentSectionToTabify.querySelector(
      `.window-content-${tab.id}`
    );
    createNewTabFromContent(
      window,
      tab.textContent,
      tabContent.innerHTML,
      selectedTab.id === tab.id
    );
  });

  // Remove the window we have tabify
  windowToMakeTab.remove();
}

function switchToTab(window, tab) {
  const tabSection = window.querySelector(".window-tabs");
  tabSection.querySelectorAll(".window-tab").forEach((tab) => {
    tab.classList.remove("selected");
  });
  tab.classList.add("selected");
  // find the content
  const contentSection = window.querySelector(".window-content");
  const content = contentSection.querySelector(`.window-content-${tab.id}`);
  contentSection.querySelectorAll(".window-content-tab").forEach((content) => {
    content.style.display = "none";
  });
  content.style.display = "block";
}

function createNewTabFromContent(
  window,
  tabTitle,
  content,
  switchToNewTab = true
) {
  // Get the tab section of the window
  const tabSection = window.querySelector(".window-tabs");

  // Get the content section of the window
  const contentSection = window.querySelector(".window-content");

  const newTab = document.createElement("div");
  newTab.className = "window-tab";
  newTab.id = `tab${Math.round(Math.random() * 100000)}`;
  newTab.addEventListener("click", () => {
    // TODO - could be shift click to select multiple tabs
    //          however this is pretty far from being implemented.
    console.log(`Switching to tab ${tabTitle}`);
    // find other elements which are children of tabSection and remove the selected class
    switchToTab(window, newTab);
  });

  const newTabLabel = document.createElement("label");
  newTabLabel.className = "window-tab-label";
  newTabLabel.textContent = tabTitle;

  newTab.appendChild(newTabLabel);
  tabSection.appendChild(newTab);

  const newContent = document.createElement("div");
  newContent.className = `window-content-${newTab.id} window-content-tab`;
  newContent.textContent = content;
  newContent.style.display = "none";
  contentSection.appendChild(newContent);

  if (switchToNewTab) {
    switchToTab(window, newTab);
  }
}

function createNewWindow() {
  windowCount++;

  const viewport = document.querySelector(".viewport");

  const newWindow = document.createElement("div");
  newWindow.className = "window";
  newWindow.id = `window${windowCount}`;
  newWindow.style.top = `${50 + windowCount * 20}px`; // Slight offset for new windows
  newWindow.style.left = `${250 + windowCount * 20}px`;

  const newHeader = document.createElement("div");
  newHeader.className = "window-header";
  newHeader.id = `header${windowCount}`;
  newHeader.textContent = `Window ${windowCount}`;

  const newCloseButton = document.createElement("button");
  newCloseButton.className = "close-button";
  newCloseButton.innerHTML = '<i class="material-icons md-18">close</i>'; // Use the close MUI icon
  newCloseButton.addEventListener("click", () => {
    newWindow.remove();
  });

  const newTabSection = document.createElement("div");
  newTabSection.className = "window-tabs drag-insertable";
  newTabSection.setAttribute("drag-insertable", "tabify");

  const newContent = document.createElement("div");
  newContent.className = "window-content";

  const newExpand = document.createElement("div");
  newExpand.className = "resize-handle";
  const newMaximizeButton = document.createElement("button");
  newMaximizeButton.className = "maximize-button";
  newMaximizeButton.innerHTML =
    '<i class="material-icons md-18">crop_square</i>'; // Use the maximize MUI icon

  newHeader.appendChild(newCloseButton);
  newHeader.appendChild(newMaximizeButton);
  newWindow.appendChild(newHeader);
  newWindow.appendChild(newTabSection); // Add tab section here
  newWindow.appendChild(newContent);
  newWindow.appendChild(newExpand);
  document.body.appendChild(newWindow);

  createNewTabFromContent(
    newWindow,
    `Window ${windowCount}`,
    `Content of Window ${windowCount}`,
    true
  );

  createNewTabFromContent(
    newWindow,
    `Window ${windowCount}0`,
    `Content of Window ${windowCount}0`,
    true
  );

  newWindow.setAttribute(WINDOW_MODE, WINDOW_MODE_FLOATING);
  makeMaximizableWindow(newWindow, viewport, newMaximizeButton);
  makeResizableWindow(newWindow, newExpand);
  makeDraggableWindow(newWindow, newHeader);
  bringToFront(newWindow);
  newWindow.addEventListener("mousedown", () => bringToFront(newWindow));
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("createWindowLabel")
    .addEventListener("click", function (event) {
      event.preventDefault(); // Prevent the default anchor behavior
      createNewWindow();
    });

  // Optional: make the whole window clickable to bring to front
  document.querySelectorAll(".window").forEach((window) => {
    window.addEventListener("mousedown", () => bringToFront(window));
  });

  // For test purposes
  createNewWindow();
});
