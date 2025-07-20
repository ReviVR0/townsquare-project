<template>
<<<<<<< Updated upstream
  <Modal
      v-if="modals.form"
      class="form"
      @close="toggleModal('form')"
  >
    <div class="form-container">

    </div>
  </Modal>
</template>

=======
  <Modal v-if="modals.form" class="form" @close="toggleModal('form')">
    <div class="form-container">
      <form @submit.prevent="submitForm" class="form-grid">
        <div class="form-fields">
          <label
            >ID:
            <input
              type="text"
              v-model="form.id"
              required
              pattern="^[a-z0-9_]+$"
              title="ID must be lowercase letters, numbers or underscores"
          /></label>
          <label
            >Name:
            <input
              type="text"
              v-model="form.name"
              required
              pattern="^[A-Z][a-zA-Z0-9 ]*$"
              title="Name must start with an uppercase letter and contain only letters, numbers, or spaces"
          /></label>
          <label>Team:</label>
          <div class="radio-group">
            <label v-for="(team, index) in teams" :key="team">
              <input
                name="team"
                type="radio"
                v-model="form.team"
                :value="team"
                :required="index === 0"
              />
              {{ team }}
            </label>
          </div>
          <label
            >Ability:
            <textarea v-model="form.ability" />
          </label>
          <label
            >Night Order: <input type="number" v-model="form.nightOrder"
          /></label>
          <label
            >First Night Reminder:
            <input type="text" v-model="form.firstNightReminder"
          /></label>
          <label
            >Other Night: <input type="number" v-model="form.otherNight"
          /></label>
          <label
            >Other Night Reminder:
            <input type="text" v-model="form.otherNightReminder"
          /></label>
          <label
            >Reminders: <input type="text" v-model="form.reminders"
          /></label>
          <label>
            <input type="checkbox" v-model="form.setup" />
            Setup
          </label>
          <button type="submit">Submit</button>
        </div>
        <div class="image-section">
          <div class="token-preview">
            <img
              class="token-base"
              src="../../assets/token.png"
              alt="Token Base"
            />
            <img class="token-overlay" :src="roleImageSrc" alt="Role Icon" />
          </div>
          <label
            >Image URL:
            <input type="url" v-model="imageURL" />
          </label>
        </div>
      </form>
    </div>
  </Modal>
</template>
>>>>>>> Stashed changes
<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";

export default {
  components: { Modal },
  data() {
    return {
<<<<<<< Updated upstream
      difficulty: "", // New
      questions: [],
      answers: [],
    };
  },

  computed: {
    ...mapState(["modals"]),
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    },
};
</script>

<style scoped>
=======
      form: {
        id: "",
        name: "",
        team: "",
        ability: "",
        nightOrder: null,
        firstNightReminder: "",
        otherNight: null,
        otherNightReminder: "",
        reminders: "",
        setup: false,
      },
      imageURL: "",
      teams: ["demon", "minion", "outsider", "townsfolk", "traveler"],
    };
  },
  computed: {
    ...mapState(["modals"]),
    roleImageSrc() {
      if (this.imageURL) return this.imageURL;
      var team = this.form.team || "custom";
      switch (team) {
        case "demon":
          team = "evil";
          break;
        case "townsfolk":
          team = "good";
          break;
        case "traveler":
          team = "custom";
          break;
      }
      try {
        return require(`@/assets/icons/Reminder/${team}.png`);
      } catch (e) {
        return require("@/assets/icons/Reminder/custom.png");
      }
    },
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    submitForm() {
      const dataToStore = {
        ...this.form,
        imageURL: this.imageURL,
      };
      localStorage.setItem(`form-${this.form.id}`, JSON.stringify(dataToStore));
      alert("Saved to localStorage.");
      this.toggleModal("form");
    },
  },
};
</script>
<style scoped>
.form-container {
  padding: 1rem;
}

.form-grid {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}

.form-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.image-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.token-preview {
  position: relative;
  width: 100px;
  height: 100px;

  .token-base,
  .token-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
}
>>>>>>> Stashed changes
</style>
