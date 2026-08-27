document.addEventListener("DOMContentLoaded", () => {
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
    members: ["Izzy", "Lexi", "Olivia", "Eve", "Alison"],
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
    const roster = loadRoster();
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
});
