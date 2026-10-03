(() => {
  const board = document.querySelector("#cat-game-board");
  const player = document.querySelector("#cat-game-player");
  const count = document.querySelector("#cat-game-key-count");
  const status = document.querySelector("#cat-game-status");
  const mission = document.querySelector("#cat-game-mission");
  const rescueCount = document.querySelector("#cat-game-rescue-count");
  const battleCount = document.querySelector("#cat-game-battle-count");
  const reward = document.querySelector("#cat-game-reward");
  const healthFill = document.querySelector("#cat-game-health-fill");
  const healthValue = document.querySelector("#cat-game-health-value");
  const inventory = document.querySelector("#cat-game-inventory");
  const dialogue = document.querySelector("#cat-game-dialogue");
  const fullscreenButton = document.querySelector("#cat-game-fullscreen");
  const returnButton = document.querySelector("#cat-game-return");
  const enterHouseButton = document.querySelector("#cat-game-enter-house");
  const playerList = document.querySelector("#cat-game-player-list");
  const followStatus = document.querySelector("#cat-game-follow-status");
  const chatForm = document.querySelector("#cat-game-chat-form");
  const chatInput = document.querySelector("#cat-game-chat-input");
  const chatFeed = document.querySelector("#cat-game-chat-feed");
  const actionButtons = [...document.querySelectorAll("[data-cat-action]")];
  const house = document.querySelector("#cat-game-house");
  const builderButton = document.querySelector("#cat-game-builder");
  const houseStatus = document.querySelector("#cat-game-house-status");
  const resetButton = document.querySelector("#cat-game-reset");
  const levelUpButton = document.querySelector("#cat-game-level-up");
  const gamePanel = document.querySelector('[data-view-panel="cat-game"]');

  if (!board || !player || !count || !status || !mission || !rescueCount || !battleCount || !reward || !healthFill || !healthValue || !inventory || !dialogue || !fullscreenButton || !returnButton || !enterHouseButton || !playerList || !followStatus || !chatForm || !chatInput || !chatFeed || !house || !builderButton || !houseStatus || !resetButton || !levelUpButton || !gamePanel) return;

  const progressKey = "catclub-cat-game-progress";
  const furnitureKey = "catclub-furniture";
  const houseSizeKey = "catclub-house-expanded";
  const socialKey = "catclub-game-social";
  const furnitureCatalog = {
    "cat-bed": ["Cat bed", "🛏️"],
    "toy-basket": ["Toy basket", "🧺"],
    "royal-cat-tree": ["Royal cat tree", "🌳"],
    "moon-sofa": ["Moon sofa", "🛋️"],
    "starter-bed": ["Starter bed", "🛏️"],
  };
  const keys = [...board.querySelectorAll(".cat-game-key")];
  const villagers = [...board.querySelectorAll(".cat-game-villager")];
  const enemies = [...board.querySelectorAll(".cat-game-enemy")];
  const savedAvatar = document.querySelector("#saved-avatar-stage");
  const position = { x: 10, y: 12 };
  const step = 3.5;
  let collected = new Set();
  let rescued = new Set();
  let defeated = new Set();
  let houseExpanded = false;
  let health = 100;
  let inventoryState = { fish: 2, wood: 0, potion: 0, charm: 0 };
  let levelWon = false;
  let gameLevel = 1;
  let following = new Set();
  let chatMessages = [];
  let playerNames = ["Izzy", "Olivia", "Lexi", "Eve", "Alison", "Hailey", "Elise", "Audrey"];

  const loadProgress = () => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(progressKey) || "{}");
      if (Array.isArray(stored)) {
        collected = new Set(stored);
      } else {
        collected = new Set(Array.isArray(stored.keys) ? stored.keys : []);
        rescued = new Set(Array.isArray(stored.rescued) ? stored.rescued : []);
        defeated = new Set(Array.isArray(stored.defeated) ? stored.defeated : []);
        health = Math.max(0, Math.min(100, Number(stored.health ?? 100)));
        inventoryState = { ...inventoryState, ...(stored.inventory || {}) };
        levelWon = stored.levelWon === true;
        gameLevel = Math.max(1, Number(stored.level || 1));
      }
    } catch {
      collected = new Set();
    }
  };

  const saveProgress = () => {
    try {
      window.localStorage.setItem(progressKey, JSON.stringify({
        keys: [...collected],
        rescued: [...rescued],
        defeated: [...defeated],
        health,
        inventory: inventoryState,
        levelWon,
        level: gameLevel,
      }));
    } catch {
      // Ignore storage failures.
    }
  };

  const renderHouse = () => {
    let owned = [];
    try {
      owned = JSON.parse(window.localStorage.getItem(furnitureKey) || "[]");
    } catch {
      owned = [];
    }

    house.innerHTML = "";
    house.classList.toggle("is-expanded", houseExpanded);
    const displayedFurniture = owned.length ? owned : ["starter-bed"];
    displayedFurniture.filter((item) => furnitureCatalog[item]).forEach((item) => {
      const [label, icon] = furnitureCatalog[item];
      const furniture = document.createElement("div");
      furniture.className = `cat-house-furniture cat-house-furniture-${item}`;
      furniture.title = label;
      furniture.textContent = icon;
      house.append(furniture);
    });

    if (!owned.length) {
      const empty = document.createElement("span");
      empty.className = "cat-house-empty";
      empty.textContent = "Your house is waiting for furniture.";
      house.append(empty);
    }
    builderButton.textContent = houseExpanded ? "Shrink house" : "Visit builder";
    houseStatus.textContent = houseExpanded ? "Builder upgrade: expanded house." : owned.length ? "Buy more furniture from either shop." : "Your starter bed is ready.";
  };

  const loadHouseState = () => {
    try {
      houseExpanded = window.localStorage.getItem(houseSizeKey) === "true";
    } catch {
      houseExpanded = false;
    }
  };

  const loadSocialState = () => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(socialKey) || "{}");
      following = new Set(Array.isArray(stored.following) ? stored.following : []);
      chatMessages = Array.isArray(stored.chat) ? stored.chat.slice(-20) : [];
    } catch {
      following = new Set();
      chatMessages = [];
    }
  };

  const saveSocialState = () => {
    try {
      window.localStorage.setItem(socialKey, JSON.stringify({ following: [...following], chat: chatMessages.slice(-20) }));
    } catch {
      // Ignore storage failures.
    }
  };

  const currentPlayerName = () => {
    try {
      return JSON.parse(window.localStorage.getItem("catclub-current-user") || "null")?.name || "You";
    } catch {
      return "You";
    }
  };

  const renderSocial = () => {
    playerList.innerHTML = "";
    playerNames.filter((name) => name !== currentPlayerName()).forEach((name) => {
      const row = document.createElement("div");
      row.className = "cat-game-player-row";
      const label = document.createElement("span");
      label.textContent = `🐱 ${name}`;
      const followButton = document.createElement("button");
      followButton.type = "button";
      followButton.textContent = following.has(name) ? "Following" : "Follow";
      followButton.addEventListener("click", () => {
        if (following.has(name)) {
          following.delete(name);
          followStatus.textContent = `You unfollowed ${name}.`;
        } else {
          following.add(name);
          followStatus.textContent = `You follow ${name}. Ask them to follow back in chat.`;
        }
        saveSocialState();
        renderSocial();
      });
      row.append(label, followButton);
      if (following.has(name)) {
        const askButton = document.createElement("button");
        askButton.type = "button";
        askButton.textContent = "Ask back";
        askButton.addEventListener("click", () => {
          chatMessages.push({ name: currentPlayerName(), body: `${name}, please follow me back!` });
          chatMessages = chatMessages.slice(-20);
          saveSocialState();
          renderChat();
          followStatus.textContent = `You asked ${name} to follow back.`;
        });
        row.append(askButton);
      }
      playerList.append(row);
    });
  };

  const renderChat = () => {
    chatFeed.innerHTML = "";
    chatMessages.slice(-8).forEach((message) => {
      const line = document.createElement("div");
      line.className = "cat-game-chat-line";
      line.textContent = `${message.name}: ${message.body}`;
      chatFeed.append(line);
    });
  };

  const loadOnlinePlayers = async () => {
    const db = window.catclubDb;
    if (db?.loadProfiles) {
      const profiles = await db.loadProfiles().catch(() => []);
      const names = profiles.map((profile) => profile.name).filter(Boolean);
      if (names.length) playerNames = [...new Set([...playerNames, ...names])];
    }
    if (db?.loadMessages) {
      const messages = await db.loadMessages().catch(() => []);
      const gameMessages = messages
        .filter((message) => typeof message.body === "string" && message.body.startsWith("[Game]"))
        .slice(0, 20)
        .reverse()
        .map((message) => ({ name: message.user_name || message.author_name || "Club friend", body: message.body.replace(/^\[Game\]\s*/, "") }));
      if (gameMessages.length) {
        chatMessages = gameMessages;
        saveSocialState();
        renderChat();
      }
    }
    renderSocial();
  };

  const copySavedAvatar = () => {
    if (!savedAvatar || player.querySelector(".avatar-stage")) return;
    const avatar = savedAvatar.cloneNode(true);
    avatar.removeAttribute("id");
    player.append(avatar);
  };

  const renderAvatar = () => {
    const avatar = player.querySelector(".avatar-stage");
    if (!avatar || !savedAvatar) return;
    ["color", "eyes", "mouth", "clothes", "accessory"].forEach((part) => {
      avatar.dataset[part] = savedAvatar.dataset[part] || avatar.dataset[part];
    });
  };

  const render = () => {
    player.style.left = `${position.x}%`;
    player.style.top = `${position.y}%`;
    keys.forEach((key) => key.classList.toggle("is-collected", collected.has(key.dataset.keyId)));
    villagers.forEach((villager) => villager.classList.toggle("is-rescued", rescued.has(villager.dataset.villagerId)));
    enemies.forEach((enemy) => enemy.classList.toggle("is-defeated", defeated.has(enemy.dataset.enemyId)));
    count.textContent = String(collected.size);
    rescueCount.textContent = String(rescued.size);
    battleCount.textContent = String(defeated.size);
    levelUpButton.classList.toggle("is-ready", levelWon);
    levelUpButton.textContent = `Level up from level ${gameLevel}`;
    healthFill.style.width = `${health}%`;
    healthFill.style.background = health <= 30 ? "#d85f58" : health <= 60 ? "#e3a33e" : "#69aa68";
    healthValue.textContent = String(health);
    inventory.innerHTML = "";
    Object.entries(inventoryState).forEach(([item, amount]) => {
      if (!amount) return;
      const itemBadge = document.createElement("span");
      itemBadge.textContent = `${item}: ${amount}`;
      inventory.append(itemBadge);
    });

    if (rescued.size >= 3 && defeated.size >= 3) {
      levelWon = true;
      gamePanel.classList.add("cat-game-level-won");
      status.textContent = `Level ${gameLevel} complete! Your legendary rewards are ready.`;
      dialogue.textContent = "All the village cats are safe! You won the level!";
    } else if (collected.size >= 3) {
      status.textContent = "Quest unlocked! Rescue the village cats and defeat the clumsy dogs.";
      mission.classList.remove("cat-game-mission-locked");
      mission.innerHTML = `<span class="cat-game-mission-badge">!</span><span><strong>Mission complete</strong><br />Level ${gameLevel} is ready to advance.</span>`;
    } else {
      gamePanel.classList.remove("cat-game-level-won");
      status.textContent = `Find ${3 - collected.size} more magic key${3 - collected.size === 1 ? "" : "s"} to unlock your first mission.`;
    }
    reward.textContent = defeated.size >= 3
      ? "Legendary cape and star crown unlocked!"
      : "Legendary rewards: defeat all three clumsy dogs.";
    saveProgress();
  };

  const say = (message) => {
    dialogue.textContent = message;
  };

  const getPercentPosition = (element) => ({
    x: parseFloat(getComputedStyle(element).left) / board.clientWidth * 100,
    y: parseFloat(getComputedStyle(element).top) / board.clientHeight * 100,
  });

  const isNearPlayer = (element, distance = 10) => {
    const target = getPercentPosition(element);
    return Math.abs(position.x + 3 - target.x) < distance && Math.abs(position.y + 3 - target.y) < distance;
  };

  const rewardLegendaryItem = (setting, value, label) => {
    window.dispatchEvent(new CustomEvent("catclub-game-reward", { detail: { setting, value, label } }));
  };

  const rescueNearbyVillagers = () => {
    villagers.forEach((villager) => {
      if (!rescued.has(villager.dataset.villagerId) && isNearPlayer(villager, 9)) {
        rescued.add(villager.dataset.villagerId);
        saveProgress();
      }
    });
  };

  const battleNearbyEnemy = () => {
    const enemy = enemies.find((item) => !defeated.has(item.dataset.enemyId) && isNearPlayer(item, 12));
    if (!enemy) {
      status.textContent = "Swing and miss! Get closer to a clumsy dog first.";
      return;
    }

    defeated.add(enemy.dataset.enemyId);
    health = Math.max(0, health - 10);
    saveProgress();
    if (defeated.size === 1) rewardLegendaryItem("accessory", "cape", "Legendary cape");
    if (defeated.size === 3) rewardLegendaryItem("accessory", "star-crown", "Legendary star crown");
    status.textContent = "Bonk! The clumsy dog fumbled its attack.";
    render();
  };

  const toggleHouseSize = () => {
    houseExpanded = !houseExpanded;
    try {
      window.localStorage.setItem(houseSizeKey, String(houseExpanded));
    } catch {
      // Ignore storage failures.
    }
    renderHouse();
    say(houseExpanded ? "Builder: Your house is bigger now!" : "Builder: The house is cozy again.");
  };

  const enterHouse = () => {
    board.classList.add("is-house-mode");
    position.x = 45;
    position.y = 38;
    enterHouseButton.textContent = "Leave house";
    say("Home: Welcome in! Chat with friends, rest in your bed, or decorate.");
    render();
    board.focus();
  };

  const leaveHouse = () => {
    board.classList.remove("is-house-mode");
    position.x = 10;
    position.y = 12;
    enterHouseButton.textContent = "Enter house";
    say("Adventure: The meadow is waiting.");
    render();
    board.focus();
  };

  const runAction = (action) => {
    if (action === "craft") {
      if (inventoryState.charm) return say("Crafter: You already made a magic key charm.");
      if (collected.size < 2) return say("Crafter: Bring me two magic keys first.");
      inventoryState.charm = 1;
      say("Crafter: You made a magic key charm!");
    } else if (action === "build") {
      toggleHouseSize();
    } else if (action === "rescue") {
      rescueNearbyVillagers();
      say(rescued.size >= 3 ? "Rescuer: Every village cat is safe!" : "Rescuer: Move close to a captured cat to save it.");
    } else if (action === "chat") {
      say(rescued.size ? "Friend: We believe in you, Cat Club!" : "Friend: The village cats need your help!");
    } else if (action === "spy") {
      say("Spy report: The clumsy dogs are marked with 🐶. Press Space near one.");
    } else if (action === "restaurant") {
      inventoryState.fish += 2;
      inventoryState.wood += 1;
      say("Restaurant: Fresh fish and a building plank added to your inventory.");
    } else if (action === "eat") {
      if (!inventoryState.fish) return say("Restaurant: You need food first.");
      inventoryState.fish -= 1;
      health = Math.min(100, health + 25);
      say("Mmm! You ate fish and regained health.");
    } else if (action === "sleep") {
      health = 100;
      say("Home: You slept in your starter bed and feel completely rested.");
    }
    saveProgress();
    render();
  };

  const collectNearbyKeys = () => {
    const playerX = position.x + 3;
    const playerY = position.y + 3;
    keys.forEach((key) => {
      if (collected.has(key.dataset.keyId)) return;
      const keyPosition = getPercentPosition(key);
      if (Math.abs(playerX - keyPosition.x) < 7 && Math.abs(playerY - keyPosition.y) < 9) {
        collected.add(key.dataset.keyId);
        saveProgress();
      }
    });
    rescueNearbyVillagers();
    render();
  };

  const move = (key) => {
    if (gamePanel.hidden) return;
    const directions = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      a: [-step, 0],
      d: [step, 0],
      w: [0, -step],
      s: [0, step],
    };
    const delta = directions[key];
    if (!delta) return;
    position.x = Math.max(1, Math.min(91, position.x + delta[0]));
    position.y = Math.max(1, Math.min(86, position.y + delta[1]));
    collectNearbyKeys();
  };

  board.addEventListener("click", () => board.focus());
  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target?.isContentEditable) return;
    if (event.key === " ") {
      event.preventDefault();
      if (!gamePanel.hidden) battleNearbyEnemy();
      return;
    }
    if (!(event.key in { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, a: 1, d: 1, w: 1, s: 1 })) return;
    event.preventDefault();
    move(event.key);
  });
  resetButton.addEventListener("click", () => {
    collected.clear();
    rescued.clear();
    defeated.clear();
    health = 100;
    inventoryState = { fish: 2, wood: 0, potion: 0, charm: 0 };
    levelWon = false;
    gameLevel = 1;
    saveProgress();
    render();
    board.focus();
  });
  levelUpButton.addEventListener("click", () => {
    if (!levelWon) return;
    gameLevel += 1;
    collected.clear();
    rescued.clear();
    defeated.clear();
    health = 100;
    levelWon = false;
    say(`New mission: Level ${gameLevel} begins! Rescue the next village.`);
    saveProgress();
    render();
    board.focus();
  });
  builderButton.addEventListener("click", () => {
    toggleHouseSize();
  });
  enterHouseButton.addEventListener("click", () => {
    if (board.classList.contains("is-house-mode")) leaveHouse();
    else enterHouse();
  });
  returnButton.addEventListener("click", enterHouse);
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = chatInput.value.trim();
    if (!body) return;
    const name = currentPlayerName();
    const db = window.catclubDb;
    let shared = false;
    if (db?.addMessage && db?.getUser) {
      const user = await db.getUser().catch(() => null);
      if (user?.id) {
        shared = Boolean(await db.addMessage({ user_id: user.id, body: `[Game] ${body}` }).then(() => true).catch(() => false));
      }
    }
    chatMessages.push({ name, body });
    chatMessages = chatMessages.slice(-20);
    chatInput.value = "";
    saveSocialState();
    renderChat();
    say(shared ? "Your message was shared with the Cat Club." : "Your message was saved in this game chat.");
  });
  actionButtons.forEach((button) => button.addEventListener("click", () => runAction(button.dataset.catAction)));
  fullscreenButton.addEventListener("click", async () => {
    if (!document.fullscreenElement) {
      await gamePanel.requestFullscreen?.();
      fullscreenButton.textContent = "Exit full screen";
    } else {
      await document.exitFullscreen?.();
      fullscreenButton.textContent = "Full screen";
    }
  });
  window.addEventListener("catclub-avatar-saved", renderAvatar);
  window.addEventListener("catclub-furniture-updated", renderHouse);

  copySavedAvatar();
  loadProgress();
  loadHouseState();
  loadSocialState();
  renderAvatar();
  renderHouse();
  renderChat();
  void loadOnlinePlayers();
  render();
})();
