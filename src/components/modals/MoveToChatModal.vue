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
        <button @click="moveToChat(21)">
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
        <button @click="moveToChat(22)">
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
          map[entry.chatNumber].push(entry.playerId);
        }
      });

      return map;
    }
  },

  methods: {
    ...mapMutations(["toggleModal"]),

    resolveName(pid) {
      if (pid === "ST") return "ST";
      const player = this.players.find(p => p.id == pid);
      return player ? player.name : "?";
    },

    playerRoleIcon(pid) {
      if (pid === "ST") return null;

      const player = this.players.find(p => p.id == pid);
      if (!player || !player.role) return null;
      return require(`../../assets/icons/Reminder/${player.role.id}.png`);
    },

    moveToChat(to) {
      if (this.hideNames) return;

      const isST = !this.session.isSpectator;
      const playerId = isST ? 0 : this.session.playerId;
      const playerName = isST
        ? "ST"
        : this.players.find(p => p.id == this.session.playerId)?.name;

      const payload = [[to, playerName, playerId]];
      this.$store.commit("session/MoveToChat", payload);
    },


    sendAllToTownSquare() {
      const moves = this.players.map(p => [21, p.name, p.id]);
      moves.push([21, "ST"]);
      this.$store.commit("session/MoveToChat", moves);
    },

    sendAllToTheirRooms() {
      const moves = this.players.map((p, idx) => [idx + 1, p.name, p.id]);
      moves.push([22, "ST"]);
      this.$store.commit("session/MoveToChat", moves);
    }
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
