class LiveSession {
  constructor(store) {
  this._wss = "wss://townsquare-project-back.onrender.com/";
    //this._wss = "ws://localhost:8081/"; // uncomment if using local server with NODE_ENV=development
    this._socket = null;
    this._isSpectator = true;
    this._fromSocket = false;
    this._gamestate = [];
    this._store = store;
    this._pingInterval = 30 * 1000; // 30 seconds between pings
    this._pingTimer = null;
    this._reconnectTimer = null;
    this._players = {}; // map of players connected to a session
    this._pings = {}; // map of player IDs to ping
    // reconnect to previous session
    if (this._store.state.session.sessionId) {
      this.connect(this._store.state.session.sessionId);
    }
  }

  /**
   * Open a new session for the passed channel.
   * @param channel
   * @private
   */
  _open(channel) {
    this.disconnect();
    this._socket = new WebSocket(
      this._wss +
        channel +
        "/" +
        (this._isSpectator ? this._store.state.session.playerId : "host")
    );
    this._socket.addEventListener("message", this._handleMessage.bind(this));
    this._socket.onopen = this._onOpen.bind(this);
    this._socket.onclose = err => {
      this._socket = null;
      clearInterval(this._pingTimer);
      this._pingTimer = null;
      if (err.code !== 1000) {
        // connection interrupted, reconnect after 3 seconds
        this._store.commit("session/setReconnecting", true);
        this._reconnectTimer = setTimeout(
          () => this.connect(channel),
          3 * 1000
        );
      } else {
        this._store.commit("session/setSessionId", "");
        if (err.reason) alert(err.reason);
      }
    };
  }

  /**
   * Send a message through the socket.
   * @param command
   * @param params
   * @private
   */
  _send(command, params) {
    if (this._socket && this._socket.readyState === 1) {
      this._socket.send(JSON.stringify([command, params]));
    }
  }

  /**
   * Send a message directly to a single playerId, if provided.
   * Otherwise broadcast it.
   * @param playerId player ID or "host", optional
   * @param command
   * @param params
   * @private
   */
  _sendDirect(playerId, command, params) {
    if (playerId) {
      this._send("direct", { [playerId]: [command, params] });
    } else {
      this._send(command, params);
    }
  }

  /**
   * Open event handler for socket.
   * @private
   */
  _onOpen() {
    if (this._isSpectator) {
      this._sendDirect(
        "host",
        "getGamestate",
        this._store.state.session.playerId
      );
    } else {
      this.sendGamestate();
    }
    this._ping();
  }

  /**
   * Send a ping message with player ID and ST flag.
   * @private
   */
  _ping() {
    this._handlePing();
    this._send("ping", [
      this._isSpectator
        ? this._store.state.session.playerId
        : Object.keys(this._players).length,
      "latency"
    ]);
    clearTimeout(this._pingTimer);
    this._pingTimer = setTimeout(this._ping.bind(this), this._pingInterval);
  }

  /**
   * Handle an incoming socket message.
   * @param data
   * @private
   */
  _handleMessage({ data }) {
    let command, params;
    try {
      [command, params] = JSON.parse(data);
    } catch (err) {
      console.log("unsupported socket message", data);
    }
    this._fromSocket = true;
    try {
    switch (command) {
      case "getGamestate":
        this.sendGamestate(params);
        break;
      case "edition":
        this._updateEdition(params);
        break;
      case "fabled":
        this._updateFabled(params);
        break;
      case "gs":
        this._updateGamestate(params);
        break;
      case "player":
        this._updatePlayer(params);
        break;
      case "claim":
        this._updateSeat(params);
        break;
      case "ping":
        this._handlePing(params);
        break;
      case "nomination":
        if (!params) {
          // create vote history record
          this._store.commit(
            "session/addHistory",
            this._store.state.players.players
          );
        }
        this._store.commit("session/nomination", { nomination: params });
        break;
      case "swap":
        if (!this._isSpectator) return;
        this._store.commit("players/swap", params);
        break;
      case "move":
        if (!this._isSpectator) return;
        this._store.commit("players/move", params);
        break;
      case "remove":
        if (!this._isSpectator) return;
        this._store.commit("players/remove", params);
        break;
      case "marked":
        this._store.commit("session/setMarkedPlayer", params);
        break;
      case "isNight":
        if (!this._isSpectator) return;
        this._store.commit("toggleNight", params);
        break;
      case "isVoteHistoryAllowed":
        if (!this._isSpectator) return;
        this._store.commit("session/setVoteHistoryAllowed", params);
        if (!this._store.state.session.isStoryteller) {
          this._store.commit("session/clearVoteHistory");
        }
        break;
      case "storytellerSetVoteHistoryAllowed":
        if (this._isSpectator) return;
        this._handleStorytellerSetVoteHistoryAllowed(params);
        break;
      case "votingSpeed":
        this._store.commit("session/setVotingSpeed", params);
        break;
      case "clearVoteHistory":
        if (!this._isSpectator) return;
        this._store.commit("session/clearVoteHistory");
        break;
      case "isVoteInProgress":
        this._store.commit("session/setVoteInProgress", params);
        break;
      case "vote":
        this._handleVote(params);
        break;
      case "lock":
        this._handleLock(params);
        break;
      case "bye":
        this._handleBye(params);
        break;
      case "pronouns":
        this._updatePlayerPronouns(params);
        break;
      case "timer":
        if (!this._isSpectator) return;
        this._store.commit("session/timerSync", params);
        break;
      case "timerPause":
        if (!this._isSpectator) return;
        this._store.commit("session/timerPauseSync", params);
        break;
      case "inviteChat":
        if (this._isSpectator) return;
        this._store.commit("session/inviteChat", params);
        break;
      case "ConfirmChat":
          this.ConfirmChat(params);
        break;
      case "SendGrim":
        this._store.commit("session/sendGrim", params);
        break;
      case "SendCard":
          this._store.commit("session/sendCard", params);
        break;
      case "winningTeam":
        if (!this._isSpectator) return;
        this._store.commit("session/winningTeam", params);
        break;
      case "StorytellerCode":
        if (!this._isSpectator) return;
        this._store.commit("session/StorytellerCode", params);
        break;
      case "StorytellerCodeGrim":
        this._store.commit("session/StorytellerCodeGrim", params);
        break;
      case "StorytellerCodeInvalid":
        if (!this._isSpectator) return;
        alert(params || "Wrong code!");
        break;
      case "setStoryteller":
        if (!this._isSpectator) return;
        this._store.commit("session/setStoryteller", !!params);
        break;
      case "setCoStorytellers":
        if (!this._isSpectator) return;
        this._store.commit("session/setCoStorytellers", params || []);
        break;
      case "storytellerPlayerUpdate":
        this._handleStorytellerPlayerUpdate(params);
        break;
      case "storytellerBluffUpdate":
        this._handleStorytellerBluffUpdate(params);
        break;
      case "storytellerTimer":
        if (this._isSpectator) return;
        this._store.commit("session/timer", params);
        break;
      case "storytellerTimerPause":
        if (this._isSpectator) return;
        this._store.commit("session/timerPause", params);
        break;
      case "storytellerSetIsNight":
        if (this._isSpectator) return;
        this._handleStorytellerSetIsNight(params);
        break;
      case "storytellerDistributeRoles":
        if (this._isSpectator) return;
        this._handleStorytellerDistributeRoles(params);
        break;
      case "SetSpectator":
        this._store.commit("session/SetSpectator", params);
        break;
      case "setHiddenVote":
        this._store.commit("session/setHiddenVote", params);
        break;
      case "setHandRaised": {
        if (this._isSpectator) return;
        const { session } = this._store.state;
        if (session.nomination) return;
        const player = this._store.state.players.players[params[0]]; 
        if (player) {
          this._store.commit("players/update", {
            player,      
            property: "handRaised",
            value: params[1]
          });
        }
        break;
      }
      case "wraithPeek":
        this._store.commit("session/wraithPeek", params);
      break;
      case "wraithLook":
        this._store.commit("session/wraithLook", params);
        break;
      case "setLilMonstaVote":
        this._store.commit("session/setLilMonstaVote", params);
        break;
      case "setDiscordChats":
        this._store.commit("session/setDiscordChats", params);
        break;
      case "BotConnected": {
        const { session } = this._store.state;
        const { botId, members, hostDiscordId, hostDiscordName } = params;

        // Only accept if no bot yet or same bot
        if (session.botId && session.botId !== botId) return;

        if (Array.isArray(members)) {
          members.forEach(member => {
            const [nickname, discordId, isST] = member;

            // Skip ST
            if (isST) return;

            // Find existing player
            let player = this._store.state.players.players.find(
              p => p.name === nickname
            );

            // If not found, add the player
            if (!player) {
              this._store.commit("players/add", nickname);
              player = this._store.state.players.players.find(
                p => p.name === nickname
              );
            }

            // Update discordID
            if (player) {
              this._store.commit("players/update", {
                player,
                property: "discordID",
                value: discordId
              });
            }
          });
        }

        // Store botId + ST IDs in session
        this._store.commit("session/setBotId", {
          botId,
          hostDiscordId,
          hostDiscordName,
          members
        });

        break;
      }
      case  "MoveToChat":
        this.MoveToChat(params);
        break;
      case "ConfirmMoveChat":
        this._store.commit("session/ConfirmMoveChat", params);
        break;
      case "setLockRoom":
        this._store.commit("session/setLockRoom", params);
        break;
      case "setLockRooms":
        this._store.commit("session/setLockRooms", params);
        break;
    }
    } finally {
      this._fromSocket = false;
    }
  }

  /**
   * Connect to a new live session, either as host or spectator.
   * Set a unique playerId if there isn't one yet.
   * @param channel
   */
  connect(channel) {
    if (!this._store.state.session.playerId) {
      this._store.commit(
        "session/setPlayerId",
        Math.random()
          .toString(36)
          .substr(2)
      );
    }
    this._pings = {};
    this._store.commit("session/setPlayerCount", 0);
    this._store.commit("session/setPing", 0);
    this._isSpectator = this._store.state.session.isSpectator;
    this._open(channel);
  }

  /**
   * Close the current session, if any.
   */
  disconnect() {
    this._pings = {};
    this._store.commit("session/setPlayerCount", 0);
    this._store.commit("session/setPing", 0);
    this._store.commit("session/setReconnecting", false);
    clearTimeout(this._reconnectTimer);
    if (this._socket) {
      if (this._isSpectator) {
        this._sendDirect("host", "bye", this._store.state.session.playerId);
      }
      this._socket.close(1000);
      this._socket = null;
    }
  }

  /**
   * Publish the current gamestate.
   * Optional param to reduce traffic. (send only player data)
   * @param playerId
   * @param isLightweight
   */
  sendGamestate(playerId = "", isLightweight = false) {
    if (this._isSpectator) return;
    this._gamestate = this._store.state.players.players.map(player => ({
      name: player.name,
      id: player.id,
      isDead: player.isDead,
      isVoteless: player.isVoteless,
      pronouns: player.pronouns,
      discordID: player.discordID,
      visibleHat: player.visibleHat || "",
      hasBansheeAbility: !!player.hasBansheeAbility,
      voteMultiplier: Number(player.voteMultiplier) || 1,
      ...(player.role && player.role.team === "traveler"
        ? { roleId: player.role.id }
        : {})
    }));
    if (isLightweight) {
      this._sendDirect(playerId, "gs", {
        gamestate: this._gamestate,
        isLightweight
      });
    } else {
      const { session, grimoire } = this._store.state;
      const { fabled } = this._store.state.players;
      this.sendEdition(playerId);
      this.timer(session.timer);
      this._sendDirect(playerId, "gs", {
        gamestate: this._gamestate,
        isNight: grimoire.isNight,
        isVoteHistoryAllowed: session.isVoteHistoryAllowed,
        nomination: session.nomination,
        votingSpeed: session.votingSpeed,
        lockedVote: session.lockedVote,
        isVoteInProgress: session.isVoteInProgress,
        markedPlayer: session.markedPlayer,
        botId: session.botId,
        hostDiscordId: session.hostDiscordId,
        hostDiscordName: session.hostDiscordName,
        discordST: session.discordST,
        coStorytellers: session.coStorytellers,
        coStDiscordLinks: session.coStDiscordLinks,
        availableDiscordSTs: session.availableDiscordSTs,
        discordChats: session.discordChats,
        lockedRooms: session.lockedRooms,
        fabled: fabled.map(f => (f.isCustom ? f : { id: f.id })),
        ...(session.nomination ? { votes: session.votes } : {})
      });
    }
  }

  /**
   * Update the gamestate based on incoming data.
   * @param data
   * @private
   */
  _updateGamestate(data) {
    if (!this._isSpectator) return;
    const {
      gamestate,
      isLightweight,
      isNight,
      isVoteHistoryAllowed,
      nomination,
      votingSpeed,
      votes,
      lockedVote,
      isVoteInProgress,
      markedPlayer,
      botId,
      hostDiscordId,
      hostDiscordName,
      discordST,
      coStorytellers,
      coStDiscordLinks,
      availableDiscordSTs,
      fabled,
      discordChats,
      lockedRooms
    } = data;
    const players = this._store.state.players.players;
    // adjust number of players
    if (players.length < gamestate.length) {
      for (let x = players.length; x < gamestate.length; x++) {
        this._store.commit("players/add", gamestate[x].name);
      }
    } else if (players.length > gamestate.length) {
      for (let x = players.length; x > gamestate.length; x--) {
        this._store.commit("players/remove", x - 1);
      }
    }
    // update status for each player
    gamestate.forEach((state, x) => {
      const player = players[x];
      const { roleId } = state;
      // update relevant properties
      ["name", "id", "isDead", "isVoteless", "pronouns", "discordID", "visibleHat", "hasBansheeAbility", "voteMultiplier"].forEach(property => {
        const value = state[property];
        if (player[property] !== value) {
          this._store.commit("players/update", { player, property, value });
        }
      });
      // roles are special, because of travelers
      if (roleId && player.role.id !== roleId) {
        const role =
          this._store.state.roles.get(roleId) ||
          this._store.getters.rolesJSONbyId.get(roleId);
        if (role) {
          this._store.commit("players/update", {
            player,
            property: "role",
            value: role
          });
        }
      } else if (!roleId && player.role.team === "traveler") {
        this._store.commit("players/update", {
          player,
          property: "role",
          value: {}
        });
      }
    });
    if (!isLightweight) {
      this._store.commit("toggleNight", !!isNight);
      this._store.commit("session/setVoteHistoryAllowed", isVoteHistoryAllowed);
      this._store.commit("session/nomination", {
        nomination,
        votes,
        votingSpeed,
        lockedVote,
        isVoteInProgress
      });
      this._store.commit("session/setMarkedPlayer", markedPlayer);
      this._store.commit("session/setHostDiscordId", hostDiscordId || "");
      this._store.commit("session/setHostDiscordName", hostDiscordName || "");
      this._store.commit("session/setCoStorytellers", coStorytellers || []);
      this._store.commit("session/setAvailableDiscordSTs", availableDiscordSTs || []);
      this._store.commit("session/setCoStDiscordLinks", coStDiscordLinks || {});
      if(botId){
        const stMembers = [];
        const seenDiscordIds = new Set();
        if (hostDiscordId) {
          stMembers.push([hostDiscordName || "Host ST", hostDiscordId, true]);
          seenDiscordIds.add(hostDiscordId);
        }
        (availableDiscordSTs || []).forEach(st => {
          if (!st?.discordId || seenDiscordIds.has(st.discordId)) return;
          stMembers.push([st.displayName || "ST", st.discordId, true]);
          seenDiscordIds.add(st.discordId);
        });
        (discordST || []).forEach(discordId => {
          if (!discordId || seenDiscordIds.has(discordId)) return;
          stMembers.push(["ST", discordId, true]);
          seenDiscordIds.add(discordId);
        });
        this._store.commit("session/setBotId", {
          botId,
          hostDiscordId,
          hostDiscordName,
          members: stMembers
        });
        this._store.commit("session/setLockRooms", lockedRooms);
        this._store.commit("session/setDiscordChats", discordChats);
      }
      this._store.commit("players/setFabled", {
        fabled: fabled.map(f => {
          const base = this._store.state.fabled.get(f.id) || {};
          return f.isCustom || (f.ability && f.ability !== base.ability)
            ? { ...base, ...f }
            : base || f;
        })
      });
    }
  }

  /**
   * Publish an edition update. ST only
   * @param playerId
   */
  sendEdition(playerId = "") {
    if (this._isSpectator) return;
    const { edition } = this._store.state;
    let roles;
    if (!edition.isOfficial) {
      roles = this._store.getters.customRolesStripped;
    }
    this._sendDirect(playerId, "edition", {
      edition: edition.isOfficial ? { id: edition.id } : edition,
      ...(roles ? { roles } : {})
    });
  }

  /**
   * Update edition and roles for custom editions.
   * @param edition
   * @param roles
   * @private
   */
  _updateEdition({ edition, roles }) {
    if (!this._isSpectator) return;
    this._store.commit("setEdition", edition);
    if (roles) {
      this._store.commit("setCustomRoles", roles);
      if (this._store.state.roles.size !== roles.length) {
        const missing = [];
        roles.forEach(({ id }) => {
          if (!this._store.state.roles.get(id)) {
            missing.push(id);
          }
        });
        alert(
          `This session contains custom characters that can't be found. ` +
            `Please load them before joining! ` +
            `Missing roles: ${missing.join(", ")}`
        );
        this.disconnect();
        this._store.commit("toggleModal", "edition");
      }
    }
  }

  /**
   * Publish a fabled update. ST only
   */
  sendFabled() {
    if (this._isSpectator) return;
    const { fabled } = this._store.state.players;
    this._send(
      "fabled",
      fabled.map(f => (f.isCustom ? f : { id: f.id }))
    );
  }

  /**
   * Update fabled roles.
   * @param fabled
   * @private
   */
  _updateFabled(fabled) {
    if (!this._isSpectator) return;
    this._store.commit("players/setFabled", {
      fabled: fabled.map(f => {
        const base = this._store.state.fabled.get(f.id) || {};
        return f.isCustom || (f.ability && f.ability !== base.ability)
          ? { ...base, ...f }
          : base || f;
      })
    });
  }

  _serializeStorytellerPlayerValue(property, value) {
    if (property === "role") {
      return value && value.id ? value.id : "";
    }
    return value;
  }

  _deserializeStorytellerPlayerValue(property, value) {
    if (property === "role") {
      if (!value) return {};
      return (
        this._store.state.roles.get(value) ||
        this._store.getters.rolesJSONbyId.get(value) ||
        {}
      );
    }
    return value;
  }

  _broadcastCoStorytellerList() {
    if (this._isSpectator) return;
    const ids = this._store.state.session.coStorytellers || [];
    ids.forEach(id => this._sendDirect(id, "setCoStorytellers", ids));
  }

  _broadcastStorytellerPlayerUpdate(update, excludedId = "") {
    if (this._isSpectator) return;
    const ids = this._store.state.session.coStorytellers || [];
    ids.forEach(id => {
      if (excludedId && id === excludedId) return;
      this._sendDirect(id, "storytellerPlayerUpdate", update);
    });
  }

  _broadcastStorytellerBluffUpdate(update, excludedId = "") {
    if (this._isSpectator) return;
    const ids = this._store.state.session.coStorytellers || [];
    ids.forEach(id => {
      if (excludedId && id === excludedId) return;
      this._sendDirect(id, "storytellerBluffUpdate", update);
    });
  }

  _handleStorytellerSetIsNight({ isNight } = {}) {
    if (typeof isNight !== "boolean") return;
    if (this._store.state.grimoire.isNight !== isNight) {
      this._store.commit("toggleNight", isNight);
      if (isNight) {
        this._store.commit("session/setMarkedPlayer", -1);
      }
    }
  }

  _handleStorytellerSetVoteHistoryAllowed({ isVoteHistoryAllowed } = {}) {
    if (typeof isVoteHistoryAllowed !== "boolean") return;
    this._store.commit("session/setVoteHistoryAllowed", isVoteHistoryAllowed);
    // This handler runs during socket message processing (_fromSocket=true),
    // so the usual Vuex subscription rebroadcast is skipped.
    this._send("isVoteHistoryAllowed", isVoteHistoryAllowed);
  }

  _handleStorytellerDistributeRoles() {
    this.distributeRoles();
  }

  _handleStorytellerPlayerUpdate({ index, property, value, from } = {}) {
    const allowed = [
      "role",
      "reminders",
      "alignmentIndex",
      "visibleHat",
      "hasBansheeAbility",
      "voteMultiplier",
      "isDead",
      "isVoteless",
      "isMarked"
    ];
    if (!allowed.includes(property)) return;
    const player = this._store.state.players.players[index];
    if (!player) return;

    if (this._isSpectator && !this._store.state.session.isStoryteller) return;
    const resolvedValue = this._deserializeStorytellerPlayerValue(property, value);
    this._store.commit("players/update", {
      player,
      property,
      value: resolvedValue,
      isFromStorytellerSync: true
    });

    // Host forwards co-ST changes to the other co-ST clients.
    if (!this._isSpectator) {
      this._broadcastStorytellerPlayerUpdate({ index, property, value }, from || "");
    }
  }

  _handleStorytellerBluffUpdate({ index, roleId, from } = {}) {
    if (!Number.isInteger(index)) return;
    if (this._isSpectator && !this._store.state.session.isStoryteller) return;

    const role = roleId
      ? this._store.state.roles.get(roleId) ||
        this._store.getters.rolesJSONbyId.get(roleId) ||
        {}
      : {};

    this._store.commit("players/setBluff", {
      index,
      role,
      isFromStorytellerSync: true
    });

    if (!this._isSpectator) {
      this._broadcastStorytellerBluffUpdate({ index, roleId }, from || "");
    }
  }

  sendBluff({ index, role, isFromStorytellerSync } = {}) {
    if (isFromStorytellerSync || !Number.isInteger(index)) return;
    const roleId = role && role.id ? role.id : "";

    if (this._isSpectator) {
      if (!this._store.state.session.isStoryteller) return;
      this._sendDirect("host", "storytellerBluffUpdate", {
        from: this._store.state.session.playerId,
        index,
        roleId
      });
      return;
    }

    this._broadcastStorytellerBluffUpdate({ index, roleId });
  }

  /**
   * Publish a player update.
   * @param player
   * @param property
   * @param value
   */
  sendPlayer({ player, property, value, isFromStorytellerSync, isFromSocketPlayerSync }) {
    // Prevent spectator echo loops for inbound storyteller-sync updates.
    // Host still needs to forward these updates to players.
    if (isFromStorytellerSync && this._isSpectator) return;
    // Prevent spectator echo loops for host-originated "player" socket updates.
    if (isFromSocketPlayerSync && this._isSpectator) return;
    const storytellerSyncProps = [
      "role",
      "reminders",
      "alignmentIndex",
      "visibleHat",
      "hasBansheeAbility",
      "voteMultiplier",
      "isDead",
      "isVoteless",
      "isMarked"
    ];
    const index = this._store.state.players.players.indexOf(player);
    if (index < 0) return;

    if (this._isSpectator) {
      if (!this._store.state.session.isStoryteller) return;
      if (!storytellerSyncProps.includes(property)) return;
      this._sendDirect("host", "storytellerPlayerUpdate", {
        from: this._store.state.session.playerId,
        index,
        property,
        value: this._serializeStorytellerPlayerValue(property, value)
      });
      return;
    }

    if (storytellerSyncProps.includes(property) && !isFromStorytellerSync) {
      this._broadcastStorytellerPlayerUpdate({
        index,
        property,
        value: this._serializeStorytellerPlayerValue(property, value)
      });
    }

    if (property === "reminders" || property === "alignmentIndex") return;
    if (property === "role") {
      if (value.team && value.team === "traveler") {
        // update local gamestate to remember this player as a traveler
        this._gamestate[index].roleId = value.id;
        this._send("player", {
          index,
          property,
          value: value.id
        });
      } else if (this._gamestate[index].roleId) {
        // player was previously a traveler
        delete this._gamestate[index].roleId;
        this._send("player", { index, property, value: "" });
      }
    } else {
      this._send("player", { index, property, value });
    }

  }

  /**
   * Update a player based on incoming data. Player only.
   * @param index
   * @param property
   * @param value
   * @private
   */
  _updatePlayer({ index, property, value }) {
    if (!this._isSpectator) return;
    const player = this._store.state.players.players[index];
    if (!player) return;
    // special case where a player stops being a traveler
    if (property === "role") {
      if(player.role.team !== "traveler")
        this._store.dispatch("players/clearRoles");
      if (!value && player.role.team === "traveler") {
        // reset to an unknown role
        this._store.commit("players/update", {
          player,
          property: "role",
          value: {},
          isFromSocketPlayerSync: true
        });
      } else {
        // load role, first from session, the global, then fail gracefully
        const role =
          this._store.state.roles.get(value) ||
          this._store.getters.rolesJSONbyId.get(value) ||
          {};
        this._store.commit("players/update", {
          player,
          property: "role",
          value: role,
          isFromSocketPlayerSync: true
        });
      }
    } else {
      // just update the player otherwise
      this._store.commit("players/update", {
        player,
        property,
        value,
        isFromSocketPlayerSync: true
      });
    }
  }

  /**
   * Publish a player pronouns update
   * @param player
   * @param value
   * @param isFromSockets
   */
  sendPlayerPronouns({ player, value, isFromSockets }) {
    //send pronoun only for the seated player or storyteller
    //Do not re-send pronoun data for an update that was recieved from the sockets layer
    if (
      isFromSockets ||
      (this._isSpectator && this._store.state.session.playerId !== player.id)
    )
      return;
    const index = this._store.state.players.players.indexOf(player);
    this._send("pronouns", [index, value]);
  }

  /**
   * Update a pronouns based on incoming data.
   * @param index
   * @param value
   * @private
   */
  _updatePlayerPronouns([index, value]) {
    const player = this._store.state.players.players[index];

    this._store.commit("players/update", {
      player,
      property: "pronouns",
      value,
      isFromSockets: true
    });
  }

  /**
   * Handle a ping message by another player / storyteller
   * @param playerIdOrCount
   * @param latency
   * @private
   */
  _handlePing([playerIdOrCount = 0, latency] = []) {
    const now = new Date().getTime();
    if (!this._isSpectator) {
      // remove players that haven't sent a ping in twice the timespan
      for (let player in this._players) {
        if (now - this._players[player] > this._pingInterval * 4) {
          delete this._players[player];
          delete this._pings[player];
        }
      }
      // remove claimed seats from players that are no longer connected
      this._store.state.players.players.forEach(player => {
        if (player.id && !this._players[player.id]) {
          this._store.commit("players/update", {
            player,
            property: "id",
            value: ""
          });
        }
      });
      // store new player data
      if (playerIdOrCount) {
        this._players[playerIdOrCount] = now;
        const ping = parseInt(latency, 10);
        if (ping && ping > 0 && ping < 30 * 1000) {
          // ping to Players
          this._pings[playerIdOrCount] = ping;
          const pings = Object.values(this._pings);
          this._store.commit(
            "session/setPing",
            Math.round(pings.reduce((a, b) => a + b, 0) / pings.length)
          );
        }
      }
    } else if (latency) {
      // ping to ST
      this._store.commit("session/setPing", parseInt(latency, 10));
    }
    // update player count
    if (!this._isSpectator || playerIdOrCount) {
      this._store.commit(
        "session/setPlayerCount",
        this._isSpectator ? playerIdOrCount : Object.keys(this._players).length
      );
    }
  }

  /**
   * Handle a player leaving the sessions. ST only
   * @param playerId
   * @private
   */
  _handleBye(playerId) {
    if (this._isSpectator) return;
    delete this._players[playerId];
    if (this._store.state.session.coStorytellers.includes(playerId)) {
      this._store.commit("session/removeCoStoryteller", playerId);
      this._broadcastCoStorytellerList();
    }
    this._store.commit(
      "session/setPlayerCount",
      Object.keys(this._players).length
    );
  }

  /**
   * Claim a seat, needs to be confirmed by the Storyteller.
   * Seats already occupied can't be claimed.
   * @param seat either -1 to vacate or the index of the seat claimed
   */
  claimSeat(seat) {
    if (!this._isSpectator) return;
    if (this._store.state.session.isStoryteller) return;
    localStorage.removeItem("invites");
    const players = this._store.state.players.players;
    if (players.length > seat && (seat < 0 || !players[seat].id)) {
      this._send("claim", [seat, this._store.state.session.playerId]);
    }
  }

  /**
   * Update a player id associated with that seat.
   * @param index seat index or -1
   * @param value playerId to add / remove
   * @private
   */
  _updateSeat([index, value]) {
    if (this._isSpectator) return;
    const property = "id";
    const players = this._store.state.players.players;
    // remove previous seat
    const oldIndex = players.findIndex(({ id }) => id === value);
    if (oldIndex >= 0 && oldIndex !== index) {
      this._store.commit("players/update", {
        player: players[oldIndex],
        property,
        value: ""
      });
    }
    // add playerId to new seat
    if (index >= 0) {
      const player = players[index];
      if (!player) return;
      this._store.commit("players/update", { player, property, value });
    }
    // update player session list as if this was a ping
    this._handlePing([true, value, 0]);
  }

  /**
   * Distribute player roles to all seated players in a direct message.
   * This will be split server side so that each player only receives their own (sub)message.
   */
  distributeRoles() {
    if (this._isSpectator) {
      if (!this._store.state.session.isStoryteller) return;
      this._sendDirect("host", "storytellerDistributeRoles", {
        from: this._store.state.session.playerId
      });
      return;
    }
    const message = {};
    this._store.state.players.players.forEach((player, index) => {
      if (player.id && player.role) {
        message[player.id] = [
          "player",
          { index, property: "role", value: player.role.id}
        ];
      }
    });
    if (Object.keys(message).length) {
      this._send("direct", message);
    }
  }

  /**
   * A player nomination. ST only
   * This also syncs the voting speed to the players.
   * Payload can be an object with {nomination} property or just the nomination itself, or undefined.
   * @param payload [nominator, nominee]|{nomination}
   */
  nomination(payload) {
    if (this._fromSocket) return;
    if (this._isSpectator && !this._store.state.session.isStoryteller) return;
    const nomination = payload ? payload.nomination || payload : payload;
    const players = this._store.state.players.players;
    if (
      !nomination ||
      (players.length > nomination[0] && players.length > nomination[1])
    ) {
      this.setVotingSpeed(this._store.state.session.votingSpeed);
      this._send("nomination", nomination);
    }
  }


  /**
   * Set the isVoteInProgress status. ST only
   */
  setVoteInProgress() {
    if (this._fromSocket) return;
    if (this._isSpectator && !this._store.state.session.isStoryteller) return;
    this._send("isVoteInProgress", this._store.state.session.isVoteInProgress);
  }

  /**
   * Send the isNight status. ST only
   */
  setIsNight() {
    if (this._fromSocket) return;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("messages_") && this._store.state.grimoire.isNight) {
        localStorage.removeItem(key);
        i--;
      }
    }
    if (this._isSpectator) {
      if (!this._store.state.session.isStoryteller) return;
      this._sendDirect("host", "storytellerSetIsNight", {
        from: this._store.state.session.playerId,
        isNight: !!this._store.state.grimoire.isNight
      });
      return;
    }
    this._send("isNight", this._store.state.grimoire.isNight);
  }

  /**
   * Send the isVoteHistoryAllowed state. ST only
   */
  setVoteHistoryAllowed() {
    if (this._fromSocket) return;
    if (this._isSpectator) {
      if (!this._store.state.session.isStoryteller) return;
      this._sendDirect("host", "storytellerSetVoteHistoryAllowed", {
        from: this._store.state.session.playerId,
        isVoteHistoryAllowed: !!this._store.state.session.isVoteHistoryAllowed
      });
      return;
    }
    this._send(
      "isVoteHistoryAllowed",
      this._store.state.session.isVoteHistoryAllowed
    );
  }

  /**
   * Send the voting speed. ST only
   * @param votingSpeed voting speed in seconds, minimum 1
   */
  setVotingSpeed(votingSpeed) {
    if (this._fromSocket) return;
    if (this._isSpectator && !this._store.state.session.isStoryteller) return;
    if (votingSpeed) {
      this._send("votingSpeed", votingSpeed);
    }
  }

  /**
   * Set which player is on the block. ST only
   * @param playerIndex, player id or -1 for empty
   */
  setMarked(playerIndex) {
    if (this._fromSocket) return;
    if (this._isSpectator && !this._store.state.session.isStoryteller) return;
    this._send("marked", playerIndex);
  }

  /**
   * Clear the vote history for everyone. ST only
   */
  clearVoteHistory() {
    if (this._isSpectator) return;
    this._send("clearVoteHistory");
  }

  /**
   * Send a vote. Player or ST
   * @param index Seat of the player
   * @param sync Flag whether to sync this vote with others or not
   */
  vote([index]) {
    const player = this._store.state.players.players[index];
    const isCoST = this._isSpectator && this._store.state.session.isStoryteller;
    if (
      this._store.state.session.playerId === player.id ||
      !this._isSpectator ||
      isCoST
    ) {
      // send vote only if it is your own vote or you are the storyteller (or co-ST)
      this._send("vote", [
        index,
        this._store.state.session.votes[index],
        !this._isSpectator || isCoST
      ]);
    }
  }

  /**
   * Handle an incoming vote, but only if it is from ST or unlocked.
   * @param index
   * @param vote
   * @param fromST
   */
  _handleVote([index, vote, fromST]) {
    const { session, players } = this._store.state;
    const playerCount = players.players.length;
    const indexAdjusted =
      (index - 1 + playerCount - session.nomination[1]) % playerCount;
    if (fromST || indexAdjusted >= session.lockedVote - 1) {
      this._store.commit("session/vote", [index, vote]);
    }
  }

  /**
   * Lock a vote. ST only
   */
  lockVote() {
    if (this._fromSocket) return;
    if (this._isSpectator && !this._store.state.session.isStoryteller) return;
    const { lockedVote, votes, nomination } = this._store.state.session;
    const { players } = this._store.state.players;
    const index = (nomination[1] + lockedVote - 1) % players.length;
    this._send("lock", [this._store.state.session.lockedVote, votes[index]]);
  }

  /**
   * Update vote lock and the locked vote, if it differs. Player only
   * @param lock
   * @param vote
   * @private
   */
  _handleLock([lock, vote]) {
    this._store.commit("session/lockVote", lock);
    if (lock > 1) {
      const { lockedVote, nomination } = this._store.state.session;
      const { players } = this._store.state.players;
      const index = (nomination[1] + lockedVote - 1) % players.length;
      if (this._store.state.session.votes[index] !== vote) {
        this._store.commit("session/vote", [index, vote]);
      }
    }
  }

  /**
   * Swap two player seats. ST only
   * @param payload
   */
  swapPlayer(payload) {
    if (this._isSpectator) return;
    this._send("swap", payload);
  }

  /**
   * Move a player to another seat. ST only
   * @param payload
   */
  movePlayer(payload) {
    if (this._isSpectator) return;
    this._send("move", payload);
  }

  /**
   * Remove a player. ST only
   * @param payload
   */
  removePlayer(payload) {
    if (this._isSpectator) return;
    this._send("remove", payload);
  }
  timer(payload){
    if (this._isSpectator) {
      if (!this._store.state.session.isStoryteller) return;
      this._sendDirect("host", "storytellerTimer", payload);
      return;
    }
    this._send("timer", payload);
  }
  timerPause(payload){
    if (this._isSpectator) {
      if (!this._store.state.session.isStoryteller) return;
      this._sendDirect("host", "storytellerTimerPause", payload);
      return;
    }
    this._send("timerPause", payload);
  }
  inviteChat(payload) {
  // Send invite to receiver
  if(payload.receiverId === "ST"){
    this._sendDirect("host", "ConfirmChat", payload);
  } else {
    this._sendDirect(payload.receiverId, "ConfirmChat", payload);
  }
}

ConfirmChat(params) {
  // store invite locally
  let invites = JSON.parse(localStorage.getItem("invites") || "[]");

  // Check if invite already exists
  if(!invites.some(invite => invite.senderId === params.senderId && invite.receiverId === params.receiverId)){
    invites.push(params);
    localStorage.setItem("invites", JSON.stringify(invites));
    window.dispatchEvent(new Event("storage"));

    // auto-expire invite after 15 seconds
    setTimeout(() => {
      let invitesNow = JSON.parse(localStorage.getItem("invites") || "[]");
      invitesNow = invitesNow.filter(i => !(i.senderId === params.senderId && i.receiverId === params.receiverId));
      localStorage.setItem("invites", JSON.stringify(invitesNow));
      window.dispatchEvent(new Event("storage"));
    }, 30000);
  }
}

  SendGrim(params) {
    if (params[1] == "all")
      this._send("SendGrim", params[0]);
    else
      this._sendDirect(params[1], "SendGrim", params[0]);
  }
  SendCard(params) {
    if(params[2]) return;
    const extendedParams = [...params, "Send"]; 
    this._sendDirect(params[0], "SendCard", extendedParams);
  }
  winningTeam(params){
    this._send("winningTeam", params);
  }
  StorytellerCode(params){
    this._send("StorytellerCode", params)
  }
  buildGamestateJson() {
    const { session } = this._store.state;
    const { fabled, players } = this._store.state.players;

    return {
      bluffs: session.bluffs || [],
      edition: { id: session.editionId || "luf" },
      roles: session.roles || "",
      fabled: fabled.map(f => (f.isCustom ? f : { id: f.id })),
      players: players.map(player => ({
        name: player.name,
        id: player.id || "",
        role: player.role ? player.role.id : {},
        reminders: player.reminders || [],
        isVoteless: !!player.isVoteless,
        isDead: !!player.isDead,
        pronouns: player.pronouns || "",
        team: "" // <- team always empty string like in your expected output
      }))
    };
  }
  wraithPeek(params) {
    this._sendDirect(params[0], "wraithPeek", params[1]);
  }
  wraithLook(params) {
    if (!this._isSpectator) {
      const fromId = params[0]; // Wraith
      const ofWhoId = params[1]; // Player being looked at
      const key = `messages_${ofWhoId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        let messages = [];
        try {
          messages = JSON.parse(stored);
        } catch (e) {
          console.error("Invalid messages format in localStorage:", stored);
        }
        const recent = messages.slice(-4);

        recent.forEach(msg => {
          let sender = String(ofWhoId);
          let content = msg;

          if (msg.startsWith("You:")) {
            sender = "Host";
            content = msg.replace(/^You:\s*/, "");
          } else {
            content = msg.replace(/^[^:]+:\s*/, "");
          }

          this._store.commit("session/sendCard", [
            fromId,              
            [content, sender]   
          ]);
        });
        
        this._store.commit("session/sendCard", [
          ofWhoId,              
          ["Looked at you", "Wraith"]   
        ]);
        messages.push("Wraith: Looked at You")
        localStorage.setItem(key, JSON.stringify(messages));
      } else {
        console.log(`No messages found for ${ofWhoId}`);
      }
      
    }

    // spectators still notify host
    this._sendDirect("host", "wraithLook", params);
  }


  StorytellerCodeGrim(params){
    if (this._isSpectator){
      this._sendDirect("host", "StorytellerCodeGrim", {
        playerId: this._store.state.session.playerId,
        code: params
      })
    } 
    else{
      if (!params) return;

      const session = this._store.state.session;
      const isObjectPayload = typeof params === "object" && params !== null;
      const targetPlayerId = isObjectPayload ? params.playerId : params;
      const inputCode = isObjectPayload ? (params.code || "") : "";
      if (!targetPlayerId) return;

      if (session.botId && (session.availableDiscordSTs || []).length) {
        const codeMap = session.coStInviteCodes || {};
        const matched = Object.keys(codeMap).find(
          discordId => codeMap[discordId] === String(inputCode || "")
        );
        if (!matched) {
          this._sendDirect(targetPlayerId, "StorytellerCodeInvalid", "Wrong Co-ST code!");
          return;
        }
        this._store.commit("session/linkCoStorytellerDiscord", {
          webPlayerId: targetPlayerId,
          discordId: matched
        });
      } else {
        if (String(inputCode || "") !== String(session.StorytellerCode || "")) {
          this._sendDirect(targetPlayerId, "StorytellerCodeInvalid", "Wrong code!");
          return;
        }
      }

      // Co-ST should never occupy a seat.
      this._store.state.players.players.forEach(player => {
        if (player.id === targetPlayerId) {
          this._store.commit("players/update", {
            player,
            property: "id",
            value: ""
          });
        }
      });

      this._store.commit("session/addCoStoryteller", targetPlayerId);
      this._sendDirect(targetPlayerId, "setStoryteller", true);
      this._sendDirect(targetPlayerId, "SendGrim", JSON.stringify(this.buildGamestateJson()));
      this.sendGamestate(targetPlayerId);
      this._broadcastCoStorytellerList();
    }

  }

  removeCoStoryteller(playerId) {
    if (this._isSpectator || !playerId) return;
    this._sendDirect(playerId, "setStoryteller", false);
    this._sendDirect(playerId, "setCoStorytellers", []);
    this._broadcastCoStorytellerList();
  }

  SetSpectator(params){
    this._sendDirect(params[0], "SetSpectator", params[1])
  }
  setHiddenVote(params){
    if (this._fromSocket) return;
    this._send("setHiddenVote", params);
  }
  setHandRaised(params){
    this._send("setHandRaised", params);
  }
  setLilMonstaVote(params) {
    this._store.state.players.players.forEach(p => {
        if (p.role?.team === "minion" && p.id) {
            this._sendDirect(p.id,"setLilMonstaVote", params);
        }
      });
  }
  setDiscordChats(params) {
    this._send("setDiscordChats", params);
  }
  setBotId(botId) {
    this._send("BotConnected", botId);
  }
MoveToChat(params) {
  const { session } = this._store.state;
  if (!session.botId) return;

  const incomingMoves = Array.isArray(params?.[0])
    ? params
    : Array.isArray(params)
      ? [params]
      : [];
  if (!incomingMoves.length) return;

  const isHost = !session.isSpectator;
  const isCoST = session.isSpectator && session.isStoryteller;
  let moves = [...incomingMoves];
  let requesterDiscordId = "";
  let requesterWebId = isHost ? "host" : session.playerId;

  if (isHost) {
    requesterDiscordId = session.hostDiscordId || (session.discordST || [])[0] || "";
  } else if (isCoST) {
    requesterDiscordId = (session.coStDiscordLinks || {})[session.playerId] || "";
    if (!requesterDiscordId) {
      alert("No Discord ST identity linked for this Co-ST yet. Ask HostST to reconnect bot/ST list or relink.");
      return;
    }
  }

  this._sendDirect(session.botId, "MoveToChat", {
    moves,
    requesterWebId,
    requesterDiscordId
  });
}
  ConfirmMoveChat(params){
    const { session } = this._store.state;
    if(session.botId){
      this._send("ConfirmMoveChat", params)
    }  
  }
  setLockRoom(params){
    const { session } = this._store.state;
    if(session.botId){
      this._send("setLockRoom", params)
    }  
  }
    setLockRooms(params){
    const { session } = this._store.state;
    if(session.botId){
      this._send("setLockRooms", params)
    }  
  }
}
export default store => {
  // setup
  const session = new LiveSession(store);

  // listen to mutations
  store.subscribe(({ type, payload }, state) => {
    switch (type) {
      case "session/setSessionId":
        if (state.session.sessionId) {
          session.connect(state.session.sessionId);
        } else {
          window.location.hash = "";
          session.disconnect();
        }
        break;
      case "session/claimSeat":
        session.claimSeat(payload);
        break;
      case "session/distributeRoles":
        if (payload) {
          session.distributeRoles();
        }
        break;
      case "session/nomination":
      case "session/setNomination":
        session.nomination(payload);
        break;
      case "session/setVoteInProgress":
        session.setVoteInProgress(payload);
        break;
      case "session/voteSync":
        session.vote(payload);
        break;
      case "session/lockVote":
        session.lockVote();
        break;
      case "session/setVotingSpeed":
        session.setVotingSpeed(payload);
        break;
      case "session/clearVoteHistory":
        session.clearVoteHistory();
        break;
      case "session/setVoteHistoryAllowed":
        session.setVoteHistoryAllowed();
        break;
      case "toggleNight":
        session.setIsNight();
        break;
      case "setEdition":
        session.sendEdition();
        break;
      case "players/setFabled":
        session.sendFabled();
        break;
      case "session/setMarkedPlayer":
        session.setMarked(payload);
        break;
      case "players/swap":
        session.swapPlayer(payload);
        break;
      case "players/move":
        session.movePlayer(payload);
        break;
      case "players/remove":
        session.removePlayer(payload);
        break;
      case "players/set":
      case "players/clear":
      case "players/add":
        session.sendGamestate("", true);
        break;
      case "players/setBluff":
        session.sendBluff(payload);
        break;
      case "players/update":
        if (payload.property === "pronouns") {
          session.sendPlayerPronouns(payload);
        } else {
          session.sendPlayer(payload);
        }
        break;
      case "session/timer":
        session.timer(payload);
        break;
      case "session/timerPause":
        session.timerPause(payload);
        break;
      case "session/inviteChat":
        session.inviteChat(payload);
        break;
      case "session/sendGrim":
        if (session._isSpectator) return;
        session.SendGrim(payload);
        break;
      case "session/sendCard":
        session.SendCard(payload);;
        break;
      case "session/winningTeam":
        if (session._isSpectator) return;
        session.winningTeam(payload);
        break;   
      case "session/StorytellerCode":
        if (session._isSpectator) return;
        session.StorytellerCode(payload);
        break;    
      case "session/StorytellerCodeGrim":
        session.StorytellerCodeGrim(payload);
        break;
      case "session/removeCoStoryteller":
        if (session._isSpectator) return;
        session.removeCoStoryteller(payload);
        break;    
      case "session/SetSpectator":
        session.SetSpectator(payload);
        break; 
      case "session/setHiddenVote":
        if (session._isSpectator && !state.session.isStoryteller) return;
        session.setHiddenVote(payload);
        break;     
      case "session/setHandRaised":
        session.setHandRaised(payload);
        break;    
      case "session/wraithPeek":
        session.wraithPeek(payload);
        break;
      case "session/wraithLook":
        session.wraithLook(payload);
        break;    
      case "session/setLilMonstaVote":
        if (session._isSpectator) return;
        session.setLilMonstaVote(payload);
        break;
      case "session/setDiscordChats":
        if (session._isSpectator) return;
        session.setDiscordChats(payload);
        break;
      case "session/setBotId":
        if (session._isSpectator) return;
        session.setBotId(payload);
        break;
      case "session/MoveToChat":
        session.MoveToChat(payload);
        break;
      case "session/ConfirmMoveChat":
        if (session._isSpectator) return;
        session.ConfirmMoveChat(payload);
        break;
      case "session/setLockRoom":
        if (session._isSpectator) return;
        session.setLockRoom(payload);
        break;
      case "session/setLockRooms":
        if (session._isSpectator) return;
        session.setLockRooms(payload);
        break;
    }
  });

  // check for session Id in hash
  const sessionId = window.location.hash.substr(1);
  if (sessionId) {
    store.commit("session/setSpectator", true);
    store.commit("session/setSessionId", sessionId);
    store.commit("toggleGrimoire", false);
  }
};
