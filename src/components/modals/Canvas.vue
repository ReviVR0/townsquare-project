<template>
  <div
      class="drawing-modal draw-mode"
      v-if="modals.drawingModal"
      :class="{ 'inactive-mode': !isActive }"
  >
    <canvas
        ref="canvas"
        class="drawing-canvas"
        :class="{ 'inactive': !isActive }"
        @mousedown="startDrawing"
        @mouseup="stopDrawing"
        @mouseout="stopDrawing"
        @mousemove="draw"
    ></canvas>

    <button class="toggle-active-btn" @click="toggleActive">
      {{ isActive ? 'Disable Drawing' : 'Enable Drawing' }}
    </button>

    <button class="clear-canvas" @click="clearCanvas">Clear Drawing</button>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  data() {
    return {
      isDrawing: false,
      isActive: true, // Drawing active by default
      ctx: null,
      lastX: 0,
      lastY: 0,
      savedImage: null
    };
  },
  computed: {
    ...mapState(["modals"])
  },
  mounted() {
    this.$nextTick(() => {
      if (this.modals.drawingModal) {
        this.initCanvas();
      }
    });
  },
  watch: {
    'modals.drawingModal'(val) {
      if (val) {
        this.$nextTick(() => this.initCanvas());
      } else {
        // Modal closed, save current drawing
        const canvas = this.$refs.canvas;
        if (canvas) {
          this.savedImage = canvas.toDataURL();
        }
      }
    }
  },

  methods: {
    initCanvas() {
      const canvas = this.$refs.canvas;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      this.ctx = canvas.getContext("2d");
      this.ctx.strokeStyle = "#ff0000";
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = "round";

      // Clear with transparent background
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.fillStyle = "rgba(0, 0, 0, 0)";
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Restore saved image if present
      if (this.savedImage) {
        const img = new Image();
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0);
        };
        img.src = this.savedImage;
      }
    },

    toggleActive() {
      this.isActive = !this.isActive;
    },
    startDrawing(e) {
      if (!this.isActive) return;
      this.isDrawing = true;
      [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
    },
    stopDrawing() {
      this.isDrawing = false;
    },
    draw(e) {
      if (!this.isDrawing || !this.isActive) return;
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(e.offsetX, e.offsetY);
      this.ctx.stroke();
      [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
    },
    clearCanvas() {
      const canvas = this.$refs.canvas;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.fillStyle = "rgba(0, 0, 0, 0)";
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
};
</script>

<style scoped>
.drawing-modal.draw-mode {
  padding: 0;
  background: transparent;
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: auto;
}

.drawing-modal.draw-mode.inactive-mode {
  pointer-events: none;
}

.drawing-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  cursor: crosshair;
  z-index: 10;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0);
  user-select: none;
}

.drawing-canvas.inactive {
  pointer-events: none;
  cursor: default;
  background: rgba(0, 0, 0, 0);
}

.clear-canvas,
.toggle-active-btn {
  position: fixed;
  top: 20px;
  z-index: 20; /* above canvas */
  border: none;
  padding: 8px 12px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  pointer-events: auto;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.clear-canvas {
  right: 20px;
}

.toggle-active-btn {
  right: 130px;
}
</style>
