<template>
  <Modal
    class="invitation-menu"
    v-if="modals.invitation"
    @close="toggleModal('invitation')"
  >
    <h3>Invitation Menu</h3>
    <div class="content">

      <table class="invitation-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in availablePlayers" :key="player.id">
            <td>{{ index + 1 }}</td>
            <td class="player-name">{{ player.name }}</td>
            <td class="actions">
              <template v-if="hasInviteFrom(player.id)">
                <button class="accept" @click="acceptInvite(player.id)">
                  <font-awesome-icon icon="check-circle" /> Accept
                </button>
                <button class="decline" @click="declineInvite(player.id)">
                  <font-awesome-icon icon="times-circle" /> Decline
                </button>
              </template>
              <template v-else>
                <button class="invite" @click="sendInvite(player)">
                  <font-awesome-icon icon="plus-circle" /> Invite
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapState, mapMutations } from "vuex";

export default {
  components: { Modal },

  data() {
    return {
      localInvites: JSON.parse(localStorage.getItem("invites") || "[]")
    };
  },

  computed: {
    ...mapState(["modals", "session", "players", "grimoire"]),
    availablePlayers() {
      let seated = this.players.players.filter(p => p.id && p.id !== this.session.playerId);
      if (this.session.isSpectator) seated.push({id: "ST", name: "ST"});
      if (this.grimoire.isNight && this.session.isSpectator) {
        seated = seated.filter(p => p.id === "ST");
      }
      return seated;
    }
  },

  mounted() {
    window.addEventListener("storage", this.updateLocalInvites);
  },
  beforeDestroy() {
    window.removeEventListener("storage", this.updateLocalInvites);
  },

  methods: {
    ...mapMutations(["toggleModal"]),
    getChatNumber(playerId) {
      const record = this.session.discordChats.find(c => c.playerId === playerId);
      return record ? record.chatNumber : 0;
    },
    updateLocalInvites() {
      this.localInvites = JSON.parse(localStorage.getItem("invites") || "[]");
    },

    hasInviteFrom(senderId) {
      return this.localInvites.some(inv => inv.senderId === senderId);
    },

    sendInvite(player) {
      const sender = this.session.isSpectator
        ? this.players.players.find(p => p.id === this.session.playerId)
        : {id: "ST", name: "ST"};

      const payload = {
        senderId: sender.id,
        senderName: sender.name,
        senderChat: this.getChatNumber(sender.id), 
        receiverId: player.id,
        receiverName: player.name,
        receiverChat: this.getChatNumber(player.id),
        timestamp: Date.now()
      };
      this.$store.commit("session/inviteChat", payload);
    },

    acceptInvite(senderId) {
      const invite = this.localInvites.find(i => i.senderId === senderId);
      if (!invite) return;

      let destination = invite.senderChat;

      // Special case: if senderChat is 21, move both
      if (destination == 21) {
        destination = this.findFreeChat();

        // Move sender
        this.$store.commit("session/MoveToChat", [[destination, invite.senderName, invite.senderId]]);
        if (this.session.botId) {
          this.$store.commit("session/MoveToChat", [[destination, invite.senderName, invite.senderId]]);
        }
      }

      // Move receiver
      this.$store.commit("session/MoveToChat", [[destination, invite.receiverName, invite.receiverId]]);
      if (this.session.botId) {
        this.$store.commit("session/MoveToChat", [[destination, invite.receiverName, invite.receiverId]]);
      }

      this.removeInvite(invite);
    },




    declineInvite(senderId) {
      const invite = this.localInvites.find(i => i.senderId === senderId);
      if (invite) this.removeInvite(invite);
    },

    removeInvite(invite) {
      this.localInvites = this.localInvites.filter(i => i.senderId !== invite.senderId);
      localStorage.setItem("invites", JSON.stringify(this.localInvites));
      window.dispatchEvent(new Event("storage"));
    },

    findFreeChat() {
      const chats = {};
      this.players.players.forEach((p, idx) => { if(p.id) chats[idx + 1] = false; });
      this.localInvites.forEach(i => { chats[i.receiverChat] = true; });
      for (const chat in chats) {
        if (!chats[chat]) return parseInt(chat);
      }
      return 1;
    }
  }
};
</script>

<style scoped>
.invitation-menu {
  position: fixed;
  top:0; left:0;
  width:100%; height:100%;
  padding:40px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background-color: rgba(0,0,0,0.85);
  color:white;
  font-weight:bold;
  text-align:center; z-index:999;
  overflow-y:auto;
}

h3 {
  font-size: 26px;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #ffdd57;
}

.invitation-table {
  width: 100%;
  max-width: 500px;
  border-collapse: collapse;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  overflow: hidden;
}

.invitation-table th, .invitation-table td {
  padding: 12px 10px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.invitation-table th {
  background: rgba(255,255,255,0.1);
  font-weight: 600;
  text-transform: uppercase;
}

.player-name {
  text-align: left;
  padding-left: 15px;
}

.actions button {
  margin: 2px;
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 600;
  display:flex;
  align-items:center;
  gap: 6px;
  cursor:pointer;
  transition: 0.2s;
  border:none;
}

.actions .invite { background-color:#3498db; color:white;}
.actions .invite:hover { background-color:#2980b9;}

.actions .accept { background-color:#2ecc71; color:white;}
.actions .accept:hover { background-color:#27ae60;}

.actions .decline { background-color:#e74c3c; color:white;}
.actions .decline:hover { background-color:#c0392b;}

.actions font-awesome-icon {
  font-size: 16px;
}

@media(max-width:600px){
  .invitation-table { font-size: 14px; }
  .actions button { font-size:12px; padding:5px 10px; }
}
</style>
