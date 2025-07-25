<template>
  <Modal
    class="send-cards-modal"
    v-if="modals.sendCard && !session.isSpectator"
    @close="toggleModal('sendCard')"
  >
    <div class="send-cards-wrapper">
      <h3>Send Info to Players</h3>
      <p class="subtitle">Click a token to send a message.</p>

      <div class="grid-scroll-container">
        <div class="grid">
          <div
            v-for="(option, index) in allOptions"
            :key="index"
            class="grid-item"
            @click="selectOption(option)"
          >
            <img :src="iconSrc" alt="icon" />
            <span class="label">{{ option.label }}</span>
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
  components: { Modal },
  data() {
    return {
      iconSrc: require("@/assets/token.png"),
      optionsA: [
        { label: "Use Ability" },
        { label: "Make a Choice" },
        { label: "Not in Play" },
        { label: "This is the Demon" },
        { label: "Your Minions" },
        { label: "You Are" },
        { label: "This Player Is" },
        { label: "Selected You" },
      ],
      optionsB: [
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
  computed: {
    ...mapState(["modals", "session"]),
    allOptions() {
      return [...this.optionsA, ...this.optionsB];
    },
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    selectOption(option) {
      console.log("Selected:", option.label);
      this.$emit("card-selected", option.label);
    },
  },
};
</script>

<style lang="scss" scoped>
/* Scoped style with deep selector to override Modal internals */

.send-cards-modal {
  /* Override modal backdrop */
  ::v-deep(.modal-backdrop) {
    background-color: rgba(0, 0, 0, 0.85) !important;
  }

  /* Override modal container */
  ::v-deep(.modal) {
    background-color: rgba(0, 0, 0, 0.9) !important;
    padding: 30px !important;
    border-radius: 14px !important;
    max-height: 80vh !important;
    max-width: 90vw !important;
    width: auto !important;
    box-shadow: 0 0 30px 5px rgba(255, 255, 255, 0.1) !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
    color: white !important;
  }

  /* Maximize button styles override if needed */
  ::v-deep(.top-right-buttons) {
    top: 20px !important;
    right: 20px !important;
  }

  .send-cards-wrapper {
    width: 100%;
    max-width: 700px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    user-select: none;

    h3 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 10px 0;
      color: #ffd700;
    }

    .subtitle {
      font-size: 16px;
      color: #eee;
      margin-bottom: 15px;
    }
  }

  .grid-scroll-container {
    max-height: 65vh;
    overflow-y: auto;
    padding-right: 8px;
    width: 100%;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 14px;
    justify-items: center;
    padding: 5px 0;
  }

  .grid-item {
    background-color: rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 12px;
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease;
    width: 90px;

    &:hover {
      transform: scale(1.07);
      background-color: rgba(255, 255, 255, 0.15);
    }

    img {
      width: 50px;
      height: 50px;
      object-fit: contain;
      margin-bottom: 6px;
      filter: drop-shadow(0 0 1px black);
    }

    .label {
      font-size: 13px;
      color: white;
      word-break: break-word;
      user-select: none;
    }
  }
}
</style>
