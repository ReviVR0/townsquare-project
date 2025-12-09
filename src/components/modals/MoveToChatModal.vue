<template>
  <Modal
    class="moveChat-menu"
    v-if="modals.moveChat"
    @close="toggleModal('moveChat')"
  >
    <h3>Move to Chat</h3>

    <div class="content">
      <div class="button-grid">

        <!-- REGULAR ROOMS -->
        <button
          v-for="n in numberOfPlayers"
          :key="n"
          @click="moveToChat(n)"
          :class="{ locked: isRoomLocked(n) }"
        >
          <div class="room-label">{{ n }}</div>

          <div class="chat-users">
            <template v-if="!hideNames">
              <template v-if="playersInChats[n].length">
                <div
                  v-for="pid in playersInChats[n]"
                  :key="pid"
                  class="user-entry"
                >
                  <img
                    v-if="playerRoleIcon(pid)"
                    :src="playerRoleIcon(pid)"
                    class="role-icon"
                  />
                  {{ resolveName(pid) }}
                </div>
              </template>
              <div v-else class="empty">empty</div>
            </template>
            <template v-else>
              <div class="empty">hidden</div>
            </template>
          </div>
        </button>

        <!-- TOWN SQUARE -->
        <button @click="moveToChat(21)"   :class="{ locked: isRoomLocked(21) }">
          <div class="room-label">Townsquare</div>
          <div class="chat-users">
            <template v-if="!hideNames">
              <template v-if="playersInChats[21].length">
                <div
                  v-for="pid in playersInChats[21]"
                  :key="pid"
                  class="user-entry"
                >
                  <img
                    v-if="playerRoleIcon(pid)"
                    :src="playerRoleIcon(pid)"
                    class="role-icon"
                  />
                  {{ resolveName(pid) }}
                </div>
              </template>
              <div v-else class="empty">empty</div>
            </template>
            <template v-else>
              <div class="empty">hidden</div>
            </template>
          </div>
        </button>

        <!-- STORYTELLER DEN -->
        <button @click="moveToChat(22)"   :class="{ locked: isRoomLocked(22) }">
          <div class="room-label">Storyteller Den</div>
          <div class="chat-users">
            <template v-if="!hideNames">
              <template v-if="playersInChats[22].length">
                <div
                  v-for="pid in playersInChats[22]"
                  :key="pid"
                  class="user-entry"
                >
                  <img
                    v-if="playerRoleIcon(pid)"
                    :src="playerRoleIcon(pid)"
                    class="role-icon"
                  />
                  {{ resolveName(pid) }}
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

export default {
  components: { Modal },
  data() {
    return {
      lockTimers: {} // { roomNumber: timeoutId }
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
        const count = this.playersInChats[roomNumber]?.length || 0;
        if (roomNumber === 21) return false;

        // Auto-unlock when < 2 players
        if (count < 2) return false;

        // Otherwise rely on server lock state
        return this.session.lockedRooms?.[roomNumber] || false;
      };
    },
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
      if (this.hideNames) return;
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
    },

    sendAllToTownSquare() {
      const moves = this.players
        .filter(p => p.discordID)
        .map(p => [21, p.discordID]);

      (this.session.discordST || []).forEach(discordID => moves.push([21, discordID]));

      this.$store.commit("session/MoveToChat", moves);
    },

    sendAllToTheirRooms() {
      const moves = this.players
        .filter(p => p.discordID)
        .map((p, idx) => [idx + 1, p.discordID]);

      (this.session.discordST || []).forEach(discordID => moves.push([22, discordID]));

      this.$store.commit("session/MoveToChat", moves);
    }

  },
  watch: {
    playersInChats: {
      handler(newVal) {
        Object.keys(newVal).forEach((room) => {
          const roomNumber = Number(room);

          if (roomNumber === 21) return;

          const count = newVal[roomNumber]?.length || 0;

          // 1. If < 2 players → unlock & clear timer
          if (count < 2) {
            clearTimeout(this.lockTimers[roomNumber]);
            delete this.lockTimers[roomNumber];

            this.$store.commit("session/setLockRoom", [roomNumber, false]);
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
</style>
