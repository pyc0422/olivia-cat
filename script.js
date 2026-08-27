document.addEventListener("DOMContentLoaded", () => {
  const gate = document.querySelector("#password-gate");
  const passwordInput = document.querySelector("#password-input");
  const passwordError = document.querySelector("#password-error");
  const poster = document.querySelector("#site-poster");
  const tabButtons = [...document.querySelectorAll(".view-tab[data-view-target]")];
  const musicToggle = document.querySelector("[data-music-toggle]");
  const siteViews = [...document.querySelectorAll(".site-view[data-view-panel]")];
  const avatarStage = document.querySelector("#avatar-stage");
  const avatarButtons = [...document.querySelectorAll(".avatar-option[data-avatar-setting]")];
  const videoRecordButton = document.querySelector("#video-record-button");
  const videoPreview = document.querySelector("#video-preview");
  const videoGallery = document.querySelector("#video-gallery");
  const videoStatus = document.querySelector("#video-status");
  const videoPermissionNote = document.querySelector("#video-permission-note");

  const passwordKey = "catclub-unlocked";
  const viewKey = "catclub-active-view";
  const avatarKey = "catclub-avatar";
  const musicKey = "catclub-music";
  const videoDbName = "catclub-videos";
  const videoStoreName = "recordings";
  const expectedPassword = "Cats";
  const avatarDefaults = {
    color: "orange",
    eyes: "round",
    mouth: "smile",
    clothes: "hoodie",
  };

  const allowedAvatarOptions = {
    color: ["orange", "cream", "gray", "mint", "pink"],
    eyes: ["round", "sleepy", "sparkle", "wink", "star"],
    mouth: ["smile", "tiny", "open", "tongue", "shy"],
    clothes: ["none", "tee", "hoodie", "scarf", "bow"],
  };
  const ambientProgression = [
    [196.0, 246.94, 293.66, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [146.83, 196.0, 246.94, 293.66],
    [164.81, 220.0, 261.63, 329.63],
  ];

  const musicState = {
    context: null,
    master: null,
    running: false,
    intervalId: null,
  };

  const videoState = {
    db: null,
    stream: null,
    recorder: null,
    chunks: [],
    recording: false,
    galleryUrls: new Map(),
  };

  const loadJson = (key, fallback) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveJson = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures.
    }
  };

  const normalizeAvatar = (value) => {
    const next = { ...avatarDefaults, ...(value && typeof value === "object" ? value : {}) };

    for (const [key, options] of Object.entries(allowedAvatarOptions)) {
      if (!options.includes(next[key])) {
        next[key] = avatarDefaults[key];
      }
    }

    return next;
  };

  const applyAvatar = (avatar) => {
    const state = normalizeAvatar(avatar);

    if (avatarStage) {
      avatarStage.dataset.color = state.color;
      avatarStage.dataset.eyes = state.eyes;
      avatarStage.dataset.mouth = state.mouth;
      avatarStage.dataset.clothes = state.clothes;
    }

    avatarButtons.forEach((button) => {
      const setting = button.dataset.avatarSetting;
      const value = button.dataset.avatarValue;
      const isActive = Boolean(setting && value && state[setting] === value);
      button.classList.toggle("is-selected", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    return state;
  };

  const loadMusicPrefs = () => loadJson(musicKey, { enabled: true });

  const saveMusicPrefs = (value) => {
    saveJson(musicKey, value);
  };

  const updateVideoStatus = (message) => {
    if (videoStatus) {
      videoStatus.textContent = message;
    }
  };

  const setRecordButton = () => {
    if (!videoRecordButton) {
      return;
    }

    videoRecordButton.classList.toggle("is-recording", videoState.recording);
    videoRecordButton.setAttribute("aria-pressed", String(videoState.recording));
    videoRecordButton.textContent = videoState.recording ? "Stop" : "+";
  };

  const openVideoDb = () =>
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

  const getStoredVideos = async () => {
    const db = await openVideoDb();
    const tx = db.transaction(videoStoreName, "readonly");
    const store = tx.objectStore(videoStoreName);
    const videos = await idbRequest(store.getAll());
    return Array.isArray(videos) ? videos.sort((a, b) => b.createdAt - a.createdAt) : [];
  };

  const saveVideoRecord = async (record) => {
    const db = await openVideoDb();
    const tx = db.transaction(videoStoreName, "readwrite");
    tx.objectStore(videoStoreName).put(record);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
      tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));
    });
  };

  const revokeGalleryUrls = () => {
    videoState.galleryUrls.forEach((url) => {
      window.URL.revokeObjectURL(url);
    });
    videoState.galleryUrls.clear();
  };

  const renderVideoGallery = async () => {
    if (!videoGallery) {
      return;
    }

    revokeGalleryUrls();
    videoGallery.innerHTML = "";

    const videos = await getStoredVideos().catch(() => []);
    if (!videos.length) {
      const empty = document.createElement("p");
      empty.className = "video-empty";
      empty.textContent = "No recordings yet. Press + to make the first one.";
      videoGallery.append(empty);
      return;
    }

    videos.forEach((record) => {
      const card = document.createElement("article");
      card.className = "video-card";

      const clip = document.createElement("video");
      clip.className = "video-card-media";
      clip.controls = true;
      clip.playsInline = true;
      clip.preload = "metadata";

      const clipUrl = window.URL.createObjectURL(record.blob);
      videoState.galleryUrls.set(record.id, clipUrl);
      clip.src = clipUrl;

      const meta = document.createElement("div");
      meta.className = "video-card-meta";

      const title = document.createElement("p");
      title.className = "video-card-title";
      title.textContent = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(record.createdAt));

      const duration = document.createElement("p");
      duration.className = "video-card-duration";
      duration.textContent = record.mimeType || "Recorded clip";

      meta.append(title, duration);
      card.append(clip, meta);
      videoGallery.append(card);
    });
  };

  const pickRecorderMimeType = () => {
    const options = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    return options.find((type) => window.MediaRecorder && window.MediaRecorder.isTypeSupported(type)) || "";
  };

  const stopVideoStream = () => {
    if (videoPreview) {
      videoPreview.srcObject = null;
    }

    if (videoState.stream) {
      videoState.stream.getTracks().forEach((track) => track.stop());
      videoState.stream = null;
    }
  };

  const startVideoStream = async () => {
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

    if (videoPreview) {
      videoPreview.srcObject = videoState.stream;
      await videoPreview.play().catch(() => {});
    }

    if (videoPermissionNote) {
      videoPermissionNote.textContent = "Camera is ready. Press + to start recording.";
    }

    return videoState.stream;
  };

  const startVideoRecording = async () => {
    if (videoState.recording) {
      return;
    }

    if (!window.MediaRecorder) {
      throw new Error("This browser cannot record video.");
    }

    const stream = await startVideoStream();
    const mimeType = pickRecorderMimeType();
    const recorderOptions = mimeType ? { mimeType } : undefined;

    videoState.chunks = [];
    videoState.recorder = new MediaRecorder(stream, recorderOptions);
    videoState.recording = true;
    setRecordButton();
    updateVideoStatus("Recording now.");

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

        await saveVideoRecord(record);
        updateVideoStatus("Saved to gallery.");
        await renderVideoGallery();
      } catch {
        updateVideoStatus("Recording saved locally, but gallery refresh failed.");
      } finally {
        videoState.chunks = [];
        videoState.recorder = null;
        videoState.recording = false;
        setRecordButton();
      }
    };

    videoState.recorder.start();
  };

  const stopVideoRecording = () => {
    if (!videoState.recording || !videoState.recorder) {
      return;
    }

    updateVideoStatus("Saving recording...");
    videoState.recorder.stop();
  };

  const toggleVideoRecording = async () => {
    if (videoState.recording) {
      stopVideoRecording();
      return;
    }

    try {
      await startVideoRecording();
    } catch (error) {
      updateVideoStatus(error instanceof Error ? error.message : "Unable to start recording.");
      setRecordButton();
    }
  };

  const updateMusicToggle = () => {
    if (!musicToggle) {
      return;
    }

    musicToggle.textContent = musicState.running ? "Music on" : "Music off";
    musicToggle.setAttribute("aria-pressed", String(musicState.running));
  };

  const stopMusic = async () => {
    if (musicState.intervalId) {
      window.clearInterval(musicState.intervalId);
      musicState.intervalId = null;
    }

    musicState.running = false;
    updateMusicToggle();

    if (musicState.context) {
      try {
        await musicState.context.close();
      } catch {
        // Ignore shutdown errors.
      }
      musicState.context = null;
      musicState.master = null;
    }
  };

  const playAmbientChord = (startTime, notes) => {
    if (!musicState.context || !musicState.master) {
      return;
    }

    notes.forEach((frequency, index) => {
      const osc = musicState.context.createOscillator();
      const gain = musicState.context.createGain();
      const filter = musicState.context.createBiquadFilter();

      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = index === 0 ? 900 : 1300;
      gain.gain.value = 0;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicState.master);

      const duration = 3.8;
      const attack = 0.35;
      const release = 0.7;
      const offset = index * 0.04;

      gain.gain.setValueAtTime(0, startTime + offset);
      gain.gain.linearRampToValueAtTime(0.035 + index * 0.003, startTime + offset + attack);
      gain.gain.linearRampToValueAtTime(0.028 + index * 0.002, startTime + offset + duration - release);
      gain.gain.linearRampToValueAtTime(0, startTime + offset + duration);

      osc.start(startTime + offset);
      osc.stop(startTime + offset + duration + 0.2);
    });
  };

  const scheduleAmbientLoop = () => {
    if (!musicState.context) {
      return;
    }

    const startTime = musicState.context.currentTime + 0.15;
    ambientProgression.forEach((chord, index) => {
      playAmbientChord(startTime + index * 4, chord);
    });
  };

  const startMusic = async () => {
    const prefs = loadMusicPrefs();
    if (prefs.enabled === false) {
      updateMusicToggle();
      return false;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      updateMusicToggle();
      return false;
    }

    if (!musicState.context) {
      musicState.context = new AudioCtor();
      musicState.master = musicState.context.createGain();
      musicState.master.gain.value = 0.09;
      musicState.master.connect(musicState.context.destination);
    }

    try {
      if (musicState.context.state === "suspended") {
        await musicState.context.resume();
      }
    } catch {
      updateMusicToggle();
      return false;
    }

    if (!musicState.running) {
      scheduleAmbientLoop();
      musicState.intervalId = window.setInterval(scheduleAmbientLoop, 16000);
      musicState.running = true;
    }

    updateMusicToggle();
    return true;
  };

  const toggleMusic = async () => {
    const prefs = loadMusicPrefs();

    if (musicState.running) {
      saveMusicPrefs({ enabled: false });
      await stopMusic();
      return;
    }

    saveMusicPrefs({ enabled: true });
    await startMusic();
  };

  const loadActiveView = () => {
    try {
      return window.sessionStorage.getItem(viewKey) || "board";
    } catch {
      return "board";
    }
  };

  const setActiveView = (viewName) => {
    const nextView = viewName === "avatar" || viewName === "videos" || viewName === "art" ? viewName : "board";

    if (videoState.recording && nextView !== "videos") {
      stopVideoRecording();
    }

    siteViews.forEach((panel) => {
      panel.hidden = panel.dataset.viewPanel !== nextView;
    });

    tabButtons.forEach((button) => {
      const isActive = button.dataset.viewTarget === nextView;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    try {
      window.sessionStorage.setItem(viewKey, nextView);
    } catch {
      // Ignore storage failures.
    }
  };

  const unlockSite = () => {
    document.body.classList.add("site-unlocked");
    if (poster) {
      poster.classList.remove("is-locked");
    }
    if (gate) {
      gate.hidden = true;
    }
    try {
      window.sessionStorage.setItem(passwordKey, "true");
    } catch {
      // Ignore storage failures.
    }

    void startMusic();
  };

  const isUnlocked = (() => {
    try {
      return window.sessionStorage.getItem(passwordKey) === "true";
    } catch {
      return false;
    }
  })();

  if (isUnlocked) {
    unlockSite();
  }

  if (passwordInput && gate && !isUnlocked) {
    passwordInput.focus();

    const submitPassword = () => {
      const value = passwordInput.value.trim();

      if (value === expectedPassword) {
        if (passwordError) {
          passwordError.textContent = "";
        }
        unlockSite();
        return;
      }

      if (passwordError) {
        passwordError.textContent = "Wrong password.";
      }
      passwordInput.select();
    };

    passwordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitPassword();
      }
    });

    gate.addEventListener("click", (event) => {
      if (event.target === gate) {
        passwordInput.focus();
      }
    });

    passwordInput.addEventListener("input", () => {
      if (passwordError && passwordError.textContent) {
        passwordError.textContent = "";
      }

      if (passwordInput.value.trim() === expectedPassword) {
        unlockSite();
      }
    });
  }

  const savedAvatar = normalizeAvatar(loadJson(avatarKey, avatarDefaults));
  applyAvatar(savedAvatar);

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.viewTarget);
    });
  });

  if (musicToggle) {
    musicToggle.addEventListener("click", () => {
      void toggleMusic();
    });
  }

  if (videoRecordButton) {
    videoRecordButton.addEventListener("click", () => {
      void toggleVideoRecording();
    });
  }

  const savedView = loadActiveView();
  setActiveView(savedView);

  const avatarPanel = siteViews.find((panel) => panel.dataset.viewPanel === "avatar");
  if (avatarPanel) {
    avatarPanel.addEventListener("click", (event) => {
      const button = event.target.closest(".avatar-option[data-avatar-setting]");
      if (!button) {
        return;
      }

      const setting = button.dataset.avatarSetting;
      const value = button.dataset.avatarValue;
      if (!setting || !value) {
        return;
      }

      const nextAvatar = applyAvatar({
        ...loadJson(avatarKey, avatarDefaults),
        [setting]: value,
      });

      saveJson(avatarKey, nextAvatar);
    });
  }

  if (loadMusicPrefs().enabled !== false && isUnlocked) {
    void startMusic();
  } else {
    updateMusicToggle();
  }

  if (videoRecordButton) {
    setRecordButton();
  }

  updateVideoStatus("Ready to record.");
  void renderVideoGallery();

  const form = document.querySelector("#message-form");
  const feed = document.querySelector("#message-feed");
  const authorSelect = document.querySelector("#message-author");
  const textArea = document.querySelector("#message-text");
  const membersList = document.querySelector("#members-list");
  const newMembersList = document.querySelector("#new-members-list");
  const hint = document.querySelector(".message-hint");
  const submitButton = document.querySelector(".message-actions button");

  if (!form || !feed || !authorSelect || !textArea || !membersList || !newMembersList || !hint || !submitButton) {
    return;
  }

  const messageStorageKey = "catclub-message-board";
  const rosterStorageKey = "catclub-roster";

  const initialRoster = {
    members: ["Izzy", "Lexi", "Olivia", "Eve", "Alison", "Hailey"],
    newMembers: ["Elise", "Audrey"],
  };

  const loadMessages = () => {
    try {
      const raw = window.localStorage.getItem(messageStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveMessages = (messages) => {
    try {
      window.localStorage.setItem(messageStorageKey, JSON.stringify(messages));
    } catch {
      // Ignore storage failures so the board still works.
    }
  };

  const loadRoster = () => {
    try {
      const raw = window.localStorage.getItem(rosterStorageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (
        parsed &&
        Array.isArray(parsed.members) &&
        Array.isArray(parsed.newMembers)
      ) {
        return {
          members: parsed.members.filter((name) => typeof name === "string" && name.trim()),
          newMembers: parsed.newMembers.filter((name) => typeof name === "string" && name.trim()),
        };
      }
    } catch {
      // Fall back to defaults.
    }

    return {
      members: [...initialRoster.members],
      newMembers: [...initialRoster.newMembers],
    };
  };

  const normalizeRoster = (roster) => {
    const nextRoster = {
      members: [...roster.members],
      newMembers: [...roster.newMembers],
    };

    if (!nextRoster.members.includes("Hailey")) {
      const alisonIndex = nextRoster.members.indexOf("Alison");
      if (alisonIndex >= 0) {
        nextRoster.members.splice(alisonIndex + 1, 0, "Hailey");
      } else {
        nextRoster.members.push("Hailey");
      }
    }

    return nextRoster;
  };

  const saveRoster = (roster) => {
    try {
      window.localStorage.setItem(rosterStorageKey, JSON.stringify(roster));
    } catch {
      // Ignore storage failures so the board still works.
    }
  };

  const formatTime = (isoString) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(isoString));

  const renderMessages = () => {
    const messages = loadMessages();
    feed.innerHTML = "";

    if (messages.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No messages yet. Post the first one.";
      feed.append(empty);
      return;
    }

    for (const message of messages) {
      const card = document.createElement("article");
      card.className = "message-card";

      const meta = document.createElement("div");
      meta.className = "message-meta";

      const author = document.createElement("span");
      author.className = "message-author";
      author.textContent = message.author;

      const time = document.createElement("time");
      time.className = "message-time";
      time.dateTime = message.createdAt;
      time.textContent = formatTime(message.createdAt);

      const body = document.createElement("p");
      body.className = "message-text";
      body.textContent = message.text;

      meta.append(author, time);
      card.append(meta, body);
      feed.append(card);
    }
  };

  const renderRoster = () => {
    const roster = normalizeRoster(loadRoster());
    saveRoster(roster);
    const selectedBeforeRender = authorSelect.value;

    const currentNames = [...roster.members, ...roster.newMembers];
    const hasNames = currentNames.length > 0;

    authorSelect.innerHTML = "";

    if (!hasNames) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No names available";
      authorSelect.append(option);
      authorSelect.disabled = true;
      submitButton.disabled = true;
      hint.textContent = "Add a name back to post messages.";
    } else {
      authorSelect.disabled = false;
      submitButton.disabled = false;
      hint.textContent = "Use any name from the member list.";

      const addGroup = (label, names) => {
        const group = document.createElement("optgroup");
        group.label = label;

        names.forEach((name) => {
          const option = document.createElement("option");
          option.textContent = name;
          group.append(option);
        });

        authorSelect.append(group);
      };

      addGroup("Members", roster.members);
      addGroup("New members", roster.newMembers);

      if (currentNames.includes(selectedBeforeRender)) {
        authorSelect.value = selectedBeforeRender;
      } else {
        authorSelect.value = currentNames[0];
      }
    }

    const renderList = (listEl, names, sectionKey) => {
      listEl.innerHTML = "";

      if (names.length === 0) {
        const empty = document.createElement("li");
        empty.className = "member-empty";
        empty.textContent = "No names yet.";
        listEl.append(empty);
        return;
      }

      names.forEach((name) => {
        const item = document.createElement("li");
        item.className = "member-item";
        item.dataset.name = name;
        item.dataset.section = sectionKey;

        const nameButton = document.createElement("button");
        nameButton.type = "button";
        nameButton.className = "member-name";
        nameButton.textContent = name;
        nameButton.setAttribute("aria-label", `${name}, tap to show remove button`);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "member-remove";
        removeButton.textContent = "−";
        removeButton.setAttribute("aria-label", `Remove ${name} from the ${sectionKey === "members" ? "Members" : "New members"} list`);

        const reveal = () => {
          item.classList.toggle("is-revealed");
        };

        const remove = () => {
          const nextRoster = loadRoster();
          nextRoster[sectionKey] = nextRoster[sectionKey].filter((entry) => entry !== name);
          saveRoster(nextRoster);

          const messages = loadMessages().filter((message) => message.author !== name);
          saveMessages(messages);

          renderRoster();
          renderMessages();
        };

        nameButton.addEventListener("click", reveal);
        removeButton.addEventListener("click", remove);

        item.append(nameButton, removeButton);
        listEl.append(item);
      });
    };

    renderList(membersList, roster.members, "members");
    renderList(newMembersList, roster.newMembers, "newMembers");
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const author = authorSelect.value.trim();
    const text = textArea.value.trim();

    if (!author || !text) {
      textArea.focus();
      return;
    }

    const messages = loadMessages();
    messages.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    });

    saveMessages(messages);
    textArea.value = "";
    renderMessages();
    textArea.focus();
  });

  renderRoster();
  renderMessages();
  window.__catClubVideoReady = true;
});
