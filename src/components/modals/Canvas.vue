<template>
  <div
    class="drawing-modal"
    v-if="modals.drawingModal"
  >
    <canvas
      ref="canvas"
      class="drawing-canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
    ></canvas>

    <div class="drawing-toolbar">
      <button class="tool-btn" :class="{ active: currentTool === 'draw' }" @click="setTool('draw')">
        Pen
      </button>

      <button class="tool-btn" :class="{ active: currentTool === 'text' }" @click="setTool('text')">
        Text
      </button>

      <label class="tool-label">
        Color
        <input type="color" v-model="strokeColor" @change="applyStrokeStyle" />
      </label>

      <label class="tool-label range">
        Size {{ brushSize }}
        <input
          type="range"
          min="1"
          max="14"
          step="1"
          v-model.number="brushSize"
          @input="applyStrokeStyle"
        />
      </label>

      <button class="tool-btn" :class="{ active: isEraser }" @click="toggleEraser">
        {{ isEraser ? "Pen" : "Eraser" }}
      </button>

      <button class="tool-btn" @click="undo" :disabled="!undoStack.length">Undo</button>
      <button class="tool-btn" @click="redo" :disabled="!redoStack.length">Redo</button>
      <button class="tool-btn danger" @click="clearCanvas">Clear</button>
      <button class="tool-btn" @click="closeModal">Close</button>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";

export default {
  data() {
    return {
      isDrawing: false,
      currentTool: "draw",
      ctx: null,
      lastX: 0,
      lastY: 0,
      strokeColor: "#ff3b30",
      brushSize: 3,
      isEraser: false,
      savedImage: null,
      undoStack: [],
      redoStack: []
    };
  },
  computed: {
    ...mapState(["modals", "session"]),
    drawingStorageKey() {
      return `drawing_overlay_${this.session?.sessionId || "default"}`;
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.modals.drawingModal) {
        this.initCanvas();
      }
    });
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },
  watch: {
    "modals.drawingModal"(val) {
      if (val) {
        this.$nextTick(() => this.initCanvas());
      } else {
        this.persistCanvas();
      }
    }
  },

  methods: {
    ...mapMutations(["toggleModal"]),

    initCanvas() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      this.ctx = canvas.getContext("2d");
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(ratio, ratio);
      this.applyStrokeStyle();
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";

      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const persisted = localStorage.getItem(this.drawingStorageKey);
      this.savedImage = persisted || this.savedImage;
      if (this.savedImage) {
        const img = new Image();
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
        };
        img.src = this.savedImage;
      }
    },

    handleResize() {
      if (!this.modals.drawingModal || !this.ctx) return;
      const snapshot = this.$refs.canvas ? this.$refs.canvas.toDataURL() : null;
      this.savedImage = snapshot;
      this.initCanvas();
    },

    applyStrokeStyle() {
      if (!this.ctx) return;
      this.ctx.strokeStyle = this.strokeColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.globalCompositeOperation = this.isEraser ? "destination-out" : "source-over";
    },

    setTool(tool) {
      this.currentTool = tool;
      this.isDrawing = false;
      if (tool === "text" && this.isEraser) {
        this.isEraser = false;
        this.applyStrokeStyle();
      }
    },

    toggleEraser() {
      this.isEraser = !this.isEraser;
      this.applyStrokeStyle();
    },

    getPointerPosition(e) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    },

    saveUndoSnapshot() {
      if (!this.$refs.canvas) return;
      this.undoStack.push(this.$refs.canvas.toDataURL());
      if (this.undoStack.length > 30) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    },

    onPointerDown(e) {
      if (!this.ctx) return;
      if (e.pointerType === "touch") e.preventDefault();

      const pos = this.getPointerPosition(e);
      if (this.currentTool === "text") {
        this.placeTextAt(pos.x, pos.y);
        return;
      }

      this.saveUndoSnapshot();
      this.isDrawing = true;
      this.lastX = pos.x;
      this.lastY = pos.y;
      if (this.$refs.canvas?.setPointerCapture) {
        this.$refs.canvas.setPointerCapture(e.pointerId);
      }
    },

    onPointerUp() {
      this.isDrawing = false;
      this.persistCanvas();
    },

    onPointerMove(e) {
      if (!this.isDrawing || !this.ctx || this.currentTool !== "draw") return;
      if (e.pointerType === "touch") e.preventDefault();

      const pos = this.getPointerPosition(e);
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
      this.lastX = pos.x;
      this.lastY = pos.y;
    },

    placeTextAt(x, y) {
      if (!this.ctx) return;
      const text = window.prompt("Type text to place on board:");
      if (!text || !text.trim()) return;

      this.saveUndoSnapshot();
      this.ctx.save();
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.fillStyle = this.strokeColor;
      const textSize = Math.max(12, this.brushSize * 6);
      this.ctx.font = `${textSize}px Arial`;
      this.ctx.textBaseline = "top";
      this.ctx.fillText(text.trim(), x, y);
      this.ctx.restore();
      this.persistCanvas();
    },

    restoreFromDataUrl(dataUrl) {
      if (!this.ctx || !dataUrl) return;
      const img = new Image();
      img.onload = () => {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
      };
      img.src = dataUrl;
    },

    undo() {
      if (!this.undoStack.length || !this.$refs.canvas) return;
      this.redoStack.push(this.$refs.canvas.toDataURL());
      const previous = this.undoStack.pop();
      this.restoreFromDataUrl(previous);
      this.savedImage = previous;
      this.persistCanvas();
    },

    redo() {
      if (!this.redoStack.length || !this.$refs.canvas) return;
      this.undoStack.push(this.$refs.canvas.toDataURL());
      const next = this.redoStack.pop();
      this.restoreFromDataUrl(next);
      this.savedImage = next;
      this.persistCanvas();
    },

    persistCanvas() {
      if (!this.$refs.canvas) return;
      const img = this.$refs.canvas.toDataURL();
      this.savedImage = img;
      localStorage.setItem(this.drawingStorageKey, img);
    },

    clearCanvas() {
      if (!this.ctx || !this.$refs.canvas) return;
      this.saveUndoSnapshot();
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      this.savedImage = null;
      localStorage.removeItem(this.drawingStorageKey);
      this.redoStack = [];
    },

    closeModal() {
      this.persistCanvas();
      this.toggleModal("drawingModal");
    }
  }
};
</script>

<style scoped>
.drawing-modal {
  padding: 0;
  background: transparent;
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
}

.drawing-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  cursor: crosshair;
  z-index: 1;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0);
  user-select: none;
  touch-action: none;
}

.drawing-toolbar {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 95vw;
  pointer-events: auto;
  background: rgba(22, 22, 28, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 8px;
  backdrop-filter: blur(4px);
}

.tool-btn {
  border: none;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  background: #f6f7fb;
  color: #111;
}

.tool-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tool-btn.active {
  background: #ffd166;
}

.tool-btn.danger {
  background: #ff6b6b;
  color: #fff;
}

.tool-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #fff;
  padding: 0 4px;
}

.tool-label input[type="color"] {
  width: 28px;
  height: 28px;
  border: none;
  padding: 0;
  background: transparent;
}

.tool-label.range input[type="range"] {
  width: 96px;
}

@media (max-width: 768px) {
  .drawing-toolbar {
    top: 8px;
    gap: 6px;
    padding: 6px;
  }

  .tool-btn {
    font-size: 12px;
    padding: 7px 8px;
  }

  .tool-label {
    font-size: 11px;
  }
}
</style>
