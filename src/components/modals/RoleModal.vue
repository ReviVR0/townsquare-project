<template>
  <Modal v-if="modals.role && availableRoles.length" @close="close">
    <h3>
      Choose a new character for
      {{
        playerIndex >= 0 && players.length
          ? players[playerIndex].name
          : "bluffing"
      }}
    </h3>

    <!-- Roles Display -->
    <ul class="tokens">
      <li
        v-for="role in displayedRoles"
        :class="[role.team]"
        :key="role.id"
        @click="setRole(role)"
      >
      <Token :role="{ ...role, alignmentIndex: role.alignmentIndex }" :alignment-index="role.alignmentIndex" />
      </li>
    </ul>

    <!-- Tab Buttons -->
    <div class="button-group" v-if="playerIndex >= 0 && otherTravelers.size">
      <span
        class="button"
        :class="{ townsfolk: tab === 'editionRoles' }"
        @click="tab = 'editionRoles'"
      >Edition Roles</span>
      <span
        v-if="!session.isSpectator"
        class="button"
        :class="{ townsfolk: tab === 'otherTravelers' }"
        @click="tab = 'otherTravelers'"
      >Other Travelers</span>
      <span
        class="button"
        :class="{ townsfolk: tab === 'GoodRoles' }"
        @click="tab = 'GoodRoles'"
      >Good Roles</span>
      <span
        class="button"
        :class="{ townsfolk: tab === 'EvilRoles' }"
        @click="tab = 'EvilRoles'"
      >Evil Roles</span>
    </div>
  </Modal>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal";
import Token from "../Token";

export default {
  components: { Token, Modal },
  props: ["playerIndex"],
  data() {
    return {
      tab: "editionRoles",
    };
  },
  computed: {
    ...mapState(["modals", "roles", "session", "otherTravelers"]),
    ...mapState("players", ["players"]),

    availableRoles() {
      const availableRoles = [];
      const players = this.players;

      this.roles.forEach((role) => {
        // Skip already assigned roles if bluff
        if (
          this.playerIndex >= 0 ||
          (this.playerIndex < 0 && !players.some((p) => p.role.id === role.id))
        ) {
          const roleCopy = { ...role };

          // Set alignmentIndex based on current tab
          if (this.tab === "GoodRoles") roleCopy.alignmentIndex = 1;
          else if (this.tab === "EvilRoles") roleCopy.alignmentIndex = 2;
          else roleCopy.alignmentIndex = 0;

          availableRoles.push(roleCopy);
        }
      });

      return availableRoles;
    },

    // Filter roles displayed in UI
    displayedRoles() {
      if (this.tab === "editionRoles" || !this.otherTravelers.size) {
        return this.availableRoles;
      } else if (this.tab === "otherTravelers") {
        return [...this.otherTravelers.values()].map((role) => ({
          ...role,
        }));
      } else {
        return this.availableRoles;
      }
    },
  },
  methods: {
    ...mapMutations(["toggleModal"]),

    setRole(role) {
      const alignment = role.alignmentIndex ?? 0;
      if (this.playerIndex < 0) {
        // assign to bluff slot
        this.$store.commit("players/setBluff", {
          index: this.playerIndex * -1 - 1,
          role,
          alignmentIndex: alignment,
        });
      } else {
        if (this.session.isSpectator && role.team === "traveler") return;

        const player = this.players[this.playerIndex];
        this.$store.commit("players/update", {
          player,
          property: "role",
          value: role,
        });

        // Commit alignment index
        this.$store.commit("players/update", {
          player,
          property: "alignmentIndex",
          value: alignment,
        });
      }

      this.tab = "editionRoles";
      this.toggleModal("role");
    },

    close() {
      this.tab = "editionRoles";
      this.toggleModal("role");
    },
  },
};
</script>

<style scoped lang="scss">
@import "../../vars.scss";

ul.tokens li {
  border-radius: 50%;
  width: 6vw;
  margin: 1%;
  transition: transform 500ms ease;

  &.townsfolk {
    box-shadow: 0 0 10px $townsfolk, 0 0 10px #004cff;
  }
  &.outsider {
    box-shadow: 0 0 10px $outsider, 0 0 10px $outsider;
  }
  &.minion {
    box-shadow: 0 0 10px $minion, 0 0 10px $minion;
  }
  &.demon {
    box-shadow: 0 0 10px $demon, 0 0 10px $demon;
  }
  &.traveler {
    box-shadow: 0 0 10px $traveler, 0 0 10px $traveler;
  }

  &:hover {
    transform: scale(1.2);
    z-index: 10;
  }
}

#townsquare.spectator ul.tokens li.traveler {
  display: none;
}
</style>
