<template>
  <Modal
    class="send-cards-modal"
    v-if="modals.sendCard && !session.isSpectator"
    @close="toggleModal('sendCards')"
  >
    <div class="send-cards-wrapper">
      <h3>Send Info to Players</h3>

      <div class="card-scroll-container">
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
      // this.$store.commit("session/sendCardToPlayers", card);
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
        // Add more to test scrolling
      ],
    };
  },
};
</script>

<style lang="scss">
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

  .card-scroll-container {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 8px;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr); // << 6 per row
    gap: 12px;
    justify-items: center;
    padding: 10px 0;
  }

  .card {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 10px;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 80px;

    &:hover {
      transform: scale(1.05);
      background-color: rgba(255, 255, 255, 0.1);
    }

    img {
      width: 50px;
      height: 50px;
      object-fit: contain;
      margin-bottom: 5px;
    }

    span {
      display: block;
      font-size: 11px;
      text-align: center;
      word-break: break-word;
    }
  }
}
</style>
