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
    }
  },
  data() {
    return {
    };
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    InviteST(){
      const chat = [];
      const playerChat = [];
      this.players.forEach(player => {
        if (player.id == this.session.playerId) {
          playerChat.push(player.name);
          playerChat.push(player.id);
          chat.push(playerChat);
        }
      });
      chat.push("ST");
      this.$store.commit("session/inviteChat", chat);
    },
    inviteChat(to){
      if(to=="") return;
      if (!this.session.isSpectator) to = ["ST", [to.name, to.id]];
      else{
      const playerChat = [];
      this.players.forEach(player => {
        if (player.id == this.session.playerId) {
          playerChat.push(player.name);
          playerChat.push(player.id);
        }
      })
        if (to.id == "ST") to = [playerChat, "ST"];
        else to = [playerChat, [to.name, to.id]];}
      this.$store.commit("session/inviteChat", to);
    }

  }
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

  background-color: rgba(0, 0, 0, 0.5); // semi-transparent dark background
  color: white;
  font-weight: bold;
  text-align: center;
  z-index: 999; // ensure it appears above everything
  pointer-events: auto;
}
 .names :hover{
    color: red;
  }
.content{
  padding: 10px 100px;
}
</style>
