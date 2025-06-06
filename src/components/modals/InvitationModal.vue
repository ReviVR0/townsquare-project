<template>
  <Modal
    class="invitation-menu"
    v-if="modals.invitation"
    @close="toggleModal('invitation')"
  >
    <h3>Invitation Menu</h3>
    <div class="content">

    <div class="InvitationsList">
      <table>
        <thead>
        <tr>
          <th>#</th>
          <th>Player Name</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(player, index) in aviblePlayersList " :key="index">
          <td>{{ index + 1 }}</td>
          <td class="names" @click="inviteChat(player)">{{ player.name }}</td>
          <td class="Refuse" v-if="invitedByName.includes(player.name)"> <font-awesome-icon icon="plus-circle"/></td>
          <td class="Accept" v-if="invitedByName.includes(player.name)" @click="removeInviteBySender(player.name)" ><font-awesome-icon icon="times-circle"/></td>

        </tr>
        </tbody>
      </table>
    </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";

export default {
  components: {
    Modal,
  },
  computed: {
    ...mapState(["grimoire", "session", "edition"]),
    ...mapState(["modals"]),
    ...mapState("players", ["players"]),
    aviblePlayersList(){
      const list = this.players
          .filter(player => player.id !== this.session.playerId)
      if(this.players.length != list.length){
        list.push({ name: "ST", id: "ST"});
      }
      return list;
    },
    invitedByName() {
      return this.localInvites.map(invite => invite[0][0]);

    }
  },
  data() {
    return {
      localInvites: JSON.parse(localStorage.getItem("invites") || "[]")
    };
  },
  mounted() {
    window.addEventListener("storage", this.handleStorageChange);
  },
  beforeDestroy() {
    window.removeEventListener("storage", this.handleStorageChange);
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    inviteChat(to){
      if(to.id=="") return;
      if (!this.session.isSpectator) to = [["ST", "ST"], [to.name, to.id]];
      else{
      const playerChat = [];
      this.players.forEach(player => {
        if (player.id == this.session.playerId) {
          playerChat.push(player.name);
          playerChat.push(player.id);
        }
      })
        if (to.id == "ST") to = [playerChat, ["ST", "ST"]];
        else to = [playerChat, [to.name, to.id]];}
      this.$store.commit("session/inviteChat", to);
    },
    updateInvitesFromStorage() {
      this.localInvites = JSON.parse(localStorage.getItem("invites") || "[]");
    },
    removeInviteBySender(senderName) {
      let invites = JSON.parse(localStorage.getItem("invites") || "[]");
      invites = invites.filter(invite => invite[0][0] !== senderName);
      localStorage.setItem("invites", JSON.stringify(invites));
      this.updateInvitesFromStorage(); // refresh localInvites
    },
    handleStorageChange(event) {
      if (!event.key || event.key === "invites") {
        this.updateInvitesFromStorage();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";
.invitation-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 50px 50px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-weight: bold;
  text-align: center;
  z-index: 999;
  pointer-events: auto;
}
  .names:hover{
    color: red;
  }
.content{
  padding: 10px 100px;
  .Accept:hover{
    color: $townsfolk;
  }
  .Refuse:hover{
    color: red;
  }

}
</style>
