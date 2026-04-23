<template>
  <Modal v-if="modals.fabled && fabled.length" @close="toggleModal('fabled')">
    <h3>
      Choose a fabled character to add to the game
    </h3>

    <!-- Tokens list -->
    <ul class="tokens">
      <li v-for="role in fabled" :key="role.id" @click="setFabled(role)">
        <Token :role="role" />
      </li>
    </ul>

    <!-- Tab buttons -->
    <div class="button-group">
      <span
        class="button"
        :class="{ townsfolk: tab === 'fabled' }"
        @click="tab = 'fabled'"
      >
        Fabled
      </span>
      <span
        class="button"
        :class="{ townsfolk: tab === 'loric' }"
        @click="tab = 'loric'"
      >
        Loric
      </span>
    </div>
  </Modal>
</template>


<script>
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal";
import Token from "../Token";

export default {
  components: { Token, Modal },
  computed: {
    ...mapState(["modals", "fabled", "grimoire"]),
    fabled() {
      const fabled = [];
      this.$store.state.fabled.forEach(role => {
        // Allow bootleggers to be added multiple times (each with different ability)
        // For other roles, filter them out if already in the game
        if (role.id !== "bootlegger") {
          if (!this.$store.state.players.fabled.some(fable => fable.id === role.id)) {
            if (role.team === this.tab) {
              fabled.push(role);
            }
          }
        } else {
          // Always show bootlegger option (can be added multiple times)
          if (role.team === this.tab) {
            fabled.push(role);
          }
        }
      });
      return fabled;
    }
  },
  data() {
    return {
      tab: "fabled"
    };
  },
  methods: {
    setFabled(role) {
      // Special handling for bootlegger - prompt for ability
      if (role.id === "bootlegger") {
        const ability = prompt("What does this bootlegger do?");
        if (ability === null) return; // User cancelled
        
        // Create a bootlegger with custom ability
        const bootleggerWithAbility = {
          ...role,
          ability: ability.trim() || "No ability specified"
        };
        this.$store.commit("players/setFabled", { fabled: bootleggerWithAbility });
      } else {
        this.$store.commit("players/setFabled", { fabled: role });
      }
      this.toggleModal("fabled");
    },
    ...mapMutations(["toggleModal"])
  }
};
</script>


<style scoped lang="scss">
@import "../../vars.scss";

ul.tokens li {
  border-radius: 50%;
  width: 8vw;
  margin: 0.5%;
  transition: transform 500ms ease;

  &:hover {
    transform: scale(1.2);
    z-index: 10;
  }
}

</style>
