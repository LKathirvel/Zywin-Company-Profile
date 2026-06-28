let flipbook;

const totalPages = 12;

const pageImages = Array.from(
  { length: totalPages },
  (_, i) => `pages/page${i + 1}.png`
);

const loader = document.getElementById("loader");
const pageCounter = document.getElementById("pageCounter");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageSound = document.getElementById("pageSound");

if (pageSound) {
  pageSound.volume = 0.75;
  pageSound.load();
}

function isMobileView() {
  return window.innerWidth <= 768;
}

function playPageSound() {
  if (!pageSound) return;

  try {
    pageSound.pause();
    pageSound.currentTime = 0;
    pageSound.play().catch(() => {});
  } catch (error) {}
}

function preloadImages() {
  let loaded = 0;

  return new Promise((resolve) => {
    pageImages.forEach((src) => {
      const img = new Image();

      img.onload = img.onerror = () => {
        loaded++;

        if (loader) {
          loader.innerText = `Loading ${Math.round((loaded / totalPages) * 100)}%`;
        }

        if (loaded === totalPages) {
          resolve();
        }
      };

      img.src = src;
    });
  });
}

function getBookSize() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const margin = isMobileView() ? 28 : 36;
  const availableWidth = screenWidth - margin;
  const availableHeight = screenHeight - (isMobileView() ? 92 : 104);

  let pageWidth;
  let pageHeight;

  if (isMobileView()) {
    // Mobile: single page view
    pageHeight = availableHeight;
    pageWidth = pageHeight * 0.75;

    if (pageWidth > availableWidth) {
      pageWidth = availableWidth;
      pageHeight = pageWidth * 1.333333;
    }
  } else {
    // Desktop / Tablet: double page view
    pageHeight = availableHeight;
    pageWidth = pageHeight * 0.75;

    if (pageWidth * 2 > availableWidth) {
      pageWidth = availableWidth / 2;
      pageHeight = pageWidth * 1.333333;
    }
  }

  return {
    width: Math.floor(pageWidth),
    height: Math.floor(pageHeight)
  };
}

function updateCounter() {
  if (!flipbook) return;

  const currentPage = flipbook.getCurrentPageIndex();
  pageCounter.innerText = `${currentPage + 1} / ${totalPages}`;

  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage === totalPages - 1;
}

function createFlipbook(startPage = 0) {
  const size = getBookSize();

  flipbook = new St.PageFlip(document.getElementById("flipbook"), {
    width: size.width,
    height: size.height,

    size: "fixed",

    // Desktop/tablet: cover + double spread
    // Mobile: single page portrait
    showCover: !isMobileView(),
    usePortrait: isMobileView(),

    drawShadow: true,
    maxShadowOpacity: 0.6,

    mobileScrollSupport: false,
    flippingTime: 900,
    swipeDistance: 30,
    clickEventForward: true
  });

  flipbook.loadFromHTML(document.querySelectorAll(".page"));

  flipbook.on("init", () => {
    if (loader) loader.style.display = "none";

    if (startPage > 0) {
      setTimeout(() => {
        flipbook.turnToPage(startPage);
        updateCounter();
      }, 80);
    } else {
      updateCounter();
    }
  });

  flipbook.on("flip", () => {
    updateCounter();
  });

  flipbook.on("changeState", (e) => {
    if (e.data === "flipping") {
      playPageSound();
    }
  });
}

function rebuildFlipbook() {
  if (!flipbook) return;

  const currentPage = flipbook.getCurrentPageIndex();

  flipbook.destroy();
  createFlipbook(currentPage);
}

prevBtn.addEventListener("click", () => {
  if (!flipbook || prevBtn.disabled) return;
  flipbook.flipPrev();
});

nextBtn.addEventListener("click", () => {
  if (!flipbook || nextBtn.disabled) return;
  flipbook.flipNext();
});

document.addEventListener("keydown", (e) => {
  if (!flipbook) return;

  if (e.key === "ArrowRight") {
    flipbook.flipNext();
  }

  if (e.key === "ArrowLeft") {
    flipbook.flipPrev();
  }
});

window.addEventListener("resize", () => {
  clearTimeout(window.flipbookResizeTimer);

  window.flipbookResizeTimer = setTimeout(() => {
    rebuildFlipbook();
  }, 300);
});

document.addEventListener("DOMContentLoaded", async () => {
  await preloadImages();
  createFlipbook();
});