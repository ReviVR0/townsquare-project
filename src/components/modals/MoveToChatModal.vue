<template>
  <Modal
    class="moveChat-menu"
    v-if="modals.moveChat && session.botId"
    @close="toggleModal('moveChat')"
    @click.self="activePlayerMenu.clear()"
  >
    <h3>Move to Chat</h3>

    <div class="content">
      <div class="button-grid">
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
                  :class="{ 
                    'menu-open': activePlayerMenu.has(pid) && !isOwnMenu(pid) && !(grimoire.isNight && !session.isSpectator)
                  }"
                  @click.stop="openPlayerMenu(pid)"
                >
                  <span class="player-name">{{ resolveName(pid) }}</span>

                  <div v-if="activePlayerMenu.has(pid) && !isOwnMenu(pid)" class="player-menu">
                    <template v-if="hasInviteFrom(pid)">
                      <span @click.stop="acceptInvite(convertDiscordToPlayerId(pid))">
                        <font-awesome-icon icon="check-circle" /> Accept
                      </span>
                    </template>
                    <template v-else>
                      <span @click.stop="sendInviteTo(pid)" v-if="!(grimoire.isNight && !session.isSpectator)">
                        <font-awesome-icon icon="plus-circle" /> Invite
                      </span>
                    </template>
                  </div>

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
      <!-- Invite ST button for non-ST at night -->
      <div v-if="grimoire.isNight && session.isSpectator && !isSTPlayer" class="night-actions">
        <button @click="inviteST">
          Invite Storyteller
        </button>
      </div>

      <!-- HOST-ONLY NIGHT BUTTONS -->
      <div
        v-if="grimoire.isNight && !session.isSpectator"
        class="night-actions"
      >
        <button @click="sendAllToTownSquare">Start Day</button>
        <button @click="sendAllToTheirRooms">Start Night</button>
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
    activePlayerMenu: new Set(),
    localInvites: JSON.parse(localStorage.getItem("invites") || "[]"),
    inviteInterval: null,
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
      return this.grimoire.isNight && this.session.isSpectator;
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
        if (!this.session.isSpectator) {
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
      const me = this.players.find(p => p.id === this.session.playerId);
      if (!me?.discordID) return false;
      return this.session.discordST?.includes(me.discordID);
    }
  },

  methods: {
    ...mapMutations(["toggleModal"]),

    resolveName(discordID) {
      if (!discordID) return "?";
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
      const isST = !this.session.isSpectator;

      if (isLocked && !isST) {
        return; // silently block (recommended)
      }
      let payload = [];

      if (!this.session.isSpectator) {
        // ST: send all DiscordIDs of ST
        (this.session.discordST || []).forEach(discordID => {
          payload.push([to, discordID]);
        });
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
      if (this.moveLock) return;
      const moves = this.players
        .filter(p => p.discordID)
        .map(p => [21, p.discordID]);

      (this.session.discordST || []).forEach(discordID => moves.push([21, discordID]));

      this.$store.commit("session/MoveToChat", moves);
      
      this.moveLock = true;
      setTimeout(() => { this.moveLock = false }, 1500);
    },

    sendAllToTheirRooms() {
      if (this.moveLock) return;
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
    openPlayerMenu(discordID) {
      if (this.activePlayerMenu.has(discordID)) {
        this.activePlayerMenu.delete(discordID); // close menu
      } else {
        this.activePlayerMenu.add(discordID); // open menu
      }
      // force Vue reactivity
      this.activePlayerMenu = new Set(this.activePlayerMenu);
    },


    playerAction(discordID, buttonNumber) {
      const name = this.resolveName(discordID);
      console.log(`${name} + ${buttonNumber}`);
      this.activePlayerMenu = null;
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
        const discordID = this.session.discordST[0];
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
        return this.session.discordST?.[0] || null;
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
    cleanupExpiredInvites() {
      const now = Date.now();
      const validInvites = this.localInvites.filter(
        i => now - i.timestamp < 30000
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

      // Auto-open menu for the sender
      if (newInvite) {
        const senderDiscordID = this.playerIdToDiscordId(newInvite.senderId);
        if (senderDiscordID) {
          this.activePlayerMenu.add(senderDiscordID);
          this.activePlayerMenu = new Set(this.activePlayerMenu); // reactivity
        }
      }
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
      const receiverDiscordID = this.session.discordST?.[0];
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
            }, 10000);
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
  padding: 40px;
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
  font-size: 24px;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 600px;
  justify-items: center;
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

.user-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative; /* for absolute menu positioning */
}

.user-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative; /* for menu positioning */
}

.user-entry.menu-open > .player-name {
  margin-right: 40px; /* just the selected name moves */
}

.player-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-menu {
  position: absolute;
  top: 50%;
  left: 70%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
  z-index: 10;
}

.player-menu span {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  background: #444;
  border: 1px solid #888;
  color: #fff;
  border-radius: 3px;
  cursor: pointer;
  padding: 0;
}

.player-menu span:hover {
  background: #666;
  color: #ffd700;
  transform: scale(1.1);
}





</style>
