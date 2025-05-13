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
    <ul class="tokens" v-if="tab === 'editionRoles' || !otherTravelers.size">
      <li
        v-for="role in availableRoles"
        :class="[role.team]"
        :key="role.id"
        @click="setRole(role)"
      >
        <Token :role="role" />
      </li>
    </ul>
    <ul class="tokens" v-if="tab === 'otherTravelers' && otherTravelers.size">
      <li
        v-for="role in otherTravelers.values()"
        :class="[role.team]"
        :key="role.id"
        @click="setRole(role)"
      >
        <Token :role="role" />
      </li>
    </ul>
    <ul class="tokens" v-if="tab === 'GoodRoles' || !otherTravelers.size">
      <li
        v-for="role in availableRoles"
        class=townsfolk
        :key="role.id"
        @click="setRole(role)"
      >
        <Token :role="role" />
      </li>
    </ul>

    <ul class="tokens" v-if="tab === 'EvilRoles' || !otherTravelers.size">
      <li
        v-for="role in availableRoles"
        class=demon
        :key="role.id"
        @click="setRole(role)"
      >
        <Token :role="role" />
      </li>
    </ul>




    <div
      class="button-group"
      v-if="playerIndex >= 0 && otherTravelers.size"
    >
      <span
        class="button"
        :class="{ townsfolk: tab === 'editionRoles' }"
        @click="tab = 'editionRoles'"
        >Edition Roles</span
      >
      <span  v-if="!session.isSpectator"
        class="button"
        :class="{ townsfolk: tab === 'otherTravelers' }"
        @click="tab = 'otherTravelers'"
        >Other Travelers</span 
      >
        <span
        class="button"
        :class="{ townsfolk: tab === 'GoodRoles' }"
        @click="tab = 'GoodRoles'"
        >Good Roles</span
      >
        <span
        class="button"
        :class="{ townsfolk: tab === 'EvilRoles' }"
        @click="tab = 'EvilRoles'"
        >Evil Roles</span
      >
    </div>
  </Modal>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal";
import Token from "../Token";

export default { // Maybe here!!!!!!!!!!!!!!!!!!
  components: { Token, Modal },
  props: ["playerIndex"],
  computed: {
    availableRoles() {
      const availableRoles = [];
      const players = this.$store.state.players.players;
      this.$store.state.roles.forEach(role => {
        // don't show bluff roles that are already assigned to players
        if (
          ((this.playerIndex >= 0 && this.tab === "editionRoles") || ((this.tab === "GoodRoles" || this.tab === "EvilRoles") && !(role.team === "traveler"))) ||
          (this.playerIndex < 0 &&
            !players.some(player => player.role.id === role.id) 
            )
        ) {

var role_r = structuredClone(role);


        if (this.tab === "GoodRoles"){
          role_r.team = "townsfolk";
          } //THIS add relation
        if (this.tab === 'EvilRoles'){
          role_r.team = "minion"; //THIS add relation
        }
        availableRoles.push(role_r);
        }

      });
      availableRoles.push({});
      return availableRoles;
    },
    ...mapState(["modals", "roles", "session"]),
    ...mapState("players", ["players"]),
    ...mapState(["otherTravelers"])
  },
  data() {
    return {
      tab: "editionRoles"
    };
  },
  methods: {
    setRole(role) {  
      if (this.playerIndex < 0) {
        // assign to bluff slot (index < 0)
        this.$store.commit("players/setBluff", {
          index: this.playerIndex * -1 - 1,
          role
        });
      } else {
        if (this.session.isSpectator && role.team === "traveler") return;
        // assign to player
        const player = this.$store.state.players.players[this.playerIndex];          
        var role_r = structuredClone(role);
        if (this.tab === "GoodRoles"){
          role_r.team = "townsfolk";
          } //THIS add relation
        if (this.tab === 'EvilRoles'){
          role_r.team = "minion"; //THIS add relation
        }
        this.$store.commit("players/update", { 
          player,
          property: "role",
          value: role,
          team: role_r.team
        });
      }
      this.tab = "editionRoles";
      this.$store.commit("toggleModal", "role");
    },
    close() {
      this.tab = "editionRoles";
      this.toggleModal("role");
    },
    ...mapMutations(["toggleModal"])
  }
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
