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
