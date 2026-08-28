const initCatClubLevels = () => {
  if (window.__catClubLevelsReady) {
    return;
  }

  window.__catClubLevelsReady = true;

  const levelsGraph = document.querySelector("#levels-graph");
  const membersList = document.querySelector("#levels-members");
  const newMembersList = document.querySelector("#levels-new-members");
  const selectedName = document.querySelector("#levels-selected-name");
  const selectedStatus = document.querySelector("#levels-selected-status");
  const levelDownButton = document.querySelector("#levels-down-button");
  const levelUpButton = document.querySelector("#levels-up-button");

  if (
    !levelsGraph ||
    !membersList ||
    !newMembersList ||
    !selectedName ||
    !selectedStatus ||
    !levelDownButton ||
    !levelUpButton
  ) {
    return;
  }

  const db = window.catclubDb || null;
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
  const levelLabels = ["Noob", "Kitten", "Warrior", "Guard", "Queen", "Trainer", "Leader"];
  const levelIndex = new Map(levelLabels.map((label, index) => [label, index]));

  const state = {
    profiles: [],
    selectedName: null,
  };

  const loadSelectedName = () => {
    try {
      const stored = window.localStorage.getItem("catclub-levels-selected");
      return stored && typeof stored === "string" ? stored : null;
    } catch {
      return null;
    }
  };

  const saveSelectedName = (name) => {
    try {
      window.localStorage.setItem("catclub-levels-selected", name || "");
    } catch {
      // Ignore storage failures.
    }
  };

  const getProfileRows = async () => {
    if (!db) {
      return allowedNames.map((name) => ({
        id: null,
        name,
        member_group: defaultGroupByName[name] || "members",
        level: defaultLevels[name] || "Noob",
      }));
    }

    const rows = await db.loadProfiles().catch(() => []);
    const byName = new Map(rows.map((row) => [row.name, row]));

    return allowedNames.map((name) => byName.get(name) || {
      id: null,
      name,
      member_group: defaultGroupByName[name] || "members",
      level: defaultLevels[name] || "Noob",
    });
  };

  const saveLevel = async (profile, level) => {
    if (db && profile?.id) {
      await db.updateProfile(profile.id, { level }).catch(() => null);
      return;
    }

    profile.level = level;
  };

  const getLevelIndexForName = (name) => levelIndex.get(state.profiles.find((profile) => profile.name === name)?.level || "Noob") ?? 0;

  const setSelection = (name) => {
    if (!name) {
      return;
    }

    state.selectedName = name;
    saveSelectedName(name);
    renderAll();
  };

  const renderNameList = (container, profiles, sectionLabel) => {
    container.innerHTML = "";

    profiles.forEach((profile) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "levels-name-button";
      button.textContent = profile.name;
      button.setAttribute("aria-label", `${profile.name}, ${sectionLabel}`);
      button.classList.toggle("is-selected", state.selectedName === profile.name);
      button.addEventListener("click", () => setSelection(profile.name));
      container.append(button);
    });
  };

  const renderGraph = () => {
    levelsGraph.innerHTML = "";

    levelLabels.forEach((label) => {
      const tier = document.createElement("section");
      tier.className = "levels-tier";
      tier.dataset.level = label;

      const tierLabel = document.createElement("div");
      tierLabel.className = "levels-tier-label";
      tierLabel.textContent = label;

      const tierMembers = document.createElement("div");
      tierMembers.className = "levels-tier-members";

      const namesHere = state.profiles.filter((profile) => profile.level === label);
      namesHere.forEach((profile) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "levels-chip";
        chip.textContent = profile.name;
        chip.classList.toggle("is-selected", state.selectedName === profile.name);
        chip.setAttribute("aria-label", `${profile.name}, ${label}`);
        chip.addEventListener("click", () => setSelection(profile.name));
        tierMembers.append(chip);
      });

      if (state.selectedName && getLevelIndexForName(state.selectedName) === levelIndex.get(label)) {
        tier.classList.add("is-current-tier");
      }

      tier.append(tierLabel, tierMembers);
      levelsGraph.append(tier);
    });
  };

  const renderStatus = () => {
    const profile = state.profiles.find((entry) => entry.name === state.selectedName);

    if (!profile) {
      selectedName.textContent = "Select a name";
      selectedStatus.textContent = "Press a person to see their status.";
      levelDownButton.disabled = true;
      levelDownButton.setAttribute("aria-disabled", "true");
      levelUpButton.disabled = true;
      levelUpButton.setAttribute("aria-disabled", "true");
      return;
    }

    const index = getLevelIndexForName(profile.name);

    selectedName.textContent = profile.name;
    selectedStatus.textContent = `${profile.name} is at ${profile.level}.`;
    levelDownButton.disabled = index <= 0;
    levelDownButton.setAttribute("aria-disabled", String(index <= 0));
    levelDownButton.title = index <= 0 ? `${profile.name} is already at Noob.` : `Move ${profile.name} down one level.`;
    levelUpButton.disabled = index >= levelLabels.length - 1;
    levelUpButton.setAttribute("aria-disabled", String(index >= levelLabels.length - 1));
    levelUpButton.title = index >= levelLabels.length - 1 ? `${profile.name} is already at Leader.` : `Move ${profile.name} up one level.`;
  };

  const renderAll = () => {
    const currentNames = state.profiles.map((profile) => profile.name);
    if (state.selectedName && !currentNames.includes(state.selectedName)) {
      state.selectedName = currentNames[0] || null;
      saveSelectedName(state.selectedName);
    }

    const grouped = {
      members: state.profiles.filter((profile) => profile.member_group === "members"),
      newMembers: state.profiles.filter((profile) => profile.member_group === "new_members"),
    };

    renderNameList(membersList, grouped.members, "member");
    renderNameList(newMembersList, grouped.newMembers, "new member");
    renderGraph();
    renderStatus();
  };

  const refresh = async () => {
    state.profiles = await getProfileRows();
    const savedSelection = loadSelectedName();
    if (savedSelection && state.profiles.some((profile) => profile.name === savedSelection)) {
      state.selectedName = savedSelection;
    } else if (!state.selectedName || !state.profiles.some((profile) => profile.name === state.selectedName)) {
      state.selectedName = state.profiles[0]?.name || null;
    }

    if (state.selectedName) {
      saveSelectedName(state.selectedName);
    }

    renderAll();
  };

  levelDownButton.addEventListener("click", () => {
    const profile = state.profiles.find((entry) => entry.name === state.selectedName);
    if (!profile) {
      return;
    }

    const nextIndex = Math.max(0, getLevelIndexForName(profile.name) - 1);
    const nextLevel = levelLabels[nextIndex];
    void saveLevel(profile, nextLevel).then(refresh);
  });

  levelUpButton.addEventListener("click", () => {
    const profile = state.profiles.find((entry) => entry.name === state.selectedName);
    if (!profile) {
      return;
    }

    const nextIndex = Math.min(levelLabels.length - 1, getLevelIndexForName(profile.name) + 1);
    const nextLevel = levelLabels[nextIndex];
    void saveLevel(profile, nextLevel).then(refresh);
  });

  void refresh();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCatClubLevels, { once: true });
} else {
  initCatClubLevels();
}
