interface ResizableCamera {
  aspect: number;
  updateProjectionMatrix: () => void;
}

interface ResizableRenderer {
  setSize: (width: number, height: number) => void;
}

export const resizeToParent = (
  parentElement: HTMLElement,
  cameras: ResizableCamera[],
  renderers: ResizableRenderer[]
) => {
  const parentRect = parentElement.getBoundingClientRect();

  for (const camera of cameras) {
    camera.aspect = parentRect.width / parentRect.height;
    camera.updateProjectionMatrix();
  }

  for (const renderer of renderers) {
    renderer.setSize(parentRect.width, parentRect.height);
  }
};

export const wrapResizeFunc = (resizeCallback: () => void) => {
  const repeatTimeMs = 300;
  let timeout: number | null = null;

  return () => {
    // call once for immediate feedback during
    // window resize events
    resizeCallback();

    // replace the repeat call that happens with a small
    // delay to allow scroll bars to disappear after a
    // resize, allowing the context to resize to the 
    // actual parent width, height
    if (!timeout) {
      timeout = setTimeout(resizeCallback, repeatTimeMs);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(resizeCallback, repeatTimeMs);
    }
  }
}
