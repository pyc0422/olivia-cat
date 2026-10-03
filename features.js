(() => {
  const openView = (view) => {
    const button = document.querySelector(`[data-view-target="${view}"]`);
    if (button) {
      button.click();
      return;
    }
    document.querySelectorAll(".site-view[data-view-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.viewPanel !== view;
    });
  };

  const openViewTab = (view, extraParams = {}) => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    Object.entries(extraParams).forEach(([key, value]) => url.searchParams.set(key, value));
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const currentName = () => {
    try {
      return JSON.parse(window.localStorage.getItem("catclub-current-user") || "null")?.name || "A Cat Club friend";
    } catch {
      return "A Cat Club friend";
    }
  };

  const callButton = document.querySelector("#call-meeting-button");
  const meetingButton = document.querySelector("#meeting-call-button");
  const meetingMediaButton = document.querySelector("#meeting-media-button");
  const meetingJoinButton = document.querySelector("#meeting-join-button");
  const meetingRoom = document.querySelector("#meeting-room");
  const meetingVideo = document.querySelector("#meeting-video");
  const meetingStatus = document.querySelector("#meeting-status");
  const meetingCaller = document.querySelector("#meeting-caller-name");
  const meetingRoomId = document.querySelector("#meeting-room-id");
  const meetingParticipants = document.querySelector("#meeting-participants");
  const gamesButton = document.querySelector('[data-view-target="games"]');
  const petStoreButton = document.querySelector('[data-view-target="pet-store"]');
  const savedAvatar = document.querySelector("#saved-avatar-stage");
  const notification = document.querySelector("#meeting-notification");
  const joinButton = document.querySelector("#join-meeting-button");
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("catclub-meeting") : null;
  let activeMeeting = null;
  let mediaStream = null;
  let onlineProfiles = [];

  const showMeetingNotice = (meeting) => {
    activeMeeting = meeting;
    if (notification) {
      notification.hidden = false;
      notification.textContent = `${meeting.caller} has called a meeting!`;
    }
    if (joinButton) joinButton.hidden = false;
    if (meetingJoinButton) meetingJoinButton.hidden = false;
  };

  const announceMeeting = () => {
    const meeting = { id: Math.random().toString(36).slice(2, 9), caller: currentName(), startedAt: Date.now() };
    activeMeeting = meeting;
    window.localStorage.setItem("catclub-active-meeting", JSON.stringify(meeting));
    channel?.postMessage({ type: "meeting-called", meeting });
    openViewTab("meeting");
  };

  const joinMeeting = () => {
    if (!activeMeeting) return;
    openViewTab("meeting", { room: activeMeeting.id });
  };

  const renderMeetingParticipants = () => {
    if (!meetingParticipants) return;
    meetingParticipants.innerHTML = "";
    const avatar = savedAvatar?.cloneNode(true);
    if (avatar) {
      avatar.removeAttribute("id");
      avatar.className = "meeting-cat-preview";
      meetingParticipants.append(avatar);
    }
    onlineProfiles.filter((profile) => profile.name !== currentName()).slice(0, 8).forEach((profile) => {
      const person = document.createElement("span");
      person.className = "meeting-person";
      person.textContent = `🐱 ${profile.name}`;
      person.title = `${profile.name}'s saved cat is visible in the meeting`;
      meetingParticipants.append(person);
    });
  };

  const enterMeeting = () => {
    openView("meeting");
    if (!activeMeeting) {
      try { activeMeeting = JSON.parse(window.localStorage.getItem("catclub-active-meeting") || "null"); } catch { activeMeeting = null; }
    }
    if (activeMeeting) {
      meetingRoom.hidden = false;
      meetingCaller.textContent = `${activeMeeting.caller}'s meeting`;
      meetingRoomId.textContent = `Room ${activeMeeting.id}`;
      meetingStatus.textContent = "You are in the same Cat Club meeting room. Turn on your camera and microphone to join the conversation.";
      renderMeetingParticipants();
    }
  };

  const toggleMedia = async () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      meetingVideo.srcObject = null;
      meetingMediaButton.textContent = "Turn on camera and mic";
      return;
    }
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      meetingVideo.srcObject = mediaStream;
      meetingMediaButton.textContent = "Turn off camera and mic";
      meetingStatus.textContent = "Camera and microphone are on. Other members can join this room.";
    } catch {
      meetingStatus.textContent = "Camera or microphone permission was not available. You can still join the room chat.";
    }
  };

  callButton?.addEventListener("click", announceMeeting);
  meetingButton?.addEventListener("click", () => { announceMeeting(); enterMeeting(); });
  meetingMediaButton?.addEventListener("click", () => void toggleMedia());
  joinButton?.addEventListener("click", joinMeeting);
  meetingJoinButton?.addEventListener("click", enterMeeting);
  gamesButton?.addEventListener("click", (event) => {
    event.preventDefault();
    openViewTab("games");
  });
  petStoreButton?.addEventListener("click", (event) => {
    event.preventDefault();
    openViewTab("pet-store");
  });
  channel?.addEventListener("message", (event) => {
    if (event.data?.type === "meeting-called") showMeetingNotice(event.data.meeting);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "catclub-active-meeting" && event.newValue) {
      try { showMeetingNotice(JSON.parse(event.newValue)); } catch { /* Ignore malformed notices. */ }
    }
  });

  const storedMeeting = window.localStorage.getItem("catclub-active-meeting");
  if (storedMeeting) {
    try { showMeetingNotice(JSON.parse(storedMeeting)); } catch { /* Ignore stale notices. */ }
  }

  const loadOnlineProfiles = async () => {
    const db = window.catclubDb;
    if (!db?.loadProfiles) return;
    const profiles = await db.loadProfiles().catch(() => []);
    onlineProfiles = profiles.filter((profile) => profile?.name);
    if (!meetingRoom.hidden) renderMeetingParticipants();
  };
  void loadOnlineProfiles();

  const petStatus = document.querySelector("#pet-status");
  const feedButton = document.querySelector("#pet-feed-button");
  const petStateKey = "catclub-pet-state";
  let pet = { food: 2, toys: 1, lastFedAt: Date.now() };
  try { pet = { ...pet, ...JSON.parse(window.localStorage.getItem(petStateKey) || "{}")} } catch { /* Use defaults. */ }

  const savePet = () => window.localStorage.setItem(petStateKey, JSON.stringify(pet));
  const renderPet = (message = "") => {
    if (message) petStatus.textContent = message;
    else if (pet.food <= 0) petStatus.textContent = "Your cat is hungry! Visit the Pet Store for more food.";
    else petStatus.textContent = `Food: ${pet.food} · Toys: ${pet.toys}`;
  };
  const checkFeeding = () => {
    if (Date.now() - Number(pet.lastFedAt || 0) > 24 * 60 * 60 * 1000) {
      pet.food = Math.max(0, pet.food - 1);
      pet.toys = Math.max(0, pet.toys - 1);
      pet.lastFedAt = Date.now();
      savePet();
      renderPet(pet.food ? "Your cat missed a meal and lost one item. Feed them soon!" : "Your cat ran out of food. Visit the Pet Store!");
    } else renderPet();
  };
  feedButton?.addEventListener("click", () => {
    if (!pet.food) return renderPet("No food left. Visit the Pet Store first.");
    pet.food -= 1;
    pet.lastFedAt = Date.now();
    savePet();
    renderPet("Your cat is fed and happy!");
  });
  document.querySelectorAll("[data-pet-buy]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.petBuy === "food") pet.food += 2;
    else pet.toys += 1;
    savePet();
    renderPet(`Bought ${button.dataset.petBuy === "food" ? "cat food" : "a toy"}.`);
  }));
  checkFeeding();

  const view = new URLSearchParams(window.location.search).get("view");
  if (view === "meeting" || view === "pet-store" || view === "games") window.setTimeout(() => {
    openView(view);
    if (view === "meeting") enterMeeting();
  }, 50);
})();
