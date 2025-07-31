<template>
  <Modal
    class="winning-team-menu"
    v-if="modals.winningTeam && !session.isSpectator"
    @close="toggleModal('winningTeam')"
  >
    <h3>Winning Team</h3>
    <div class="content">
      <button class="button good" @click="changeWinningTeam('good')">
        Good Won
      </button>
      <button class="button evil" @click="changeWinningTeam('evil')">
        Evil Won
      </button>
      <button class="button neutral" @click="changeWinningTeam('null')">
        Clear Won
      </button>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapState, mapMutations } from "vuex";

export default {
  components: {
    Modal
  },
  computed: {
    ...mapState(["session", "modals"])
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    changeWinningTeam(team) {
      this.$store.commit("session/winningTeam", team);
      this.toggleModal('winningTeam');
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

.winning-team-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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

h3 {
  margin: 20px;
  font-size: 28px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.button {
  background-color: #222;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  cursor: pointer;
  text-shadow: 0 1px 2px black;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  transition: transform 0.1s ease, box-shadow 0.1s ease;

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  }

  &.good {
    color: $townsfolk; // Or replace with e.g. #4ee44e
  }

  &.evil {
    color: $demon; // Or replace with e.g. #e44
  }

  &.neutral {
    color: #b9b9b9ff;
  }
}


</style>
