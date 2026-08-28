const initCatClubVideo = () => {
  if (window.__catClubVideoReady) {
    return;
  }

  window.__catClubVideoReady = true;

  const videoRecordButton = document.querySelector("#video-record-button");
  const videoPreview = document.querySelector("#video-preview");
  const videoGallery = document.querySelector("#video-gallery");
  const videoStatus = document.querySelector("#video-status");
  const videoPermissionNote = document.querySelector("#video-permission-note");

  if (!videoRecordButton || !videoPreview || !videoGallery || !videoStatus || !videoPermissionNote) {
    return;
  }

  const videoDbName = "catclub-videos";
  const videoStoreName = "recordings";

  const videoState = {
    db: null,
    stream: null,
    recorder: null,
    chunks: [],
    recording: false,
    galleryUrls: new Map(),
  };

  const updateStatus = (text) => {
    videoStatus.textContent = text;
  };

  const setButtonState = () => {
    videoRecordButton.textContent = videoState.recording ? "Stop" : "+";
    videoRecordButton.classList.toggle("is-recording", videoState.recording);
    videoRecordButton.setAttribute("aria-pressed", String(videoState.recording));
  };

  const openDb = () =>
    new Promise((resolve, reject) => {
      if (videoState.db) {
        resolve(videoState.db);
        return;
      }

      const request = window.indexedDB.open(videoDbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(videoStoreName)) {
          db.createObjectStore(videoStoreName, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        videoState.db = request.result;
        resolve(videoState.db);
      };

      request.onerror = () => {
        reject(request.error || new Error("Unable to open video storage."));
      };
    });

  const idbRequest = (request) =>
    new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB error."));
    });

  const saveRecord = async (record) => {
    const db = await openDb();
    const tx = db.transaction(videoStoreName, "readwrite");
    tx.objectStore(videoStoreName).put(record);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
      tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));
    });
  };

  const deleteRecord = async (id) => {
    const db = await openDb();
    const tx = db.transaction(videoStoreName, "readwrite");
    tx.objectStore(videoStoreName).delete(id);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
      tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));
    });
  };

  const loadRecords = async () => {
    const db = await openDb();
    const tx = db.transaction(videoStoreName, "readonly");
    const store = tx.objectStore(videoStoreName);
    const records = await idbRequest(store.getAll());
    return Array.isArray(records) ? records.sort((a, b) => b.createdAt - a.createdAt) : [];
  };

  const revokeGalleryUrls = () => {
    videoState.galleryUrls.forEach((url) => {
      window.URL.revokeObjectURL(url);
    });
    videoState.galleryUrls.clear();
  };

  const renderGallery = async () => {
    revokeGalleryUrls();
    videoGallery.innerHTML = "";

    const records = await loadRecords().catch(() => []);
    if (!records.length) {
      const empty = document.createElement("p");
      empty.className = "video-empty";
      empty.textContent = "No recordings yet. Press + to make the first one.";
      videoGallery.append(empty);
      return;
    }

    records.forEach((record) => {
      const card = document.createElement("article");
      card.className = "video-card";

      const clip = document.createElement("video");
      clip.className = "video-card-media";
      clip.controls = true;
      clip.playsInline = true;
      clip.preload = "metadata";

      const url = window.URL.createObjectURL(record.blob);
      videoState.galleryUrls.set(record.id, url);
      clip.src = url;

      const meta = document.createElement("div");
      meta.className = "video-card-meta";

      const controls = document.createElement("div");
      controls.className = "video-card-controls";

      const moreButton = document.createElement("button");
      moreButton.type = "button";
      moreButton.className = "video-card-more";
      moreButton.textContent = "More";
      moreButton.setAttribute("aria-expanded", "false");

      const menu = document.createElement("div");
      menu.className = "video-card-menu";
      menu.hidden = true;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "video-card-delete";
      deleteButton.textContent = "Delete video";

      const setMenuOpen = (open) => {
        menu.hidden = !open;
        moreButton.setAttribute("aria-expanded", String(open));
        card.classList.toggle("is-menu-open", open);
      };

      moreButton.addEventListener("click", () => {
        setMenuOpen(menu.hidden);
      });

      deleteButton.addEventListener("click", async () => {
        setMenuOpen(false);
        await deleteRecord(record.id);
        revokeGalleryUrls();
        updateStatus("Video deleted.");
        await renderGallery();
      });

      controls.append(moreButton);
      menu.append(deleteButton);

      const title = document.createElement("p");
      title.className = "video-card-title";
      title.textContent = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(record.createdAt));

      const subtitle = document.createElement("p");
      subtitle.className = "video-card-duration";
      subtitle.textContent = record.mimeType || "Recorded clip";

      meta.append(title, subtitle, controls, menu);
      card.append(clip, meta);
      videoGallery.append(card);
    });
  };

  const pickRecorderMimeType = () => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    return candidates.find((type) => window.MediaRecorder && window.MediaRecorder.isTypeSupported(type)) || "";
  };

  const stopStream = () => {
    if (videoPreview) {
      videoPreview.srcObject = null;
    }

    if (videoState.stream) {
      videoState.stream.getTracks().forEach((track) => track.stop());
      videoState.stream = null;
    }
  };

  const ensureStream = async () => {
    if (videoState.stream) {
      return videoState.stream;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is not supported here.");
    }

    try {
      videoState.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      if (error && error.name === "NotAllowedError") {
        throw new Error("Camera permission was denied.");
      }

      videoState.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    videoPreview.srcObject = videoState.stream;
    await videoPreview.play().catch(() => {});
    videoPermissionNote.textContent = "Camera is ready. Press + to start recording.";
    return videoState.stream;
  };

  const startRecording = async () => {
    if (videoState.recording) {
      return;
    }

    if (!window.MediaRecorder) {
      throw new Error("This browser cannot record video.");
    }

    const stream = await ensureStream();
    const mimeType = pickRecorderMimeType();
    const options = mimeType ? { mimeType } : undefined;

    videoState.chunks = [];
    videoState.recorder = new MediaRecorder(stream, options);
    videoState.recording = true;
    setButtonState();
    updateStatus("Recording now.");

    videoState.recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        videoState.chunks.push(event.data);
      }
    };

    videoState.recorder.onstop = async () => {
      try {
        const blob = new Blob(videoState.chunks, {
          type: videoState.recorder?.mimeType || mimeType || "video/webm",
        });
        const record = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: Date.now(),
          mimeType: videoState.recorder?.mimeType || mimeType || "video/webm",
          blob,
        };

        await saveRecord(record);
        updateStatus("Saved to gallery.");
        await renderGallery();
      } catch {
        updateStatus("Recording saved locally, but gallery refresh failed.");
      } finally {
        videoState.chunks = [];
        videoState.recorder = null;
        videoState.recording = false;
        setButtonState();
      }
    };

    videoState.recorder.start();
  };

  const stopRecording = () => {
    if (!videoState.recording || !videoState.recorder) {
      return;
    }

    updateStatus("Saving recording...");
    videoState.recorder.stop();
  };

  videoRecordButton.addEventListener("click", () => {
    if (videoState.recording) {
      stopRecording();
      return;
    }

    void startRecording().catch((error) => {
      updateStatus(error instanceof Error ? error.message : "Unable to start recording.");
      setButtonState();
      stopStream();
    });
  });

  setButtonState();
  updateStatus("Ready to record.");
  void renderGallery();

  window.addEventListener("click", (event) => {
    const openCard = event.target.closest?.(".video-card.is-menu-open");
    if (openCard) {
      return;
    }

    videoGallery.querySelectorAll(".video-card.is-menu-open").forEach((card) => {
      card.classList.remove("is-menu-open");
      const menu = card.querySelector(".video-card-menu");
      const moreButton = card.querySelector(".video-card-more");
      if (menu) {
        menu.hidden = true;
      }
      if (moreButton) {
        moreButton.setAttribute("aria-expanded", "false");
      }
    });
  });

  window.addEventListener("beforeunload", () => {
    stopStream();
    revokeGalleryUrls();
  });

};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCatClubVideo, { once: true });
} else {
  initCatClubVideo();
}
