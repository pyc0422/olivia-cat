const initCatClubBoard = () => {
  if (window.__catClubBoardReady) {
    return;
  }

  window.__catClubBoardReady = true;

  void (async () => {
  const gate = document.querySelector("#password-gate");
  const passwordInput = document.querySelector("#password-input");
  const passwordError = document.querySelector("#password-error");
  const poster = document.querySelector("#site-poster");
  const tabButtons = [...document.querySelectorAll(".view-tab[data-view-target]")];
  const musicToggle = document.querySelector("[data-music-toggle]");
  const siteViews = [...document.querySelectorAll(".site-view[data-view-panel]")];
  const savedAvatarStage = document.querySelector("#saved-avatar-stage");
  const avatarStage = document.querySelector("#avatar-stage");
  const avatarBucks = document.querySelector("#avatar-bucks");
  const avatarStatus = document.querySelector("#avatar-status");
  const avatarSaveButton = document.querySelector("#avatar-save-button");
  const avatarButtons = [...document.querySelectorAll(".avatar-option[data-avatar-setting]")];
  const shopBalance = document.querySelector("#shop-balance");
  const shopBuyButtons = [...document.querySelectorAll("[data-shop-buy]")];
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
  const avatarDefaults = {
    color: "orange",
    eyes: "round",
    mouth: "smile",
    clothes: "hoodie",
    accessory: "none",
  };

  const avatarCatalog = {
    color: [
      { value: "orange", label: "Orange", cost: 0 },
      { value: "cream", label: "Cream", cost: 0 },
      { value: "gray", label: "Gray", cost: 0 },
      { value: "mint", label: "Mint", cost: 0 },
      { value: "pink", label: "Pink", cost: 0 },
      { value: "sky", label: "Sky", cost: 3, lockedFor: ["new_members"] },
      { value: "cocoa", label: "Cocoa", cost: 4, lockedFor: ["new_members"] },
      { value: "sunset", label: "Sunset", cost: 5, lockedFor: ["new_members"] },
    ],
    eyes: [
      { value: "round", label: "Round", cost: 0 },
      { value: "sleepy", label: "Sleepy", cost: 0 },
      { value: "sparkle", label: "Sparkle", cost: 0 },
      { value: "wink", label: "Wink", cost: 0 },
      { value: "star", label: "Star", cost: 0 },
      { value: "heart", label: "Heart", cost: 3, lockedFor: ["new_members"] },
      { value: "moon", label: "Moon", cost: 4, lockedFor: ["new_members"] },
    ],
    mouth: [
      { value: "smile", label: "Smile", cost: 0 },
      { value: "tiny", label: "Tiny", cost: 0 },
      { value: "open", label: "Open", cost: 0 },
      { value: "tongue", label: "Tongue", cost: 0 },
      { value: "shy", label: "Shy", cost: 0 },
      { value: "grin", label: "Grin", cost: 3, lockedFor: ["new_members"] },
      { value: "meow", label: "Meow", cost: 4, lockedFor: ["new_members"] },
    ],
    clothes: [
      { value: "none", label: "None", cost: 0 },
      { value: "tee", label: "Tee", cost: 0 },
      { value: "hoodie", label: "Hoodie", cost: 0 },
      { value: "scarf", label: "Scarf", cost: 0 },
      { value: "bow", label: "Bow", cost: 0 },
      { value: "vest", label: "Vest", cost: 4, lockedFor: ["new_members"] },
      { value: "raincoat", label: "Raincoat", cost: 5, lockedFor: ["new_members"] },
      { value: "dress", label: "Dress", cost: 5, lockedFor: ["new_members"] },
    ],
    accessory: [
      { value: "none", label: "None", cost: 0 },
      { value: "bowtie", label: "Bow tie", cost: 2 },
      { value: "glasses", label: "Glasses", cost: 3 },
      { value: "flower", label: "Flower", cost: 2 },
      { value: "crown", label: "Crown", cost: 4, lockedFor: ["new_members"] },
      { value: "necklace", label: "Necklace", cost: 3, lockedFor: ["new_members"] },
      { value: "backpack", label: "Backpack", cost: 5, lockedFor: ["new_members"] },
    ],
  };
  const allowedAvatarOptions = Object.fromEntries(
    Object.entries(avatarCatalog).map(([key, items]) => [key, items.map((item) => item.value)]),
  );
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
    enabled: true,
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

  const waitForSupabaseDb = async (timeoutMs = 2500) => {
    if (window.catclubDb) {
      return window.catclubDb;
    }

    return new Promise((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;
        window.removeEventListener("catclub-supabase-ready", onReady);
        window.clearTimeout(timer);
        resolve(window.catclubDb || null);
      };

      const onReady = () => finish();
      const timer = window.setTimeout(finish, timeoutMs);

      window.addEventListener("catclub-supabase-ready", onReady, { once: true });
    });
  };

  const loadStoredCurrentUser = () => {
    try {
      const raw = window.localStorage.getItem("catclub-current-user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const db = await waitForSupabaseDb();
  const storedCurrentUser = loadStoredCurrentUser();
  const authSession = db ? await db.getSession().catch(() => null) : null;
  const currentUser = db
    ? await db.getUser().catch(() => storedCurrentUser || null)
    : storedCurrentUser || null;
  const canUseRemoteDb = Boolean(authSession && db);
  const currentProfile =
    canUseRemoteDb && currentUser
      ? await db.loadProfiles().then((profiles) => profiles.find((profile) => profile.id === currentUser.id) || null).catch(() => null)
      : null;
  const resolvedCurrentProfile =
    canUseRemoteDb && currentUser
      ? currentProfile ||
        (await db
          .ensureProfile({
            name: currentUser.user_metadata?.name || currentUser.email || "Unknown",
            email: currentUser.email || "",
            phone: currentUser.user_metadata?.phone || null,
            member_group: currentUser.user_metadata?.member_group || "members",
            level: currentUser.user_metadata?.level || "Noob",
            kitty_bucks: currentUser.user_metadata?.kitty_bucks || 0,
            avatar_unlocks: currentUser.user_metadata?.avatar_unlocks || {},
            avatar_color: currentUser.user_metadata?.avatar_color || "orange",
            avatar_eyes: currentUser.user_metadata?.avatar_eyes || "round",
            avatar_mouth: currentUser.user_metadata?.avatar_mouth || "smile",
            avatar_clothes: currentUser.user_metadata?.avatar_clothes || "hoodie",
            avatar_accessory: currentUser.user_metadata?.avatar_accessory || "none",
            board_visible: true,
          })
          .catch(() => null))
      : null;

  const currentAccount = resolvedCurrentProfile || currentProfile || storedCurrentUser || currentUser || null;
  const shouldRedirectToAuth =
    window.location.protocol !== "file:" && !authSession && !storedCurrentUser;
  if (gate) {
    gate.hidden = true;
  }

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

  const loadCurrentUserSnapshot = () => {
    try {
      const raw = window.localStorage.getItem("catclub-current-user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveCurrentUserSnapshot = (patch) => {
    try {
      const current = loadCurrentUserSnapshot() || {};
      const next = {
        ...current,
        ...patch,
        user_metadata: {
          ...(current.user_metadata || {}),
          ...(patch?.user_metadata || {}),
        },
      };

      window.localStorage.setItem("catclub-current-user", JSON.stringify(next));
      return next;
    } catch {
      return null;
    }
  };

  const normalizeAvatarUnlocks = (value) => {
    const base = {
      color: [],
      eyes: [],
      mouth: [],
      clothes: [],
      accessory: [],
    };

    if (!value || typeof value !== "object") {
      return base;
    }

    for (const key of Object.keys(base)) {
      const list = Array.isArray(value[key]) ? value[key] : [];
      base[key] = [...new Set(list.filter((entry) => typeof entry === "string"))];
    }

    return base;
  };

  const getAvatarOptionMeta = (setting, value) =>
    avatarCatalog[setting]?.find((item) => item.value === value) || null;

  const normalizeAvatar = (value) => {
    const next = { ...avatarDefaults, ...(value && typeof value === "object" ? value : {}) };

    for (const [key, options] of Object.entries(allowedAvatarOptions)) {
      if (!options.includes(next[key])) {
        next[key] = avatarDefaults[key];
      }
    }

    return next;
  };

  const avatarState = {
    memberGroup: currentAccount?.member_group || "members",
    kittyBucks: Number(currentAccount?.kitty_bucks || 0),
    unlocks: normalizeAvatarUnlocks(currentAccount?.avatar_unlocks),
    status: "",
  };

  const renderSavedAvatarBadge = (avatar = loadJson(avatarKey, avatarDefaults)) => {
    const state = normalizeAvatar(avatar);

    if (savedAvatarStage) {
      savedAvatarStage.dataset.color = state.color;
      savedAvatarStage.dataset.eyes = state.eyes;
      savedAvatarStage.dataset.mouth = state.mouth;
      savedAvatarStage.dataset.clothes = state.clothes;
      savedAvatarStage.dataset.accessory = state.accessory;
    }
  };

  const persistAvatarEconomy = async (avatar = loadJson(avatarKey, avatarDefaults)) => {
    const snapshot = {
      id: currentAccount?.id || currentUser?.id || storedCurrentUser?.id || null,
      name:
        currentAccount?.name ||
        currentUser?.user_metadata?.name ||
        currentUser?.email ||
        storedCurrentUser?.name ||
        "Unknown",
      email: currentAccount?.email || currentUser?.email || storedCurrentUser?.email || "",
      member_group: avatarState.memberGroup,
      level: currentAccount?.level || currentUser?.user_metadata?.level || storedCurrentUser?.level || "Noob",
      kitty_bucks: avatarState.kittyBucks,
      avatar_unlocks: avatarState.unlocks,
      user_metadata: {
        name:
          currentAccount?.name ||
          currentUser?.user_metadata?.name ||
          currentUser?.email ||
          storedCurrentUser?.name ||
          "Unknown",
        member_group: avatarState.memberGroup,
        level: currentAccount?.level || currentUser?.user_metadata?.level || storedCurrentUser?.level || "Noob",
        kitty_bucks: avatarState.kittyBucks,
        avatar_unlocks: avatarState.unlocks,
        avatar_color: avatar.color,
        avatar_eyes: avatar.eyes,
        avatar_mouth: avatar.mouth,
        avatar_clothes: avatar.clothes,
        avatar_accessory: avatar.accessory,
      },
      avatar_color: avatar.color,
      avatar_eyes: avatar.eyes,
      avatar_mouth: avatar.mouth,
      avatar_clothes: avatar.clothes,
      avatar_accessory: avatar.accessory,
    };

    saveCurrentUserSnapshot(snapshot);

    if (canUseRemoteDb && currentAccount?.id) {
      await db
        .updateProfile(currentAccount.id, {
          kitty_bucks: avatarState.kittyBucks,
          avatar_unlocks: avatarState.unlocks,
          avatar_color: avatar.color,
          avatar_eyes: avatar.eyes,
          avatar_mouth: avatar.mouth,
          avatar_clothes: avatar.clothes,
          avatar_accessory: avatar.accessory,
        })
        .catch(() => null);
    }
  };

  const setAvatarStatus = (message) => {
    avatarState.status = message;
    if (avatarStatus) {
      avatarStatus.textContent = message;
    }
  };

  const renderAvatarEconomy = () => {
    if (avatarBucks) {
      avatarBucks.textContent = String(avatarState.kittyBucks);
    }

    if (avatarStatus && !avatarState.status) {
      avatarStatus.textContent =
        avatarState.memberGroup === "new_members"
          ? "Locked items cost Kitty Bucks. Post messages to earn more."
          : "You can buy special items with Kitty Bucks.";
    }
  };

  const isAvatarUnlocked = (setting, value) => {
    const option = getAvatarOptionMeta(setting, value);
    if (!option || !option.lockedFor?.includes("new_members")) {
      return true;
    }

    if (avatarState.memberGroup !== "new_members") {
      return true;
    }

    return avatarState.unlocks[setting]?.includes(value) || false;
  };

  const syncAvatarButtons = () => {
      avatarButtons.forEach((button) => {
      const setting = button.dataset.avatarSetting;
      const value = button.dataset.avatarValue;
      const option = setting && value ? getAvatarOptionMeta(setting, value) : null;
      const locked = Boolean(option?.lockedFor?.includes("new_members") && avatarState.memberGroup === "new_members" && !isAvatarUnlocked(setting, value));
      const cost = option?.cost || 0;

      button.classList.toggle("is-locked", locked);
      button.dataset.avatarCost = cost ? String(cost) : "";
      button.dataset.avatarLockLabel = locked ? `${cost} Kitty Bucks` : "";
      button.dataset.avatarUnlock = locked ? "new_members" : "";
      button.setAttribute("aria-disabled", String(false));
      if (button.dataset.avatarLockLabel) {
        button.setAttribute("data-avatar-lock-label", button.dataset.avatarLockLabel);
      } else {
        button.removeAttribute("data-avatar-lock-label");
      }
    });

    syncShopButtons();
  };

  const applyAvatar = (avatar) => {
    const state = normalizeAvatar(avatar);

    if (avatarStage) {
      avatarStage.dataset.color = state.color;
      avatarStage.dataset.eyes = state.eyes;
      avatarStage.dataset.mouth = state.mouth;
      avatarStage.dataset.clothes = state.clothes;
      avatarStage.dataset.accessory = state.accessory;
    }

    avatarButtons.forEach((button) => {
      const setting = button.dataset.avatarSetting;
      const value = button.dataset.avatarValue;
      const isActive = Boolean(setting && value && state[setting] === value);
      button.classList.toggle("is-selected", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    syncAvatarButtons();
    renderAvatarEconomy();
    renderSavedAvatarBadge(state);

    return state;
  };

  const syncShopButtons = (avatar = loadJson(avatarKey, avatarDefaults)) => {
    const normalizedAvatar = normalizeAvatar(avatar);

    shopBuyButtons.forEach((button) => {
      const value = button.dataset.shopBuy;
      const option = getAvatarOptionMeta("accessory", value);
      const unlocked = isAvatarUnlocked("accessory", value);
      const cost = Number(button.dataset.shopCost || option?.cost || 0);
      const canAfford = avatarState.kittyBucks >= cost;
      const selected = normalizedAvatar.accessory === value;

      button.disabled = false;
      button.dataset.shopState = unlocked ? "owned" : canAfford ? "buy" : "locked";
      button.textContent = unlocked ? (selected ? "Equipped" : "Equip") : canAfford ? "Buy" : `Need ${cost}`;
    });

    if (shopBalance) {
      shopBalance.textContent = String(avatarState.kittyBucks);
    }
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

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(reader.error || new Error("Unable to read recording."));
      reader.readAsDataURL(blob);
    });

  const openVideoDb = () =>
    new Promise((resolve, reject) => {
      if (videoState.db) {
        resolve(videoState.db);
        return;
      }

      const request = window.indexedDB.open(videoDbName, 1);

      request.onupgradeneeded = () => {
        const localDb = request.result;
        if (!localDb.objectStoreNames.contains(videoStoreName)) {
          localDb.createObjectStore(videoStoreName, { keyPath: "id" });
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
    if (db) {
      return db.loadVideos().catch(() => []);
    }

    const localDb = await openVideoDb();
    const tx = localDb.transaction(videoStoreName, "readonly");
    const store = tx.objectStore(videoStoreName);
    const videos = await idbRequest(store.getAll());
    return Array.isArray(videos) ? videos.sort((a, b) => b.createdAt - a.createdAt) : [];
  };

  const saveVideoRecord = async (record) => {
    if (db) {
      await db.addVideo({
        user_id: currentUser?.id,
        author_name: resolvedCurrentProfile?.name || record.authorName || "Unknown",
        title: "Cat Club video",
        mime_type: record.mimeType || "video/webm",
        data_url: record.dataUrl || "",
      });
      return;
    }

    const localDb = await openVideoDb();
    const tx = localDb.transaction(videoStoreName, "readwrite");
    tx.objectStore(videoStoreName).put(record);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
      tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));
    });
  };

  const deleteVideoRecord = async (id) => {
    if (db) {
      await db.deleteVideo(id).catch(() => null);
      return;
    }

    const localDb = await openVideoDb();
    const tx = localDb.transaction(videoStoreName, "readwrite");
    tx.objectStore(videoStoreName).delete(id);
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

      const clipUrl = record.data_url || (record.blob ? window.URL.createObjectURL(record.blob) : "");
      if (record.blob && clipUrl) {
        videoState.galleryUrls.set(record.id, clipUrl);
      }
      clip.src = clipUrl;

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
        await deleteVideoRecord(record.id);
        updateVideoStatus("Video deleted.");
        await renderVideoGallery();
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
      }).format(new Date(record.created_at || record.createdAt || Date.now()));

      const duration = document.createElement("p");
      duration.className = "video-card-duration";
      duration.textContent = record.mime_type || record.mimeType || "Recorded clip";

      meta.append(title, duration, controls, menu);
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
        const dataUrl = await blobToDataUrl(blob);
        const record = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: Date.now(),
          mimeType: videoState.recorder?.mimeType || mimeType || "video/webm",
          dataUrl,
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

    musicToggle.textContent = musicState.enabled ? "Music on" : "Music off";
    musicToggle.setAttribute("aria-pressed", String(musicState.enabled));
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
    musicState.enabled = prefs.enabled !== false;
    if (!musicState.enabled) {
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
    if (musicState.running) {
      musicState.enabled = false;
      updateMusicToggle();
      saveMusicPrefs({ enabled: false });
      await stopMusic();
      return;
    }

    musicState.enabled = true;
    updateMusicToggle();
    saveMusicPrefs({ enabled: true });

    const started = await startMusic();
    if (!started) {
      musicState.enabled = false;
      saveMusicPrefs({ enabled: false });
      updateMusicToggle();
    }
  };

  const loadActiveView = () => {
    try {
      return window.sessionStorage.getItem(viewKey) || "board";
    } catch {
      return "board";
    }
  };

  const setActiveView = (viewName) => {
    const nextView =
      viewName === "avatar" || viewName === "shop" || viewName === "videos" || viewName === "art" || viewName === "levels"
        ? viewName
        : "board";

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

  const isUnlocked = true;
  unlockSite();

  const savedAvatar = normalizeAvatar(loadJson(avatarKey, avatarDefaults));
  applyAvatar(savedAvatar);
  renderSavedAvatarBadge(savedAvatar);
  syncShopButtons();

  tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
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
    avatarPanel.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const button = event.target.closest(".avatar-option[data-avatar-setting]");
      if (!button) {
        return;
      }

      const setting = button.dataset.avatarSetting;
      const value = button.dataset.avatarValue;
      if (!setting || !value) {
        return;
      }

      const option = getAvatarOptionMeta(setting, value);
      const nextAvatar = normalizeAvatar({
        ...loadJson(avatarKey, avatarDefaults),
        [setting]: value,
      });
      const lockedForNewMembers = Boolean(option?.lockedFor?.includes("new_members") && avatarState.memberGroup === "new_members");
      const alreadyUnlocked = isAvatarUnlocked(setting, value);

      if (lockedForNewMembers && !alreadyUnlocked) {
        const cost = option?.cost || 0;
        if (avatarState.kittyBucks < cost) {
          setAvatarStatus(`Need ${cost} Kitty Bucks to unlock ${option?.label || value}.`);
          return;
        }

        avatarState.kittyBucks -= cost;
        avatarState.unlocks[setting] = [...new Set([...(avatarState.unlocks[setting] || []), value])];
        saveJson(avatarKey, applyAvatar(nextAvatar));
        await persistAvatarEconomy(nextAvatar);
        setAvatarStatus(`Unlocked ${option?.label || value} for ${cost} Kitty Bucks.`);
        return;
      }

      saveJson(avatarKey, applyAvatar(nextAvatar));
      await persistAvatarEconomy(nextAvatar);
      setAvatarStatus(`Changed ${option?.label || value}.`);
    });
  }

  if (avatarSaveButton) {
    avatarSaveButton.addEventListener("click", async () => {
      const saved = normalizeAvatar(loadJson(avatarKey, avatarDefaults));
      saveJson(avatarKey, saved);
      renderSavedAvatarBadge(saved);
      setAvatarStatus("Saved your avatar to the top-left badge.");
      await persistAvatarEconomy(saved);
    });
  }

  const shopPanel = siteViews.find((panel) => panel.dataset.viewPanel === "shop");
  if (shopPanel) {
    shopPanel.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const button = event.target.closest("[data-shop-buy]");
      if (!button) {
        return;
      }

      const value = button.dataset.shopBuy;
      if (!value) {
        return;
      }

      const option = getAvatarOptionMeta("accessory", value);
      const cost = Number(button.dataset.shopCost || option?.cost || 0);
      const currentAvatar = normalizeAvatar(loadJson(avatarKey, avatarDefaults));
      const alreadyUnlocked = isAvatarUnlocked("accessory", value);

      if (!alreadyUnlocked && avatarState.kittyBucks < cost) {
        setAvatarStatus(`Need ${cost} Kitty Bucks to buy ${option?.label || value}.`);
        return;
      }

      if (!alreadyUnlocked) {
        avatarState.kittyBucks -= cost;
        avatarState.unlocks.accessory = [...new Set([...(avatarState.unlocks.accessory || []), value])];
        currentAvatar.accessory = value;
        saveJson(avatarKey, applyAvatar(currentAvatar));
        await persistAvatarEconomy(currentAvatar);
        setAvatarStatus(`Bought ${option?.label || value} for ${cost} Kitty Bucks.`);
        return;
      }

      currentAvatar.accessory = value;
      saveJson(avatarKey, applyAvatar(currentAvatar));
      await persistAvatarEconomy(currentAvatar);
      setAvatarStatus(`Equipped ${option?.label || value}.`);
    });
  }

  musicState.enabled = loadMusicPrefs().enabled !== false;
  updateMusicToggle();

  if (musicState.enabled && isUnlocked) {
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
  const authorDisplay = document.querySelector("#message-author-name");
  const textArea = document.querySelector("#message-text");
  const membersList = document.querySelector("#members-list");
  const newMembersList = document.querySelector("#new-members-list");
  const hint = document.querySelector(".message-hint");
  const submitButton = document.querySelector(".message-actions button");

  if (!form || !feed || !authorDisplay || !textArea || !membersList || !newMembersList || !hint || !submitButton) {
    return;
  }

  const allowedNames = Array.isArray(window.CATCLUB_CONFIG?.allowedMembers)
    ? window.CATCLUB_CONFIG.allowedMembers
    : ["Izzy", "Lexi", "Olivia", "Eve", "Alison", "Hailey", "Elise", "Audrey"];
  const defaultGroupByName = {
    Izzy: "members",
    Lexi: "members",
    Olivia: "members",
    Eve: "members",
    Alison: "members",
    Hailey: "members",
    Elise: "new_members",
    Audrey: "new_members",
  };
  const defaultLevels = {
    Izzy: "Leader",
    Olivia: "Trainer",
    Lexi: "Trainer",
    Eve: "Queen",
    Alison: "Queen",
    Hailey: "Queen",
    Elise: "Guard",
    Audrey: "Noob",
  };
  const fallbackAvatar = {
    avatar_color: "orange",
    avatar_eyes: "round",
    avatar_mouth: "smile",
    avatar_clothes: "hoodie",
  };

  const formatTime = (value) =>
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));

  const boardState = {
    profiles: [],
    messages: [],
  };

  const getProfileList = async () => {
    const buildFallbackProfiles = () =>
      allowedNames.map((name) => ({
        id: null,
        name,
        member_group: defaultGroupByName[name] || "members",
        level: defaultLevels[name] || "Noob",
        board_visible: true,
        ...fallbackAvatar,
      }));

    if (!canUseRemoteDb) {
      return buildFallbackProfiles();
    }

    const profiles = await db.loadProfiles().catch(() => []);
    if (!profiles.length) {
      return buildFallbackProfiles();
    }

    const byName = new Map(profiles.map((profile) => [profile.name, profile]));
    const merged = allowedNames.map((name) => {
      const profile = byName.get(name);
      if (profile) {
        return {
          ...profile,
          member_group: profile.member_group || defaultGroupByName[name] || "members",
          board_visible: profile.board_visible !== false,
          level: profile.level || defaultLevels[name] || "Noob",
        };
      }

      return {
        id: null,
        name,
        member_group: defaultGroupByName[name] || "members",
        level: defaultLevels[name] || "Noob",
        board_visible: true,
        ...fallbackAvatar,
      };
    });

    const visible = merged.filter((profile) => profile.board_visible !== false);
    return visible.length ? visible : buildFallbackProfiles();
  };

  const loadMessages = async () => {
    if (canUseRemoteDb) {
      return db.loadMessages().catch(() => []);
    }

    try {
      const raw = window.localStorage.getItem("catclub-message-board");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveLegacyMessages = (messages) => {
    try {
      window.localStorage.setItem("catclub-message-board", JSON.stringify(messages));
    } catch {
      // Ignore storage failures so the board still works locally.
    }
  };

  const renderMessages = async () => {
    const messages = await loadMessages();
    boardState.messages = messages;
    feed.innerHTML = "";

    if (!messages.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No messages yet. Post the first one.";
      feed.append(empty);
      return;
    }

    messages.forEach((message) => {
      const card = document.createElement("article");
      card.className = "message-card";

      const meta = document.createElement("div");
      meta.className = "message-meta";

      const author = document.createElement("span");
      author.className = "message-author";
      author.textContent = message.author_name || message.author || "Unknown";

      const time = document.createElement("time");
      time.className = "message-time";
      time.dateTime = message.created_at || message.createdAt || new Date().toISOString();
      time.textContent = formatTime(message.created_at || message.createdAt || Date.now());

      const body = document.createElement("p");
      body.className = "message-text";
      body.textContent = message.body || message.text || "";

      meta.append(author, time);
      card.append(meta, body);
      feed.append(card);
    });
  };

  const renderRoster = async () => {
    const roster = await getProfileList();
    boardState.profiles = roster;
    const grouped = {
      members: roster.filter((profile) => profile.member_group === "members"),
      new_members: roster.filter((profile) => profile.member_group === "new_members"),
    };
    const currentName =
      resolvedCurrentProfile?.name ||
      currentUser?.user_metadata?.name ||
      currentUser?.name ||
      currentUser?.email ||
      storedCurrentUser?.name ||
      allowedNames[0] ||
      "Unknown";
    authorDisplay.textContent = currentName;
    hint.textContent = "Messages post under your signed-in name.";
    submitButton.disabled = false;

    const renderList = (listEl, profiles, sectionKey) => {
      listEl.innerHTML = "";

      if (!profiles.length) {
        const empty = document.createElement("li");
        empty.className = "member-empty";
        empty.textContent = "No names yet.";
        listEl.append(empty);
        return;
      }

      profiles.forEach((profile) => {
        const item = document.createElement("li");
        item.className = "member-item";
        item.dataset.name = profile.name;
        item.dataset.section = sectionKey;

        const nameButton = document.createElement("button");
        nameButton.type = "button";
        nameButton.className = "member-name";
        nameButton.textContent = profile.name;
        nameButton.setAttribute("aria-label", `${profile.name}, tap to show remove button`);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "member-remove";
        removeButton.textContent = "−";
        removeButton.setAttribute("aria-label", `Remove ${profile.name} from the ${sectionKey === "members" ? "Members" : "New members"} list`);

        const reveal = () => {
          item.classList.toggle("is-revealed");
        };

        const remove = async () => {
          if (db && profile.id) {
            await db.updateProfile(profile.id, { board_visible: false }).catch(() => null);
          } else {
            const nextRoster = await getProfileList();
            const hidden = nextRoster.find((entry) => entry.name === profile.name);
            if (hidden) {
              hidden.board_visible = false;
            }
          }

          await renderRoster();
        };

        nameButton.addEventListener("click", reveal);
        removeButton.addEventListener("click", () => {
          void remove();
        });

        item.append(nameButton, removeButton);
        listEl.append(item);
      });
    };

    renderList(membersList, grouped.members, "members");
    renderList(newMembersList, grouped.new_members, "newMembers");

    window.dispatchEvent(
      new CustomEvent("catclub-roster-changed", {
        detail: {
          members: grouped.members.map((profile) => profile.name),
          newMembers: grouped.new_members.map((profile) => profile.name),
        },
      }),
    );
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const submit = async () => {
      const author = (
        resolvedCurrentProfile?.name ||
        currentUser?.user_metadata?.name ||
        currentUser?.email ||
        storedCurrentUser?.name ||
        ""
      ).trim();
      const text = textArea.value.trim();

      if (!author || !text) {
        textArea.focus();
        return;
      }

      const profile = boardState.profiles.find((entry) => entry.name === author);

      if (canUseRemoteDb && profile?.id) {
        await db.addMessage({
          user_id: profile.id,
          author_name: profile.name,
          body: text,
        });
        avatarState.kittyBucks += 1;
        await persistAvatarEconomy(loadJson(avatarKey, avatarDefaults));
        setAvatarStatus("You earned 1 Kitty Buck.");
      } else {
        const messages = await loadMessages();
        messages.unshift({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          author,
          text,
          createdAt: new Date().toISOString(),
        });
        saveLegacyMessages(messages);
        avatarState.kittyBucks += 1;
        saveCurrentUserSnapshot({
          kitty_bucks: avatarState.kittyBucks,
          avatar_unlocks: avatarState.unlocks,
        });
        renderAvatarEconomy();
        setAvatarStatus("You earned 1 Kitty Buck.");
      }

      textArea.value = "";
      await renderMessages();
      textArea.focus();
    };

    void submit();
  });

  await renderRoster();
  await renderMessages();
  window.__catClubVideoReady = true;
  if (shouldRedirectToAuth) {
    window.location.replace("/auth");
  }
  })();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCatClubBoard, { once: true });
} else {
  initCatClubBoard();
}
