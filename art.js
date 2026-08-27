document.addEventListener("DOMContentLoaded", () => {
  if (window.__catClubArtReady) {
    return;
  }

  const artNewButton = document.querySelector("#art-new-button");
  const artStatus = document.querySelector("#art-status");
  const artGallery = document.querySelector("#art-gallery");
  const artComposer = document.querySelector("#art-composer");
  const artCanvas = document.querySelector("#art-canvas");
  const artColorButton = document.querySelector("#art-color-button");
  const artSaveButton = document.querySelector("#art-save-button");
  const artCloseButton = document.querySelector("#art-close-button");
  const artPalette = document.querySelector("#art-palette");

  if (
    !artNewButton ||
    !artStatus ||
    !artGallery ||
    !artComposer ||
    !artCanvas ||
    !artColorButton ||
    !artSaveButton ||
    !artCloseButton ||
    !artPalette
  ) {
    return;
  }

  const storageKey = "catclub-art-drawings";
  const palette = [
    { name: "Ink", value: "#151515" },
    { name: "Coral", value: "#ec6f66" },
    { name: "Orange", value: "#f0ad3d" },
    { name: "Lime", value: "#8bc95d" },
    { name: "Mint", value: "#5ec9b5" },
    { name: "Sky", value: "#5aa6ff" },
    { name: "Blue", value: "#2f6f8f" },
    { name: "Lavender", value: "#8d78f0" },
    { name: "Pink", value: "#e06aa3" },
    { name: "Brown", value: "#8d5b3c" },
    { name: "Gray", value: "#6d7278" },
    { name: "Yellow", value: "#f2c94c" },
  ];

  const state = {
    drawings: [],
    color: palette[0].value,
    colorName: palette[0].name,
    drawing: false,
    activePointerId: null,
    hasMarks: false,
  };

  const canvasContext = artCanvas.getContext("2d");

  const loadDrawings = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (drawing) =>
          drawing &&
          typeof drawing.id === "string" &&
          typeof drawing.image === "string" &&
          typeof drawing.createdAt === "number"
      );
    } catch {
      return [];
    }
  };

  const saveDrawings = (drawings) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(drawings));
    } catch {
      // Keep the gallery usable even if persistence fails.
    }
  };

  const formatDate = (value) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));

  const setStatus = (message) => {
    artStatus.textContent = message;
  };

  const colorLabel = (value) => palette.find((item) => item.value === value)?.name || value;

  const updateColorButton = () => {
    artColorButton.style.setProperty("--art-color", state.color);
    artColorButton.setAttribute("aria-label", `Choose color. Current color is ${state.colorName}.`);
  };

  const renderPalette = () => {
    artPalette.innerHTML = "";

    palette.forEach(({ name, value }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "art-palette-button";
      button.dataset.color = value;
      button.title = name;
      button.setAttribute("aria-label", name);
      button.setAttribute("aria-pressed", String(state.color === value));
      button.style.setProperty("--swatch-color", value);
      button.addEventListener("click", () => {
        state.color = value;
        state.colorName = name;
        updateColorButton();
        renderPalette();
        artPalette.hidden = true;
        artColorButton.setAttribute("aria-expanded", "false");
        setStatus(`${name} selected.`);
      });
      artPalette.append(button);
    });
  };

  const renderGallery = () => {
    artGallery.innerHTML = "";

    if (!state.drawings.length) {
      const empty = document.createElement("p");
      empty.className = "art-empty";
      empty.textContent = "No drawings yet. Press + to make the first one.";
      artGallery.append(empty);
      return;
    }

    state.drawings.forEach((drawing) => {
      const card = document.createElement("article");
      card.className = "art-card";
      card.style.setProperty("--art-accent", drawing.color || palette[0].value);

      const image = document.createElement("img");
      image.className = "art-card-canvas";
      image.src = drawing.image;
      image.alt = `Drawing from ${formatDate(drawing.createdAt)}`;
      image.loading = "lazy";

      const meta = document.createElement("div");
      meta.className = "art-card-meta";

      const title = document.createElement("p");
      title.className = "art-card-title";
      title.textContent = formatDate(drawing.createdAt);

      const color = document.createElement("p");
      color.className = "art-card-color";
      color.textContent = `Color: ${colorLabel(drawing.color || palette[0].value)}`;

      meta.append(title, color);
      card.append(image, meta);
      artGallery.append(card);
    });
  };

  const drawSnapshot = (snapshot) =>
    new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const rect = artCanvas.getBoundingClientRect();
        canvasContext.drawImage(image, 0, 0, rect.width, rect.height);
        resolve();
      };
      image.src = snapshot;
    });

  const resizeCanvas = async (snapshot = null) => {
    const rect = artCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (!rect.width || !rect.height) {
      return;
    }

    artCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    artCanvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvasContext.fillStyle = "#ffffff";
    canvasContext.fillRect(0, 0, rect.width, rect.height);

    if (snapshot) {
      await drawSnapshot(snapshot);
    }
  };

  const reopenWithBlankCanvas = () => {
    artComposer.hidden = false;
    artPalette.hidden = true;
    artColorButton.setAttribute("aria-expanded", "false");
    state.color = palette[0].value;
    state.colorName = palette[0].name;
    state.drawing = false;
    state.activePointerId = null;
    state.hasMarks = false;
    updateColorButton();
    renderPalette();
    window.requestAnimationFrame(() => {
      void resizeCanvas();
    });
    setStatus("Blank whiteboard ready.");
  };

  const closeComposer = () => {
    state.drawing = false;
    state.activePointerId = null;
    artComposer.hidden = true;
    artPalette.hidden = true;
    artColorButton.setAttribute("aria-expanded", "false");
    setStatus("Ready to draw.");
  };

  const getCanvasPoint = (event) => {
    const rect = artCanvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startStroke = (event) => {
    if (artComposer.hidden) {
      return;
    }

    state.drawing = true;
    state.activePointerId = event.pointerId;
    artCanvas.setPointerCapture(event.pointerId);

    const point = getCanvasPoint(event);
    canvasContext.beginPath();
    canvasContext.moveTo(point.x, point.y);
    canvasContext.lineTo(point.x, point.y);
    canvasContext.strokeStyle = state.color;
    canvasContext.lineWidth = 7;
    canvasContext.lineJoin = "round";
    canvasContext.lineCap = "round";
    canvasContext.stroke();
    state.hasMarks = true;
  };

  const moveStroke = (event) => {
    if (!state.drawing || event.pointerId !== state.activePointerId) {
      return;
    }

    const point = getCanvasPoint(event);
    canvasContext.lineTo(point.x, point.y);
    canvasContext.stroke();
    state.hasMarks = true;
  };

  const endStroke = (event) => {
    if (!state.drawing || event.pointerId !== state.activePointerId) {
      return;
    }

    state.drawing = false;
    state.activePointerId = null;
    try {
      artCanvas.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore capture release issues.
    }
    canvasContext.closePath();
  };

  const saveDrawing = () => {
    if (!state.hasMarks) {
      setStatus("Draw something before saving.");
      return;
    }

    const drawing = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: Date.now(),
      color: state.color,
      image: artCanvas.toDataURL("image/png"),
    };

    state.drawings = [drawing, ...state.drawings];
    saveDrawings(state.drawings);
    renderGallery();
    closeComposer();
    setStatus("Saved to gallery.");
  };

  state.drawings = loadDrawings();
  renderPalette();
  updateColorButton();
  renderGallery();

  artNewButton.addEventListener("click", reopenWithBlankCanvas);

  artColorButton.addEventListener("click", () => {
    const isOpen = !artPalette.hidden;
    artPalette.hidden = isOpen;
    artColorButton.setAttribute("aria-expanded", String(!isOpen));
    if (!isOpen) {
      renderPalette();
    }
  });

  artSaveButton.addEventListener("click", saveDrawing);
  artCloseButton.addEventListener("click", closeComposer);

  artCanvas.addEventListener("pointerdown", startStroke);
  artCanvas.addEventListener("pointermove", moveStroke);
  artCanvas.addEventListener("pointerup", endStroke);
  artCanvas.addEventListener("pointercancel", endStroke);
  artCanvas.addEventListener("pointerleave", endStroke);

  window.addEventListener("resize", () => {
    if (!artComposer.hidden) {
      const snapshot = state.hasMarks ? artCanvas.toDataURL("image/png") : null;
      void resizeCanvas(snapshot);
    }
  });

  window.__catClubArtReady = true;
});
