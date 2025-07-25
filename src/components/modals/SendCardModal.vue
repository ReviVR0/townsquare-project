<template>
  <Modal
    class="send-cards-modal"
    v-if="modals.sendCards && !session.isSpectator"
    @close="toggleModal('sendCards')"
  >
    <div class="modal-content">
      <h3>{{ title }}</h3>
      <p class="subtitle">{{ subtitle }}</p>

      <div class="grid-container">
        <div
          v-for="(card, index) in cards"
          :key="index"
          class="card-item"
          @click="sendCard(card)"
        >
          <img :src="cardIcon" alt="card icon" />
          <span class="label">{{ card.label }}</span>
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
  props: {
    title: {
      type: String,
      default: "Send Info to Players",
    },
    subtitle: {
      type: String,
      default: "Choose what to send to the selected players.",
    },
  },
  computed: {
    ...mapState(["modals", "session"]),
  },
  data() {
    return {
      cardIcon: require("@/assets/token.png"),
      cards: [
        { label: "Use Ability" },
        { label: "Make a Choice" },
        { label: "Not in Play" },
        { label: "This is the Demon" },
        { label: "Your Minions" },
        { label: "You Are" },
        { label: "This Player Is" },
        { label: "Selected You" },
        { label: "Got it" },
        { label: "Yes" },
        { label: "No" },
        { label: "Good" },
        { label: "Evil" },
        { label: "Clockwise" },
        { label: "Anticlockwise" },
        { label: "Zero" },
        { label: "One" },
        { label: "Two" },
        { label: "Three" },
        { label: "Four" },
        { label: "Five" },
        { label: "Player" },
        { label: "Character" },
        { label: "Custom" },
      ],
    };
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    sendCard(card) {
      console.log("Card sent:", card.label);
      this.$emit("card-selected", card.label);
      // Optionally: this.$store.commit("session/sendCardToPlayers", card);
    },
  },
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

.send-cards-modal {
  padding: 30px;
  background-color: rgba(0, 0, 0, 0.85);
  text-align: center;
  color: white;

  .modal-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h3 {
    font-size: 24px;
    margin-bottom: 5px;
  }

  .subtitle {
    font-size: 16px;
    margin-bottom: 20px;
    color: #ffd700;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 15px;
    width: 100%;
    max-width: 700px;
  }

  .card-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 10px;
    cursor: pointer;
    transition: transform 0.15s ease;
    &:hover {
      transform: scale(1.05);
      background-color: rgba(255, 255, 255, 0.1);
    }

    img {
      width: 40px;
      height: 40px;
      object-fit: contain;
      margin-bottom: 5px;
    }

    .label {
      font-size: 13px;
      word-break: break-word;
    }
  }

  @media (max-width: 500px) {
    .grid-container {
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 10px;
    }

    .card-item {
      padding: 8px;
      img {
        width: 30px;
        height: 30px;
      }

      .label {
        font-size: 11px;
      }
    }
  }
}
</style>
