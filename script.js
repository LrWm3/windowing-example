let windowCount = 0;
let highestZIndex = 1;

function bringToFront(element) {
  highestZIndex++;
  element.style.zIndex = highestZIndex;
}

function makeDraggable(element, header) {
  let offsetX = 0,
    offsetY = 0,
    mouseX = 0,
    mouseY = 0;

  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
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
      // remove the data attributes
      element.removeAttribute("data-width");
      element.removeAttribute("data-height");

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

    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
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

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;

    // Check if the mouse is over any drag-insertable elements
    const dragInsertables = Array.from(
      document.querySelectorAll(".drag-insertable")
    ).sort((a, b) => {
      const zIndexA = parseInt(getComputedStyle(a).zIndex);
      const zIndexB = parseInt(getComputedStyle(b).zIndex);
      return zIndexB - zIndexA;
    });

    for (const insertable of dragInsertables) {
      if (isMouseOver(mouseX, mouseY, insertable)) {
        console.log(`Resizing to ${insertable.className}`);
        const viewportElement = document.querySelector(".viewport");
        resizeElementTo(element, viewportElement, insertable.className);
        break;
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
      }
      if (content.includes("right")) {
        element.style.width = `${halfWidth}px`;
        element.style.left = `${targetRect.right - halfWidth}px`;
      }
      if (content.includes("top")) {
        element.style.height = `${halfHeight}px`;
        element.style.top = `${targetRect.top}px`;
      }
      if (content.includes("bottom")) {
        element.style.height = `${halfHeight}px`;
        element.style.top = `${targetRect.bottom - halfHeight}px`;
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
function makeResizable(element, resizer) {
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
function makeMaximizable(element, maximizeButton) {
  let isMaximized = false;
  let originalSize = {};

  maximizeButton.addEventListener("click", () => {
    if (isMaximized) {
      // Restore to original size and position
      element.style.width = originalSize.width;
      element.style.height = originalSize.height;
      // element.style.top = originalSize.top;
      // element.style.left = originalSize.left;
      element.style.zIndex = ++highestZIndex; // Bring to front
      isMaximized = false;
    } else {
      // Save original size and position
      originalSize = {
        width: element.style.width,
        height: element.style.height,
        top: element.style.top,
        left: element.style.left,
      };
      // Maximize window
      element.style.width = "calc(100% - 240px)"; // Adjust for sidebar width
      element.style.height = "calc(100% - 60px)"; // Adjust for header height
      element.style.top = "60px"; // Below header
      element.style.left = "240px"; // Right of sidebar
      element.style.zIndex = ++highestZIndex; // Bring to front
      isMaximized = true;
    }
  });
}

function createNewWindow() {
  windowCount++;
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
  newTabSection.className = "window-tabs";

  const newTab = document.createElement("div");
  newTab.className = "window-tab";
  newTab.textContent = `Window ${windowCount}`; // Default tab title

  newTabSection.appendChild(newTab);

  const newContent = document.createElement("div");
  newContent.className = "window-content";
  newContent.textContent = `Content of Window ${windowCount}`;

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

  makeDraggable(newWindow, newHeader);
  makeResizable(newWindow, newExpand);
  makeMaximizable(newWindow, newMaximizeButton);
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
