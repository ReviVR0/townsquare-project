<template>
  <Modal
    class="send-cards-modal"
    v-if="modals.sendCard && !session.isSpectator"
    @close="toggleModal('sendCards')"
  >
    <h3>Send Info to Players</h3>

    <div class="card-grid">
      <div
        class="card"
        v-for="(card, index) in cardOptions"
        :key="index"
        @click="sendCard(card)"
      >
        <img :src="require('@/assets/token.png')" alt="icon" />
        <span>{{ card.label }}</span>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapState, mapMutations } from "vuex";

export default {
  components: {
    Modal,
  },
  computed: {
    ...mapState(["modals", "session"]),
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    sendCard(card) {
      console.log(card);
      // Send the selected card info to players
      //this.$store.commit("session/sendCardToPlayers", card);
    },
  },
  data() {
    return {
      cardOptions: [
        { label: "Use Ability" },
        { label: "Make a Choice" },
        { label: "Not in Play" },
        { label: "This is the Demon" },
        { label: "Your Minions" },
        { label: "You Are" },
        { label: "This Player Is" },
        { label: "Selected You" },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

.send-cards-modal {
  padding: 40px;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  text-align: center;
  font-weight: bold;

  h3 {
    margin-bottom: 20px;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 20px;
    justify-items: center;
  }

  .card {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 10px;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 100px;

    &:hover {
      transform: scale(1.05);
      background-color: rgba(255, 255, 255, 0.1);
    }

    img {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 5px;
    }

    span {
      display: block;
      font-size: 12px;
    }
  }
}
</style>
