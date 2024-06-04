const playVideos = () => {
  const videoElements = document.getElementsByClassName("video");
  for (const el of videoElements) {
    const video = el as HTMLVideoElement;
    if (!video) {
      continue;
    }

    video.play();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(playVideos, 150);
});