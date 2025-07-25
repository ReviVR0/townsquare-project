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
        // Add more for scroll test
        { label: "Action Taken" },
        { label: "Blocked" },
        { label: "In Play" },
        { label: "Revealed" },
        { label: "Seen You" },
        { label: "Wants to Help" },
        { label: "Marked by Death" },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

.send-cards-modal {
  // ⬇ Overrides modal content width
  ::v-deep(.modal) {
    max-width: 90vw !important;
    max-height: 90vh !important;
    width: 100%;
    height: auto;
    overflow: auto;
  }

  padding: 20px;
  color: white;
  text-align: center;
  font-weight: bold;

  h3 {
    margin-bottom: 20px;
  }

  .card-scroll-container {
    overflow-y: auto;
    max-height: 70vh;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 12px;
    justify-items: center;
    max-width: 1000px;
    margin: 0 auto;
  }

  .card {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 10px;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 80px;
    text-align: center;

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
      word-break: break-word;
    }
  }
}
</style>
