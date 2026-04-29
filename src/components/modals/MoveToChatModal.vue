<template>
  <Modal
    class="moveChat-menu"
    v-if="modals.moveChat && session.botId"
    @close="toggleModal('moveChat')"
    @click.self="inviteMode = false"
  >
    <h3>Move to Chat</h3>

    <div class="content">
      <div v-if="!hideNames && (!grimoire.isNight || canControlChat)" class="invite-toolbar">
        <button
          v-if="!grimoire.isNight"
          class="invite-mode-btn"
          :class="{ active: inviteMode }"
          @click="toggleInviteMode"
        >
          <font-awesome-icon :icon="inviteMode ? 'times-circle' : 'plus-circle'" />
          {{ inviteMode ? "Exit Invite Mode" : "Invite Mode" }}
          <span class="shortcut">[i]</span>
        </button>

        <button
          v-if="canControlChat"
          class="st-mode-btn"
          :class="{ active: MovePlayerMode }"
          @click="toggleMovePlayerMode"
        >
          <font-awesome-icon :icon="MovePlayerMode ? 'times-circle' : 'arrow-right'" />
          {{ MovePlayerMode ? "Exit Move Player" : "Move Player" }}
        </button>
      </div>

      <div v-if="MovePlayerMode && !selectedPlayerForMove" class="st-player-select">
        <h4>Select a player to move:</h4>
        <div class="player-list">
          <button
            v-for="player in players"
            :key="player.id"
            class="player-btn"
            @click="selectPlayerForMove(player)"
          >
            {{ player.name }}
          </button>
        </div>
      </div>

      <div v-if="MovePlayerMode && selectedPlayerForMove" class="st-channel-select">
        <h4>Move {{ selectedPlayerForMove.name }} to:</h4>
        <button class="back-btn" @click="selectedPlayerForMove = null">← Back</button>
        <div class="channel-grid">
          <button
            v-for="room in allRooms"
            :key="room.room"
            class="channel-btn"
            @click="movePlayerToChannel(selectedPlayerForMove, room.room)"
          >
            {{ getRoomLabel(room.room) }}
          </button>
        </div>
      </div>

      <div v-if="!MovePlayerMode" class="button-grid">
        <button
          v-for="room in allRooms"
          :key="room.room"
          @click="moveToChat(room.room)"
          :class="{ locked: grimoire.isNight ? false : isRoomLocked(room.room) }"
        >
          <div class="room-label">{{ getRoomLabel(room.room) }}</div>

          <div class="chat-users">
            <template v-if="!hideNames">
              <template v-if="playersInChats[room.room] && playersInChats[room.room].length">
                <div
                  v-for="pid in playersInChats[room.room]"
                  :key="pid"
                  class="user-entry"
                >
                  <span class="player-name">{{ resolveName(pid) }}</span>

                  <button
                    v-if="inviteMode && canInvite(pid)"
                    class="inline-invite-btn"
                    @click.stop="sendInviteTo(pid)"
                  >
                    Invite
                  </button>

                  <img
                    v-if="playerRoleIcon(pid)"
                    :src="playerRoleIcon(pid)"
                    class="role-icon"
                  />
                </div>
              </template>
              <div v-else class="empty">empty</div>
            </template>
            <template v-else>
              <div class="empty">hidden</div>
            </template>
          </div>
        </button>
      </div>

      <div class="invite-list" v-if="incomingInvites.length">
        <h4>Invitations For You</h4>
        <div class="invite-row" v-for="invite in incomingInvites" :key="`${invite.senderId}-${invite.timestamp}`">
          <span>{{ invite.senderName }} invites you from {{ getRoomLabel(invite.senderChat) }}</span>
          <div class="invite-actions">
            <button @click="acceptInvite(invite.senderId)">Accept</button>
            <button class="decline" @click="declineInvite(invite.senderId)">Decline</button>
          </div>
        </div>
      </div>

      <div v-if="grimoire.isNight && session.isSpectator && !isSTPlayer" class="night-actions">
        <button @click="inviteST">
          Invite Storyteller
        </button>
      </div>

      <div
        v-if="grimoire.isNight && canControlChat"
        class="night-actions"
      >
        <button @click="sendAllToTownSquare">Start Day</button>
        <button @click="sendAllToTheirRooms">Start Night</button>
      </div>
      <div
        v-if="!grimoire.isNight && canControlChat"
        class="night-actions"
      >
        <button @click="sendAllToTownSquare">Gather Town</button>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";
const inviteSound = new Audio(
  require("@/assets/sounds/invite.mp3")
);
inviteSound.volume = 0.6;
export default {
  components: { Modal },
  data() {
    return {
      moveLock: false,
      lockTimers: {}, // { roomNumber: timeoutId }
      inviteMode: false,
      roomNames: [
      { room: 1,  day: "Inn",              night: "Bedroom 1" },
      { room: 2,  day: "Church",           night: "Bedroom 2" },
      { room: 3,  day: "Market",           night: "Bedroom 3" },
      { room: 4,  day: "Graveyard",         night: "Bedroom 4" },
      { room: 5,  day: "Blacksmith",        night: "Bedroom 5" },
      { room: 6,  day: "Town Hall",         night: "Bedroom 6" },
      { room: 7,  day: "Watchtower",        night: "Bedroom 7" },
      { room: 8,  day: "Mill",              night: "Bedroom 8" },
      { room: 9,  day: "Schoolhouse",       night: "Bedroom 9" },
      { room: 10, day: "Apothecary",        night: "Bedroom 10" },

      { room: 11, day: "Library",           night: "Bedroom 11" },
      { room: 12, day: "Docks",             night: "Bedroom 12" },
      { room: 13, day: "Guard Post",        night: "Bedroom 13" },
      { room: 14, day: "Chapel",            night: "Bedroom 14" },
      { room: 15, day: "Tavern Backroom",   night: "Bedroom 15" },
      { room: 16, day: "Warehouse",         night: "Bedroom 16" },
      { room: 17, day: "Old Ruins",          night: "Bedroom 17" },
      { room: 18, day: "Garden",            night: "Bedroom 18" },
      { room: 19, day: "Hunter’s Lodge",    night: "Bedroom 19" },
      { room: 20, day: "Town Square Annex", night: "Bedroom 20" },
      { room: 21, day: "Town Square", night: "Town Square" },
      { room: 22, day: "Storyteller Den", night: "Storyteller Den" },
    ],
    localInvites: JSON.parse(localStorage.getItem("invites") || "[]"),
    inviteInterval: null,
    MovePlayerMode: false,
    selectedPlayerForMove: null,
    };
  },

  computed: {
    ...mapState(["modals", "session", "grimoire"]),
    ...mapState("players", ["players"]),
    ...mapState("session", ["discordChats"]),
    numberOfPlayers() {
      return this.players.length;
    },

    hideNames() {
      return (
        this.grimoire.isNight &&
        this.session.isSpectator &&
        !this.session.isStoryteller
      );
    },

    playersInChats() {
      const map = {};
      for (let i = 1; i <= this.numberOfPlayers; i++) map[i] = [];
      map[21] = [];
      map[22] = [];

      this.discordChats.forEach(entry => {
        if (entry.chatNumber in map) {
          map[entry.chatNumber].push(entry.discordID); // <-- use DiscordID
        }
      });

      return map;
    },
    isRoomLocked() {
      return (roomNumber) => {
      const count = (this.playersInChats[roomNumber] || []).filter(
        id => !this.session.discordST?.includes(id)
      ).length;
        if (roomNumber === 21) return false;
        // Auto-unlock when < 2 players
        if (count < 2) return false;

        // Otherwise rely on server lock state
        return this.session.lockedRooms?.[roomNumber] || false;
      };
    },
    allRooms() {
      const num = this.numberOfPlayers;

      // ALL regular rooms (1..N)
      const allRegularRooms = this.roomNames.filter(r => r.room <= num);

      // Day rooms (reduced)
      const dayRoomCount = Math.ceil(num / 2);
      const dayRegularRooms = allRegularRooms.slice(0, dayRoomCount);

      const special = [
        { room: 21, day: "Townsquare", night: "Townsquare" },
        { room: 22, day: "Storyteller Den", night: "Storyteller Den" }
      ];

      // ---- NIGHT LOGIC ----
      if (this.grimoire.isNight) {
        // ST sees EVERYTHING
        if (!this.session.isSpectator || this.session.isStoryteller) {
          return [...allRegularRooms, ...special];
        }

        // Player sees only their room + 21 + 22
        const currentRoom = Object.entries(this.playersInChats).find(([, ids]) =>
          ids.includes(
            this.players.find(p => p.id === this.session.playerId)?.discordID
          )
        )?.[0];

        return [
          ...special,
          ...allRegularRooms.filter(r => r.room == Number(currentRoom))
        ];
      }
      return [...dayRegularRooms, ...special];
    },


    isSTPlayer() {
      if (this.session.isStoryteller) return true;
      const me = this.players.find(p => p.id === this.session.playerId);
      if (!me?.discordID) return false;
      return this.session.discordST?.includes(me.discordID);
    },
    linkedCoStDiscordId() {
      return (this.session.coStDiscordLinks || {})[this.session.playerId] || "";
    },
    myInviteReceiverId() {
      return this.session.isSpectator ? this.session.playerId : "ST";
    },
    incomingInvites() {
      return this.localInvites.filter(inv => inv.receiverId === this.myInviteReceiverId);
    },
    canControlChat() {
      return !this.session.isSpectator || this.session.isStoryteller;
    }
  },

  methods: {
    ...mapMutations(["toggleModal"]),

    resolveName(discordID) {
      if (!discordID) return "?";
      if (discordID === this.session.hostDiscordId) {
        return this.session.hostDiscordName || "Host ST";
      }
      const coSt = (this.session.availableDiscordSTs || []).find(
        st => st.discordId === discordID
      );
      if (coSt) return coSt.displayName || "Co-ST";
      if (this.session.discordST?.includes(discordID)) return "ST";
      const player = this.players.find(p => p.discordID === discordID);
      return player ? player.name : "?";
    },



    playerRoleIcon(discordID) {
      if (this.session.discordST?.includes(discordID)) return null;

      const player = this.players.find(p => p.discordID === discordID);
      if (!player || !player.role || !player.role.id) return null;

      try {
        return require(`../../assets/icons/Reminder/${player.role.id}.png`);
      } catch (e) {
        console.warn(`Missing role image for ${player.role.id}`);
        return null;
      }
    },



    moveToChat(to) {
      if (this.hideNames || this.moveLock) return;

      const player = this.players.find(p => p.id === this.session.playerId);
      const playerDiscordID = player?.discordID;
      const currentRoom = Object.entries(this.playersInChats).find(([, ids]) =>
        ids.includes(playerDiscordID)
      )?.[0];

      if (currentRoom == to) return;


      const isLocked = this.isRoomLocked(to);
  const isST = !this.session.isSpectator || this.session.isStoryteller;

      if (isLocked && !isST) {
        return; // silently block (recommended)
      }
      let payload = [];

      if (!this.session.isSpectator) {
        // HostST: normal room moves should move only HostST's Discord account.
        const hostDiscordId = this.session.hostDiscordId || this.session.discordST?.[0];
        if (hostDiscordId) payload.push([to, hostDiscordId]);
      } else if (this.session.isStoryteller) {
        if (!this.linkedCoStDiscordId) {
          alert("No Discord ST account linked for this Co-ST yet.");
          return;
        }
        payload.push([to, this.linkedCoStDiscordId]);
      } else {
        // normal player: send only their DiscordID
        const player = this.players.find(p => p.id === this.session.playerId);
        if (player?.discordID) payload.push([to, player.discordID]);
      }

      this.$store.commit("session/MoveToChat", payload);
      this.moveLock = true;
      setTimeout(() => {
        this.moveLock = false;
      }, 500);
    },

    sendAllToTownSquare() {
      if (!this.canControlChat || this.moveLock) return;
      const moves = this.players
        .filter(p => p.discordID)
        .map(p => [21, p.discordID]);

      (this.session.discordST || []).forEach(discordID => moves.push([21, discordID]));

      this.$store.commit("session/MoveToChat", moves);
      
      this.moveLock = true;
      setTimeout(() => { this.moveLock = false }, 1500);
    },

    sendAllToTheirRooms() {
      if (!this.canControlChat || this.moveLock) return;
      const moves = this.players
        .filter(p => p.discordID)
        .map((p, idx) => [idx + 1, p.discordID]);

      (this.session.discordST || []).forEach(discordID => moves.push([22, discordID]));

      this.$store.commit("session/MoveToChat", moves);      
      this.moveLock = true;
      setTimeout(() => { this.moveLock = false }, 1500);
      
    },
    getRoomLabel(roomNumber) {
      const entry = this.roomNames.find(r => r.room === roomNumber) 
                    || { day: roomNumber, night: roomNumber };

      return this.grimoire.isNight ? entry.night || entry.day : entry.day;
    },
    toggleInviteMode() {
      this.inviteMode = !this.inviteMode;
    },

    toggleMovePlayerMode() {
      if (!this.canControlChat) return;
      this.MovePlayerMode = !this.MovePlayerMode;
      this.selectedPlayerForMove = null;
    },

    selectPlayerForMove(player) {
      this.selectedPlayerForMove = player;
    },

    movePlayerToChannel(player, channelNumber) {
      if (!this.canControlChat || !player.discordID) return;
      
      const payload = [[channelNumber, player.discordID]];
      this.$store.commit("session/MoveToChat", payload);
      
      this.selectedPlayerForMove = null;
      this.MovePlayerMode = false;
      
      this.moveLock = true;
      setTimeout(() => {
        this.moveLock = false;
      }, 500);
    },
    canInvite(discordID) {
      if (this.hideNames) return false;
      if (this.grimoire.isNight && !this.session.isSpectator) return false;
      if (this.isOwnMenu(discordID)) return false;
      return true;
    },

    isOwnMenu(discordID) {
      // Normal player: hide own menu
      if (this.session.playerId) {
        const me = this.players.find(p => p.id === this.session.playerId);
        if (me?.discordID === discordID) return true;
      }
      // ST: hide menu for ST if not spectator
      if (!this.session.isSpectator && this.session.discordST?.includes(discordID)) return true;

      return false;
    },

    getChatNumber(playerId) {
      if (playerId === "ST") {
        const discordID = this.session.hostDiscordId || this.session.discordST[0];
        const record = this.session.discordChats.find(c => c.discordID === discordID);
        return record ? record.chatNumber : 21; // default to Townsquare
      } else {
        const player = this.players.find(p => p.id === playerId);
        const discordID = player ? player.discordID : playerId;
        const record = this.session.discordChats.find(c => c.discordID === discordID);
        return record ? record.chatNumber : 21; // default to Townsquare
      }
    },
    convertDiscordToPlayerId(discordID) {
      if (this.session.discordST?.includes(discordID)) return "ST";
      const player = this.players.find(p => p.discordID === discordID);
      return player ? player.id : null;
    },
    playerIdToDiscordId(playerId) {
      if (playerId === "ST") {
        return this.session.hostDiscordId || this.session.discordST?.[0] || null;
      }

      const player = this.players.find(p => p.id === playerId);
      return player ? player.discordID : null;
    },
    sendInviteTo(receiverDiscordID) {
      const receiverId = this.convertDiscordToPlayerId(receiverDiscordID);
      if (!receiverId) return; // safety check

      // Determine sender (ST or normal player)
      const sender = this.session.isSpectator
        ? this.players.find(p => p.id === this.session.playerId)
        : { id: "ST", name: "ST" };

      const payload = {
        senderId: sender.id,                   // website ID
        senderName: sender.name,
        senderChat: this.getChatNumber(sender.id),
        receiverId: receiverId,                // website ID
        receiverName: receiverId === "ST" ? "ST" : this.players.find(p => p.id === receiverId)?.name,
        receiverChat: this.getChatNumber(receiverId),
        timestamp: Date.now()
      };
      this.$store.commit("session/inviteChat", payload);
      this.inviteMode = false;
    },



    hasInviteFrom(senderDiscordID) {
      const senderId = this.convertDiscordToPlayerId(senderDiscordID);
      if (!senderId) return false;

      return this.localInvites.some(inv => inv.senderId === senderId);
    },

    acceptInvite(senderId) {
      const invite = this.localInvites.find(i => i.senderId === senderId);
      if (!invite) return;

      let destination = invite.senderChat;

      // Special case: if sender is in 21, choose a free room
      if (destination === 21) {
        destination = this.findFreeChat();
        this.$store.commit("session/MoveToChat", [[destination, this.playerIdToDiscordId(senderId)]]);
      }

      // Move receiver
      const receiverDiscordID =
        invite.receiverId === "ST"
          ? this.session.discordST[0]
          : this.players.find(p => p.id === invite.receiverId)?.discordID;

      if (receiverDiscordID) {
        this.$store.commit("session/MoveToChat", [[destination, receiverDiscordID]]);
      }

      // Remove invite
      this.localInvites = this.localInvites.filter(i => i !== invite);
      localStorage.setItem("invites", JSON.stringify(this.localInvites));
    },
    declineInvite(senderId) {
      this.localInvites = this.localInvites.filter(i => i.senderId !== senderId);
      localStorage.setItem("invites", JSON.stringify(this.localInvites));
    },
    cleanupExpiredInvites() {
      const now = Date.now();
      const validInvites = this.localInvites.filter(
        i => now - i.timestamp < 15000
      );

      if (validInvites.length !== this.localInvites.length) {
        this.localInvites = validInvites;
        localStorage.setItem("invites", JSON.stringify(validInvites));
      }
    },
    playInviteSound() { /// TO DO not sure why it does not work
      if (this.grimoire.isMuted) return;

      inviteSound.currentTime = 0;
      inviteSound.play().catch(err => {
        console.warn("Invite sound failed to play:", err);
      });
    },
    updateLocalInvites() {
      const oldInvites = this.localInvites;
      const newInvites = JSON.parse(localStorage.getItem("invites") || "[]");

      const newInvite = newInvites.find(
        ni => !oldInvites.some(oi => oi.senderId === ni.senderId)
      );

      this.localInvites = newInvites;

      if (newInvite) {
        this.playInviteSound();
      }
    },
    findFreeChat() {
      for (let i = 1; i <= this.numberOfPlayers; i++) {
        const count = (this.playersInChats[i] || []).filter(
          id => !this.session.discordST?.includes(id)
        ).length;
        if (!this.isRoomLocked(i) && count < 2) return i;
      }
      // fallback: just return Townsquare if no free room
      return 21;
    },
    inviteST() {
      const receiverDiscordID = this.session.hostDiscordId || this.session.discordST?.[0];
      if (!receiverDiscordID) return;

      this.sendInviteTo(receiverDiscordID); // re-use existing invite logic
    }
  },
  mounted() {
    window.addEventListener("storage", this.updateLocalInvites);

    // periodic cleanup (timestamp-based)
    this.inviteInterval = setInterval(this.cleanupExpiredInvites, 1000);
  },

  beforeDestroy() {
    window.removeEventListener("storage", this.updateLocalInvites);
    clearInterval(this.inviteInterval);
  },
  watch: {
    playersInChats: {
      handler(newVal) {
        Object.keys(newVal).forEach((room) => {
          const roomNumber = Number(room);

          if (roomNumber === 21) return;

          const count = (newVal[roomNumber] || []).filter(
            id => !this.session.discordST?.includes(id)
          ).length;

          // 1. If < 2 players → unlock & clear timer
          
          if (count < 2) {
            if (this.session.lockedRooms?.[roomNumber]) {
              this.$store.commit("session/setLockRoom", [roomNumber, false]);
            }

            clearTimeout(this.lockTimers[roomNumber]);
            delete this.lockTimers[roomNumber];
            return;
          }

          // 2. If 2+ players → start lock timer only if not already running or locked
          const isLocked = this.session.lockedRooms?.[roomNumber] || false;

          if (!isLocked && !this.lockTimers[roomNumber]) {
            // Start 10 second lock countdown
            this.lockTimers[roomNumber] = setTimeout(() => {
              this.$store.commit("session/setLockRoom", [roomNumber, true]);
              delete this.lockTimers[roomNumber]; // cleanup
            }, 5000);
          }
        });
      },
      deep: true, // important — watches array changes inside playersInChats
      immediate: true,
    },
  }

};
</script>

<style scoped>
.moveChat-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-weight: bold;
  text-align: center;
  z-index: 999;
}

h3 {
  font-size: 20px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.button-grid {
  display: grid;
  gap: 4px;
  width: 100%;
  max-width: 600px;
  justify-items: center;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  max-height: 85vh;
  overflow-y: auto;
}

.invite-toolbar {
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.invite-mode-btn {
  min-height: 40px;
  width: auto;
  padding: 2px 6px;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.shortcut {
  margin-left: 4px;
  font-size: 0.85em;
  opacity: 0.8;
}

.invite-mode-btn.active {
  border-color: #ffd700;
  color: #ffd700;
}

button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  background-color: #222;
  color: #fff;
  border: 2px solid #fff;
  border-radius: 8px;
  min-height: 100px;
  width: 100%;
  transition: 0.2s;
}

button:hover {
  background-color: #fff;
  color: #222;
}
button.locked {
  opacity: 0.55;
  cursor: not-allowed;
  border: 2px solid #ff4444;
}

button.locked .room-label::after {
  content: " Locked";
}

.room-label {
  font-size: 18px;
  margin-bottom: 6px;
}

.chat-users {
  margin-top: 8px;
  font-size: 12px;
  text-align: center;
}

.user-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #bbb;
}

.inline-invite-btn {
  min-height: 24px;
  width: auto;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 6px;
  margin-left: 6px;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.role-icon {
  width: 16px;
  height: 16px;
}

.empty {
  color: #666;
  font-style: italic;
}

.night-actions {
  margin-top: 30px;
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.night-actions button {
  width: 180px;
  min-height: 50px;
}

.invite-list {
  width: 100%;
  max-width: 600px;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #555;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.invite-list h4 {
  margin: 0 0 10px;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.invite-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 10px;
}

.invite-row:last-child {
  margin-bottom: 0;
}

.invite-actions {
  display: inline-flex;
  gap: 4px;
}

.invite-actions button {
  min-height: 20px;
  width: auto;
  padding: 4px;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.invite-actions .decline {
  border-color: #ff7777;
}

.player-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.st-mode-btn {
  min-height: 40px;
  width: auto;
  padding: 2px 6px;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
}

.st-mode-btn.active {
  border-color: #ff69b4;
  color: #ff69b4;
}

.st-player-select,
.st-channel-select {
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #555;
  border-radius: 12px;
  padding: 20px;
  max-width: 600px;
  width: 100%;
}

.st-player-select h4,
.st-channel-select h4 {
  margin: 0 0 16px;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fff;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.player-btn {
  min-height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  border: 2px solid #fff;
  background-color: #222;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}

.player-btn:hover {
  background-color: #fff;
  color: #222;
  border-color: #ffd700;
}

.back-btn {
  margin-bottom: 12px;
  width: 100px;
  min-height: 32px;
  padding: 4px 12px;
  font-size: 12px;
}

.channel-grid {
  display: grid;
  gap: 4px;
}

.channel-btn {
  min-height: 80px;
  padding: 8px;
  font-size: 14px;
  border: 2px solid #fff;
  background-color: #222;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-btn:hover {
  background-color: #fff;
  color: #222;
  border-color: #ffd700;
}

@media (max-width: 768px) {
  .invite-toolbar {
    flex-direction: column;
    gap: 8px;
  }

  .st-mode-btn {
    margin-left: 0;
    width: 100%;
  }

  .st-player-select,
  .st-channel-select {
    padding: 16px;
  }

  .player-list {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}
.button-grid,
.channel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
  width: 100%;
}



</style>
