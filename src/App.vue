<template>
  <div ref="canvas" class="scene">
    <!-- LOADING OVERLAY (viewer only) -->
    <div class="loading-overlay" v-if="!isControllerMode && showLoading">
      <div class="loading-card">
        <div class="loading-title">Loading Drone Simulator</div>

        <div class="loading-bar">
          <div class="loading-bar-fill" :style="{ width: `${loadingPct}%` }"></div>
        </div>

        <div class="loading-meta">
          <span>{{ loadingLabel }}</span>
          <span>{{ loadingPct }}%</span>
        </div>
      </div>
    </div>

    <!-- VIEWER UI (desktop) -->
    <div class="ui-overlay" v-if="!isControllerMode">
      <img src="/logo.png" class="brand-logo" />
      <div class="ui-title">Drone Simulator</div>
      <div class="ui-description">{{ cameraModeLabel }} View (Press C Key)</div>

      <div class="net-panel">
        <div class="net-row">
          <span class="label">Room:</span>
          <span class="value">{{ roomCode }}</span>
        </div>
        <div class="net-row">
          <span class="label">Socket:</span>
          <span class="value" :class="{ ok: socketConnected }">
            {{ socketConnected ? "connected" : "disconnected" }}
          </span>
        </div>
        <div class="net-row">
          <span class="label">Controller:</span>
          <span class="value" :class="{ ok: controllerJoined }">
            {{ controllerJoined ? "joined" : "not joined" }}
          </span>
        </div>

        <div class="net-row small">
          Open on mobile:
          <!-- <code>{{ controllerUrl }}</code> -->
          <div class="net-row small qr-wrap">
  <div class="qr-card">
    <div class="qr-title">Scan to open controller</div>
    <QrcodeVue :value="controllerUrl" :size="170" level="M" />
  </div>
</div>

        </div>

        <!-- <div class="net-row small" v-if="lastError">
          Error: <code>{{ lastError }}</code>
        </div>

        <div class="net-row small">
          Zoom: <code>{{ camCtrl.zoom.toFixed(2) }}x</code> • FPV tilt:
          <code>{{ camCtrl.fpvTilt.toFixed(2) }}</code>
        </div>

        <div class="net-row small">
          Battery: <code>{{ telemetry.battery }}%</code> • Signal:
          <code>{{ telemetry.signal }}/4</code>
        </div>

        <div class="net-row small">
          Collision radius: <code>{{ DRONE_RADIUS }}</code>
        </div>
        <div class="net-row small">
          Collisions: <code>{{ collisionsReady ? "ready" : "off" }}</code>
        </div>
        <div class="net-row small">
          Sound: <code>{{ soundEnabled ? "enabled" : "tap to enable" }}</code>
        </div> -->
      </div>
    </div>

    <!-- CONTROLLER UI (mobile) -->
    <div class="controller-root" v-if="isControllerMode">
      <div class="Mobilelogo">
        <img src="/logo.png" class="brand-logo" />
        <h3>DRONE CONTROLLER</h3>
          <div class="roomline">
            Room <b>{{ roomCode }}</b> •
            <span :class="{ ok: socketConnected }">
              {{ socketConnected ? "connected" : "disconnected" }}
            </span>
          </div>
      </div>
      
      <div class="rotate-overlay">
  <div class="rotate-card">
    <div class="rotate-title">Rotate your phone</div>
    <div class="rotate-sub">Landscape mode is required for the controller.</div>
  </div>
</div>
      <div class="controller-hud-top">
        <div class="hud-left">
          <button class="chip-btn" type="button" @click="toggleViewMobile">
            View: <b>{{ cameraModeLabel }}</b>
          </button>

          <div class="sliders">
            <label class="slider-line">
              <span>Zoom</span>
              <input
                type="range"
                min="0.6"
                max="2.0"
                step="0.01"
                v-model.number="camCtrl.zoom"
                @input="sendCamControlThrottled(true)"
              />
              <b>{{ camCtrl.zoom.toFixed(2) }}x</b>
            </label>

            <label class="slider-line">
              <span>Look</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                v-model.number="camCtrl.fpvTilt"
                @input="sendCamControlThrottled(true)"
              />
              <b>{{ camCtrl.fpvTilt.toFixed(2) }}</b>
            </label>
          </div>

          

          <div class="errline" v-if="lastError">
            Error: <span class="err">{{ lastError }}</span>
          </div>
        </div>

        <div class="hud-right">
          <div class="tele-card">
            <div class="tele-row">
              <span class="tlabel">Battery</span>
              <b class="tval">{{ telemetry.battery }}%</b>
            </div>
            <div class="battery">
              <div class="battery-fill" :style="{ width: telemetry.battery + '%' }"></div>
            </div>

            <div class="tele-row" style="margin-top: 8px">
              <span class="tlabel">Signal</span>
              <b class="tval">{{ telemetry.signal }}/4</b>
            </div>
            <div class="signal">
              <span
                v-for="i in 4"
                :key="i"
                class="bar"
                :class="{ on: i <= telemetry.signal }"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom sticks -->
      <div class="mobile-controls">
        <div
          class="stick-zone left"
          ref="leftZone"
          @pointerdown="onStickDown($event, 'left')"
          @pointermove="onStickMove($event, 'left')"
          @pointerup="onStickUp($event, 'left')"
          @pointercancel="onStickUp($event, 'left')"
        >
          <div class="stick-base"></div>
          <div class="stick-hat" :style="leftHatStyle"></div>
          <div class="stick-label">Yaw / Alt</div>
        </div>

        <div
          class="stick-zone right"
          ref="rightZone"
          @pointerdown="onStickDown($event, 'right')"
          @pointermove="onStickMove($event, 'right')"
          @pointerup="onStickUp($event, 'right')"
          @pointercancel="onStickUp($event, 'right')"
        >
          <div class="stick-base"></div>
          <div class="stick-hat" :style="rightHatStyle"></div>
          <div class="stick-label">Move</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as THREE from "three";
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { io } from "socket.io-client";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { Octree } from "three/examples/jsm/math/Octree.js";
import QrcodeVue from "qrcode.vue";


/**
 * IMPORTANT: replace with your PC LAN IP.
 * Example: http://192.168.1.20:3001
 */
/////const SERVER_IP = "http://192.168.11.223:3001"; // <-- CHANGE THIS



/* ---------- URL mode ---------- */
// const qs =
//   typeof window !== "undefined"
//     ? new URLSearchParams(window.location.search)
//     : null;

// const isControllerMode =
//   typeof window !== "undefined" && qs?.get("controller") === "1";

// const roomCode = (qs?.get("room") || "MIMAR").toUpperCase();

/* ---------- Auto-Detect IP & URL Setup ---------- */
const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const isControllerMode = typeof window !== "undefined" && qs?.get("controller") === "1";
const roomCode = (qs?.get("room") || "MIMAR").toUpperCase();

// Automatically extract the current hostname (e.g., "192.168.11.223" or "localhost")
const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
// 2. SMART FALLBACK: If browser is on localhost/127.0.0.1, we hardcode your fallback local network IP here
if (currentHost === "localhost" || currentHost === "127.0.0.1") {
  // Replace this with your actual machine IP so mobile works even if you visit localhost on PC!
  currentHost = "192.168.11.223"; 
}
const currentPort = typeof window !== "undefined" ? window.location.port : "5173";

// Point to the backend server on port 3001 using the detected host
const SERVER_IP = `http://${currentHost}:3001`;

/* ---------- DOM refs ---------- */
const canvas = ref(null);
const leftZone = ref(null);
const rightZone = ref(null);

/* ---------- Socket state ---------- */
const socketConnected = ref(false);
const controllerJoined = ref(false);
const lastError = ref("");

const socket = io(SERVER_IP);

const netInput = reactive({
  forward: 0,
  strafe: 0,
  up: 0,
  yaw: 0,
});

/* ✅ Telemetry (viewer -> controller) */
const telemetry = reactive({
  battery: 100,
  signal: 4,
});

/* ✅ Camera controls (controller -> viewer) */
const camCtrl = reactive({
  zoom: 1.0, // 0.6..2.0
  fpvTilt: 0.0, // -1..+1
});

// const controllerUrl = computed(() => {
//   if (typeof window === "undefined") return "";
//   return `http://192.168.11.223:5173/?controller=1&room=${roomCode}`; //here i changed the IpAdress
// });

const controllerUrl = computed(() => {
  if (typeof window === "undefined") return "";
  // Generates link keeping the matchable host IP and port active
  return `http://${currentHost}:${currentPort}/?controller=1&room=${roomCode}`;
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = (v) => clamp(v, 0, 1);

/* ---------- Mobile view toggle ---------- */
const toggleViewMobile = () => {
  if (!isControllerMode) return;
  if (!socketConnected.value) return;
  socket.emit("toggle_camera", { roomCode });
};

/* =========================================================
   LOADING OVERLAY
   ========================================================= */
const showLoading = ref(true);
const loadingPct = ref(0);
const loadingLabel = ref("Starting…");

const loadProg = reactive({ hdr: 0, env: 0, drone: 0 });
const LOAD_WEIGHTS = { hdr: 0.2, env: 0.5, drone: 0.3 };

const setStage = (label) => (loadingLabel.value = label);

const recomputeLoading = () => {
  const w = LOAD_WEIGHTS;
  const totalW = w.hdr + w.env + w.drone;
  const p =
    (loadProg.hdr * w.hdr + loadProg.env * w.env + loadProg.drone * w.drone) /
    totalW;
  loadingPct.value = Math.round(clamp01(p) * 100);
};

const finishLoading = () => {
  loadingPct.value = 100;
  setStage("Done");
  setTimeout(() => (showLoading.value = false), 250);
};

/* =========================================================
   CONTROLLER: MULTI-TOUCH sticks
   ========================================================= */
const joy = reactive({
  left: { x: 0, y: 0, active: false, pid: null, cx: 0, cy: 0 },
  right: { x: 0, y: 0, active: false, pid: null, cx: 0, cy: 0 },
});

const STICK_RADIUS = 55;
const DEAD_ZONE = 0.2;

const getZone = (which) => (which === "left" ? leftZone.value : rightZone.value);

const setCenterFromZone = (which) => {
  const zone = getZone(which);
  if (!zone) return;
  const r = zone.getBoundingClientRect();
  joy[which].cx = r.left + r.width / 2;
  joy[which].cy = r.top + r.height / 2;
};

const applyDeadZone = (v) => {
  const mag = Math.abs(v);
  if (mag < DEAD_ZONE) return 0;
  const sign = Math.sign(v);
  const scaled = (mag - DEAD_ZONE) / (1 - DEAD_ZONE);
  return sign * clamp(scaled, 0, 1);
};

const updateJoyFromClientXY = (which, clientX, clientY) => {
  const j = joy[which];
  const dx = clientX - j.cx;
  const dy = clientY - j.cy;

  const dist = Math.hypot(dx, dy);
  const k = dist > STICK_RADIUS ? STICK_RADIUS / dist : 1;

  let nx = (dx * k) / STICK_RADIUS;
  let ny = (dy * k) / STICK_RADIUS;

  nx = applyDeadZone(nx);
  ny = applyDeadZone(ny);

  j.x = clamp(nx, -1, 1);
  j.y = clamp(ny, -1, 1);
};

const onStickDown = (e, which) => {
  e.preventDefault?.();
  const j = joy[which];
  if (j.active) return;

  j.active = true;
  j.pid = e.pointerId;

  setCenterFromZone(which);
  updateJoyFromClientXY(which, e.clientX, e.clientY);

  e.currentTarget.setPointerCapture?.(e.pointerId);

  if (isControllerMode) sendInputThrottled(true);
};

const onStickMove = (e, which) => {
  const j = joy[which];
  if (!j.active || j.pid !== e.pointerId) return;
  e.preventDefault?.();
  updateJoyFromClientXY(which, e.clientX, e.clientY);
  if (isControllerMode) sendInputThrottled(false);
};

const onStickUp = (e, which) => {
  const j = joy[which];
  if (j.pid !== e.pointerId) return;

  j.active = false;
  j.pid = null;
  j.x = 0;
  j.y = 0;

  e.preventDefault?.();
  if (isControllerMode) sendInputThrottled(true);
};

const leftHatStyle = computed(() => ({
  transform: `translate(${joy.left.x * STICK_RADIUS}px, ${joy.left.y * STICK_RADIUS}px)`,
}));
const rightHatStyle = computed(() => ({
  transform: `translate(${joy.right.x * STICK_RADIUS}px, ${joy.right.y * STICK_RADIUS}px)`,
}));

/* ---------- Controller send: movement ---------- */
let lastSend = 0;
const SEND_INTERVAL_MS = 30;

/**
 * ✅ Some phones report stick up as negative Y (correct).
 * We send forward as +1 when stick is up.
 */
const buildInputPacket = () => ({
  forward: clamp(-joy.right.y, -1, 1),
  strafe: clamp(joy.right.x, -1, 1),
  up: clamp(-joy.left.y, -1, 1),
  yaw: clamp(joy.left.x, -1, 1),
});

const sendInputThrottled = (force) => {
  if (!isControllerMode) return;
  if (!socketConnected.value) return;

  const now = performance.now();
  if (!force && now - lastSend < SEND_INTERVAL_MS) return;
  lastSend = now;

  socket.emit("control_input", {
    roomCode,
    input: buildInputPacket(),
  });
};

/* ---------- Controller send: camera controls ---------- */
let lastCamSend = 0;
const CAM_SEND_INTERVAL_MS = 40;

const sendCamControlThrottled = (force = false) => {
  if (!isControllerMode) return;
  if (!socketConnected.value) return;

  const now = performance.now();
  if (!force && now - lastCamSend < CAM_SEND_INTERVAL_MS) return;
  lastCamSend = now;

  socket.emit("camera_control", {
    roomCode,
    zoom: camCtrl.zoom,
    fpvTilt: camCtrl.fpvTilt,
  });
};

/* ✅ Controller heartbeat */
let controllerLoopId = null;

const startControllerHeartbeat = () => {
  if (!isControllerMode) return;
  stopControllerHeartbeat();
  controllerLoopId = setInterval(() => {
    sendInputThrottled(false);
    sendCamControlThrottled(false);
  }, 50);
};

const stopControllerHeartbeat = () => {
  if (controllerLoopId) clearInterval(controllerLoopId);
  controllerLoopId = null;
};

/* ---------- Socket init ---------- */
const initSocket = () => {
  socket.on("connect", () => {
    socketConnected.value = true;
    lastError.value = "";

    if (isControllerMode) {
      socket.emit("join_room", roomCode, (res) => {
        if (!res?.ok) lastError.value = res?.error || "join_room failed";
        sendInputThrottled(true);
        sendCamControlThrottled(true);
      });
    } else {
      socket.emit("create_room", roomCode, (res) => {
        if (!res?.ok) lastError.value = "create_room failed";
      });
    }
  });

  socket.on("disconnect", () => {
    socketConnected.value = false;
    controllerJoined.value = false;
  });

  socket.on("connect_error", (err) => {
    lastError.value = err?.message || "connect_error";
    socketConnected.value = false;
  });

  socket.on("controller_joined", () => {
    controllerJoined.value = true;
    netInput.forward = 0;
    netInput.strafe = 0;
    netInput.up = 0;
    netInput.yaw = 0;
  });

  socket.on("controller_left", () => {
    controllerJoined.value = false;
    netInput.forward = 0;
    netInput.strafe = 0;
    netInput.up = 0;
    netInput.yaw = 0;
  });

  socket.on("control_input", ({ input }) => {
    netInput.forward = clamp(input?.forward ?? 0, -1, 1);
    netInput.strafe = clamp(input?.strafe ?? 0, -1, 1);
    netInput.up = clamp(input?.up ?? 0, -1, 1);
    netInput.yaw = clamp(input?.yaw ?? 0, -1, 1);
  });

  socket.on("camera_mode", ({ fpv }) => {
    CAMERA_MODE.fpv = !!fpv;
    activeCamera = CAMERA_MODE.fpv ? cameraFPV : cameraTPV;

    if (listener && activeCamera) {
      try {
        cameraTPV?.remove(listener);
        cameraFPV?.remove(listener);
        activeCamera.add(listener);
      } catch {}
    }
  });

  socket.on("camera_control", ({ zoom, fpvTilt }) => {
    camCtrl.zoom = clamp(zoom ?? 1.0, 0.6, 2.0);
    camCtrl.fpvTilt = clamp(fpvTilt ?? 0.0, -1, 1);
  });

  socket.on("telemetry", (t) => {
    telemetry.battery = clamp(Math.round(t?.battery ?? 100), 0, 100);
    telemetry.signal = clamp(Math.round(t?.signal ?? 4), 0, 4);
  });
};

/* =========================================================
   VIEWER (Three.js) + COLLISIONS + FPV MOUNT
   ========================================================= */
let scene, renderer;

let cameraTPV = null;
let cameraFPV = null;
let activeCamera = null;

let baseTPVFov = 70;
let baseFPVFov = 85;

let drone = null;
let environment = null;
let mixer = null;
let hoverAction = null;
let frameId = null;

const clock = new THREE.Clock();
const keys = {};

// camera mode
const CAMERA_MODE = reactive({ fpv: false });
let lastCamToggle = 0;
const CAM_TOGGLE_COOLDOWN_MS = 200;
const cameraModeLabel = computed(() => (CAMERA_MODE.fpv ? "FPV" : "TPV"));

const onKeyDown = (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === "c" && !isControllerMode) {
    const now = performance.now();
    if (now - lastCamToggle > CAM_TOGGLE_COOLDOWN_MS) {
      lastCamToggle = now;
      CAMERA_MODE.fpv = !CAMERA_MODE.fpv;
      activeCamera = CAMERA_MODE.fpv ? cameraFPV : cameraTPV;

      if (listener && activeCamera) {
        try {
          cameraTPV?.remove(listener);
          cameraFPV?.remove(listener);
          activeCamera.add(listener);
        } catch {}
      }
    }
  }
};
const onKeyUp = (e) => (keys[e.key.toLowerCase()] = false);

const velocity = new THREE.Vector3();

const MOVE_SPEED = 100;
const ROTATE_SPEED = 5;
const DAMPING = 0.9;
const STRAFE_ON_KEYBOARD = false;

// TPV
const cameraOffset = new THREE.Vector3(0, 2.5, 6);
const cameraTarget = new THREE.Vector3();
const tmpOffset = new THREE.Vector3();

// FPV fallback offsets
const FPV_POS_LOCAL_FALLBACK = new THREE.Vector3(0, 0.35, 0.15);
const FPV_LOOK_LOCAL_FALLBACK = new THREE.Vector3(0, 0.25, -6);
const FPV_UP_LOCAL_FALLBACK = new THREE.Vector3(0, 1, 0);

// FPV mount
let fpvMount = null;
const fpvTiltPivot = new THREE.Object3D();
const FPV_TILT_MAX_RAD = THREE.MathUtils.degToRad(35);
const _tmpLook = new THREE.Vector3();
const _tiltQuat = new THREE.Quaternion();
const _rightAxis = new THREE.Vector3(1, 0, 0);

let pmrem = null;
let envMap = null;

// collisions
const worldOctree = new Octree();
const collisionsReady = ref(false);
const DRONE_RADIUS = 0.6;
const droneCollider = new THREE.Sphere(new THREE.Vector3(0, 1.5, 0), DRONE_RADIUS);

/* =========================
   SOUND
   ========================= */
const soundEnabled = ref(false);

let listener = null;
let audioLoader = null;
let sfxProp = null;
let sfxCrash = null;

let lastCrashTime = 0;
const CRASH_COOLDOWN_MS = 150;

const PROP_BASE_VOL = 0.04;
const PROP_MAX_VOL = 0.22;
const PROP_BASE_RATE = 0.9;
const PROP_MAX_RATE = 1.6;

const unlockAudio = async () => {
  if (!listener) return;
  try {
    const ctx = listener.context;
    if (ctx.state !== "running") await ctx.resume();
    soundEnabled.value = true;
    if (sfxProp?.buffer && !sfxProp.isPlaying) sfxProp.play();
  } catch (e) {
    console.warn("Audio unlock failed:", e);
  }
};

const initAudio = () => {
  if (!activeCamera) return;

  listener = new THREE.AudioListener();
  activeCamera.add(listener);

  audioLoader = new THREE.AudioLoader();

  sfxProp = new THREE.Audio(listener);
  sfxProp.setLoop(true);
  sfxProp.setVolume(PROP_BASE_VOL);

  sfxCrash = new THREE.Audio(listener);
  sfxCrash.setLoop(false);
  sfxCrash.setVolume(0.35);

  audioLoader.load("/sfx/SW_DronePropellers.WAV", (buf) => sfxProp.setBuffer(buf));
  audioLoader.load("/sfx/SW_DroneCrash.WAV", (buf) => sfxCrash.setBuffer(buf));

  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
};

const updateAudio = () => {
  if (!soundEnabled.value || !sfxProp) return;
  const speed = velocity.length();
  const t = clamp(speed / 35, 0, 1);
  const vol = PROP_BASE_VOL + (PROP_MAX_VOL - PROP_BASE_VOL) * t;
  const rate = PROP_BASE_RATE + (PROP_MAX_RATE - PROP_BASE_RATE) * t;
  sfxProp.setVolume(vol);
  if (sfxProp.source?.playbackRate) sfxProp.source.playbackRate.value = rate;
  if (sfxProp.buffer && !sfxProp.isPlaying) sfxProp.play();
};

const playCrashSound = (impact = 1) => {
  if (!soundEnabled.value || !sfxCrash?.buffer) return;
  const now = performance.now();
  if (now - lastCrashTime < CRASH_COOLDOWN_MS) return;
  lastCrashTime = now;

  const vol = clamp(0.15 + impact * 0.5, 0.15, 0.8);
  sfxCrash.setVolume(vol);

  if (sfxCrash.isPlaying) sfxCrash.stop();
  sfxCrash.play();
};

/* ---- Collisions ---- */
const resolveCollisions = () => {
  if (!collisionsReady.value) return;
  const result = worldOctree.sphereIntersect(droneCollider);
  if (!result) return;

  playCrashSound(clamp(result.depth / 0.25, 0, 1));
  droneCollider.center.addScaledVector(result.normal, result.depth);

  const vn = velocity.dot(result.normal);
  if (vn < 0) velocity.addScaledVector(result.normal, -vn);
};

/* ✅ Apply zoom (FOV zoom) */
const applyZoomToCamera = () => {
  if (!cameraTPV || !cameraFPV) return;
  const z = clamp(camCtrl.zoom, 0.6, 2.0);
  cameraTPV.fov = clamp(baseTPVFov / z, 25, 95);
  cameraFPV.fov = clamp(baseFPVFov / z, 25, 110);
  cameraTPV.updateProjectionMatrix();
  cameraFPV.updateProjectionMatrix();
};

/* =========================
   ✅ BATTERY + SIGNAL SIM
   ========================= */
const BATTERY_TOTAL_MS = 5 * 60 * 1000; // 5 minutes
const BATTERY_DRAIN_PER_SEC = 100 / (BATTERY_TOTAL_MS / 1000); // linear % per sec

const HOME_POS = new THREE.Vector3(0, 1.5, 0);

const SIGNAL_GOOD_RADIUS = 30;  // 4 bars inside
const SIGNAL_MAX_RADIUS = 180;  // 0 bars beyond

let batteryStartMs = 0;
let simBattery = 100;

let lastTelemSend = 0;
const TELEMETRY_INTERVAL_MS = 250;

const computeSignalBars = (dist) => {
  if (dist <= SIGNAL_GOOD_RADIUS) return 4;
  if (dist >= SIGNAL_MAX_RADIUS) return 0;
  const t = (dist - SIGNAL_GOOD_RADIUS) / (SIGNAL_MAX_RADIUS - SIGNAL_GOOD_RADIUS); // 0..1
  const bars = Math.round(4 * (1 - t)); // 4..0
  return clamp(bars, 0, 4);
};

const emitTelemetryIfNeeded = () => {
  if (isControllerMode) return;
  if (!socketConnected.value) return;
  if (!drone) return;

  const now = performance.now();
  if (now - lastTelemSend < TELEMETRY_INTERVAL_MS) return;
  lastTelemSend = now;

  // ✅ Battery: 100% -> 0% in exactly 5 minutes (slow)
  const elapsedSec = Math.max(0, (now - batteryStartMs) / 1000);
  simBattery = clamp(100 - elapsedSec * BATTERY_DRAIN_PER_SEC, 0, 100);

  // ✅ Signal: based on distance from HOME_POS
  const dist = drone.position.distanceTo(HOME_POS);
  const signal = computeSignalBars(dist);
  socket.emit("telemetry", {
    roomCode,
    battery: Math.round(simBattery),
    signal,
  });
};

const initViewer = async () => {
  showLoading.value = true;
  loadingPct.value = 0;
  loadingLabel.value = "Starting…";
  loadProg.hdr = 0;
  loadProg.env = 0;
  loadProg.drone = 0;

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.physicallyCorrectLights = true;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  canvas.value.appendChild(renderer.domElement);

  cameraTPV = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
  cameraFPV = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.05, 2000);

  baseTPVFov = cameraTPV.fov;
  baseFPVFov = cameraFPV.fov;

  activeCamera = cameraTPV;
  initAudio();

  pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  setStage("Loading lighting…");
  await new Promise((resolve) => {
    new RGBELoader().load(
      "/qwantani_noon_puresky_4k.hdr",
      (hdr) => {
        envMap = pmrem.fromEquirectangular(hdr).texture;
        scene.environment = envMap;
        scene.background = envMap;
        hdr.dispose();
        loadProg.hdr = 1;
        recomputeLoading();
        resolve();
      },
      (xhr) => {
        if (xhr?.total) {
          loadProg.hdr = clamp01(xhr.loaded / xhr.total);
          recomputeLoading();
        }
      },
      () => {
        scene.background = new THREE.Color(0x000000);
        loadProg.hdr = 1;
        recomputeLoading();
        resolve();
      }
    );
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 150;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  scene.add(sun);

  await loadEnvironment();
  await loadDrone();

  // ✅ start battery timer when sim is ready
  batteryStartMs = performance.now();
  simBattery = 100;

  finishLoading();

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  cameraTPV.position.set(0, 3, 8);

  animate();
};

const safeBuildOctree = (root) => {
  const safeRoot = root.clone(true);
  safeRoot.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    const pos = g?.attributes?.position;
    if (!g || !pos) obj.visible = false;
  });

  safeRoot.updateMatrixWorld(true);
  worldOctree.clear();
  worldOctree.fromGraphNode(safeRoot);
};

const loadEnvironment = async () => {
  setStage("Loading environment…");
  const loader = new GLTFLoader();

  const gltf = await new Promise((resolve, reject) => {
    loader.load("/droneEnv001.glb", resolve, undefined, reject);
  });

  environment = gltf.scene;
  environment.position.set(0, 0, 0);
  environment.rotation.set(0, 0, 0);
  environment.scale.set(2, 2, 2);

  environment.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const mat = obj.material;
    if (mat?.map) mat.map.colorSpace = THREE.SRGBColorSpace;
    if (mat) mat.needsUpdate = true;
  });

  scene.add(environment);

  environment.updateMatrixWorld(true);
  environment.matrixAutoUpdate = false;

  collisionsReady.value = false;

  await new Promise((resolve) => {
    setTimeout(() => {
      try {
        safeBuildOctree(environment);
        collisionsReady.value = true;
      } catch (e) {
        collisionsReady.value = false;
        lastError.value = `Octree build failed: ${e?.message || e}`;
      } finally {
        loadProg.env = 1;
        recomputeLoading();
        resolve();
      }
    }, 0);
  });
};

const findFpvMount = (root) => {
  let best = null;
  root.traverse((obj) => {
    const name = (obj.name || "").toLowerCase();
    if (obj.isCamera) best = best || obj;
    if (!best && (name.includes("fpv") || name.includes("camera") || name.includes("cam")))
      best = obj;
  });
  return best;
};

const applyFpvFixRotation = () => {
  cameraFPV.rotation.set(0, 0, 0);
  cameraFPV.rotation.order = "YXZ";
  cameraFPV.rotateY(Math.PI);
  cameraFPV.up.set(0, 1, 0);
};

const attachFpvCameraToDrone = () => {
  if (!drone || !cameraFPV) return;

  try {
    fpvTiltPivot.parent?.remove(fpvTiltPivot);
    cameraFPV.parent?.remove(cameraFPV);
  } catch {}

  fpvMount = findFpvMount(drone);

  if (fpvMount) {
    fpvMount.add(fpvTiltPivot);
    fpvTiltPivot.position.set(0, 0, 0);
    fpvTiltPivot.rotation.set(0, 0, 0);

    fpvTiltPivot.add(cameraFPV);
    cameraFPV.position.set(0, 0, 0);

    applyFpvFixRotation();
    return;
  }

  drone.add(fpvTiltPivot);
  fpvTiltPivot.position.copy(FPV_POS_LOCAL_FALLBACK);
  fpvTiltPivot.rotation.set(0, 0, 0);

  fpvTiltPivot.add(cameraFPV);
  cameraFPV.position.set(0, 0, 0);

  applyFpvFixRotation();
};

const loadDrone = async () => {
  setStage("Loading drone…");
  const loader = new GLTFLoader();

  const gltf = await new Promise((resolve, reject) => {
    loader.load("/Drone.glb", resolve, undefined, reject);
  });

  drone = gltf.scene;

  // spawn
  drone.position.copy(HOME_POS);
  drone.rotation.set(0, 0, 0);

  droneCollider.center.copy(drone.position);
  droneCollider.radius = DRONE_RADIUS;

  drone.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const mat = obj.material;
    if (mat?.map) mat.map.colorSpace = THREE.SRGBColorSpace;
    if (mat) mat.needsUpdate = true;
  });

  scene.add(drone);

  attachFpvCameraToDrone();

  const clips = gltf.animations || [];
  const hoverClip = THREE.AnimationClip.findByName(clips, "hover");
  if (hoverClip) {
    mixer = new THREE.AnimationMixer(drone);
    hoverAction = mixer.clipAction(hoverClip);
    hoverAction.setLoop(THREE.LoopRepeat, Infinity);
    hoverAction.play();
  }

  loadProg.drone = 1;
  recomputeLoading();
};

/* =========================================================
   ✅ CLEAN CONTROLS (no per-frame allocations)
   ========================================================= */
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

const updateControls = (delta) => {
  if (!drone) return;

  let kbForward = 0;
  if (keys["w"]) kbForward += 1;
  if (keys["s"]) kbForward -= 1;

  let kbUp = 0;
  if (keys["e"]) kbUp += 1;
  if (keys["q"]) kbUp -= 1;

  let kbYaw = 0;
  if (keys["a"]) kbYaw += 1;
  if (keys["d"]) kbYaw -= 1;

  let kbStrafe = 0;
  if (STRAFE_ON_KEYBOARD) {
    if (keys["d"]) kbStrafe += 1;
    if (keys["a"]) kbStrafe -= 1;
  }

  const forward = clamp(kbForward + netInput.forward, -1, 1);
  const strafe = clamp(kbStrafe + netInput.strafe, -1, 1);
  const up = clamp(kbUp + netInput.up, -1, 1);
  const yaw = clamp(kbYaw + netInput.yaw, -1, 1);

  // yaw
  drone.rotation.y += -yaw * ROTATE_SPEED * delta;

  // facing direction (world)
  drone.getWorldDirection(_fwd).normalize();

  // ✅ model faces opposite => invert
  _fwd.negate();

  // right = fwd x up
  _right.crossVectors(_fwd, _up).normalize();

  _move.set(0, 0, 0);
  _move.addScaledVector(_fwd, forward);
  _move.addScaledVector(_right, strafe);
  _move.addScaledVector(_up, up);

  if (_move.lengthSq() > 1e-6) _move.normalize();

  velocity.addScaledVector(_move, MOVE_SPEED * delta);

  droneCollider.center.addScaledVector(velocity, delta);
  resolveCollisions();

  drone.position.copy(droneCollider.center);

  const dampingFactor = Math.pow(DAMPING, delta * 60);
  velocity.multiplyScalar(dampingFactor);
};

const updateCamera = (delta) => {
  if (!drone || !cameraTPV || !cameraFPV) return;

  if (!CAMERA_MODE.fpv) {
    tmpOffset.copy(cameraOffset).applyQuaternion(drone.quaternion);
    const desiredPos = drone.position.clone().add(tmpOffset);

    const followSpeed = 1 - Math.pow(0.001, delta);
    cameraTPV.position.lerp(desiredPos, followSpeed);

    cameraTarget.copy(drone.position);
    cameraTarget.y += 1.2;
    cameraTPV.lookAt(cameraTarget);
    return;
  }

  fpvTiltPivot.rotation.x = camCtrl.fpvTilt * FPV_TILT_MAX_RAD;

  if (!fpvMount) {
    _tmpLook.copy(FPV_LOOK_LOCAL_FALLBACK);
    const tiltRad = camCtrl.fpvTilt * FPV_TILT_MAX_RAD;
    _tiltQuat.setFromAxisAngle(_rightAxis, tiltRad);
    _tmpLook.applyQuaternion(_tiltQuat);

    const lookWorld = _tmpLook.clone().applyQuaternion(drone.quaternion).add(drone.position);

    cameraFPV.up.copy(FPV_UP_LOCAL_FALLBACK).applyQuaternion(drone.quaternion);
    cameraFPV.lookAt(lookWorld);
  }
};

const animate = () => {
  frameId = requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const steps = 3;
  const stepDelta = delta / steps;

  for (let i = 0; i < steps; i++) {
    if (mixer) mixer.update(stepDelta);
    updateControls(stepDelta);
    updateCamera(stepDelta);
  }

  updateAudio();
  applyZoomToCamera();
  emitTelemetryIfNeeded();

  renderer.render(scene, activeCamera || cameraTPV);
};

const onResize = () => {
  if (!renderer || (!cameraTPV && !cameraFPV)) return;

  const aspect = window.innerWidth / window.innerHeight;

  if (cameraTPV) {
    cameraTPV.aspect = aspect;
    cameraTPV.updateProjectionMatrix();
  }

  if (cameraFPV) {
    cameraFPV.aspect = aspect;
    cameraFPV.updateProjectionMatrix();
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  setCenterFromZone("left");
  setCenterFromZone("right");
};

const disposeObject = (obj) => {
  obj.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry?.dispose?.();
    const mat = child.material;
    const disposeMaterial = (m) => {
      if (!m) return;
      for (const key in m) {
        const val = m[key];
        if (val && val.isTexture) val.dispose();
      }
      m.dispose?.();
    };
    if (Array.isArray(mat)) mat.forEach(disposeMaterial);
    else disposeMaterial(mat);
  });
};

/* ---------- Lifecycle ---------- */
onMounted(async () => {
  document.body.style.overscrollBehavior = "none";
  document.body.style.touchAction = "none";

  initSocket();

  requestAnimationFrame(() => {
    setCenterFromZone("left");
    setCenterFromZone("right");
  });

  if (!isControllerMode) {
    await initViewer();
  } else {
    startControllerHeartbeat();
    window.addEventListener("resize", onResize);
  }
});

onUnmounted(() => {
  if (frameId) cancelAnimationFrame(frameId);

  stopControllerHeartbeat();

  window.removeEventListener("resize", onResize);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);

  socket.off();
  socket.disconnect();

  if (hoverAction) hoverAction.stop();
  if (mixer) mixer.stopAllAction();

  if (drone) disposeObject(drone);
  if (environment) disposeObject(environment);

  if (envMap) envMap.dispose?.();
  if (pmrem) pmrem.dispose?.();

  try {
    if (sfxProp?.isPlaying) sfxProp.stop();
    if (sfxCrash?.isPlaying) sfxCrash.stop();
    if (listener) {
      cameraTPV?.remove(listener);
      cameraFPV?.remove(listener);
    }
  } catch {}

  listener = null;
  audioLoader = null;
  sfxProp = null;
  sfxCrash = null;

  renderer?.dispose?.();

  if (canvas.value && renderer?.domElement?.parentNode === canvas.value) {
    canvas.value.removeChild(renderer.domElement);
  }

  drone = null;
  environment = null;
  scene = null;
  cameraTPV = null;
  cameraFPV = null;
  activeCamera = null;
  renderer = null;

  document.body.style.overscrollBehavior = "";
  document.body.style.touchAction = "";
});
</script>
<style scoped>
/* =========================
   GLOBAL
   ========================= */
:global(html),
:global(body) {
  height: 100%;
  overscroll-behavior: none;
  touch-action: none;
}

.scene {
  width: 100vw;
  height: 100dvh; /* ✅ iOS Safari correct viewport */
  height: 100svh;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: black;
  touch-action: none;
}

/* =========================
   LOADING UI
   ========================= */
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: url("/Mimar studios.png") center / cover no-repeat;
  backdrop-filter: blur(6px);
}

.loading-card {
  width: min(520px, calc(100vw - 48px));
  padding: 16px 16px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(18, 18, 18, 0.55);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55);
}

.loading-title {
  color: white;
  font-weight: 800;
  letter-spacing: 0.4px;
  margin-bottom: 12px;
  font-size: 14px;
  text-transform: uppercase;
  opacity: 0.95;
}

.loading-bar {
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(124, 255, 178, 0.9),
    rgba(80, 170, 255, 0.9)
  );
  transition: width 0.12s ease;
}

.loading-meta {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
}

/* =========================
   VIEWER UI
   ========================= */
.ui-overlay {
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 10;
  pointer-events: none;
  color: white;
}

.brand-logo {
  width: 140px;
  margin-bottom: 10px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

.ui-title {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.ui-description {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
  max-width: 560px;
}

.net-panel {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(6px);
  max-width: 740px;
}

.net-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
  line-height: 1.5;
}

.net-row.small {
  margin-top: 6px;
  opacity: 0.85;
  display: block;
}

.label {
  opacity: 0.7;
  min-width: 90px;
}

.value.ok {
  color: #7cffb2;
}

.err {
  color: #ff8080;
}

code {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 6px;
}

/* =========================================
   CONTROLLER (CSS ONLY) — DJI-like HUD style
   (NO TEMPLATE CHANGES)
   ========================================= */

.controller-root{
  position:absolute;
  inset:0;
  z-index:50;
  color:#fff;
  height:100dvh;
  height:100svh;
  height:100vh;
  overscroll-behavior:none;
  touch-action:none;

  /* tuning */
  --pad: 14px;
  --glass: rgba(0,0,0,.30);
  --stroke: rgba(255,255,255,.18);
  --glow: rgba(124,255,178,.55);
  --accent: rgba(92, 255, 240, .9);
  --danger: rgba(255, 90, 90, .95);
}

/* ---------- portrait lock overlay (kept) ---------- */
.rotate-overlay{
  position:absolute;
  inset:0;
  z-index:9999;
  display:none;
  place-items:center;
  background:rgba(0,0,0,.92);
  padding:18px;
}
@media (orientation:portrait){
  .rotate-overlay{ display:grid; }
  .controller-hud-top,
  .mobile-controls,
  .Mobilelogo{ display:none !important; }
}
.rotate-card{
  width:min(420px,92vw);
  border-radius:16px;
  border:1px solid rgba(255,255,255,.16);
  background:rgba(18,18,18,.65);
  backdrop-filter: blur(10px);
  padding:16px;
  text-align:center;
}
.rotate-title{ font-weight:900; font-size:16px; margin-bottom:6px; }
.rotate-sub{ opacity:.8; font-size:13px; line-height:1.4; }

/* ---------- logo block: top-left, thin ---------- */
.Mobilelogo{
  position:absolute;
  top: calc(env(safe-area-inset-top,0px) + var(--pad));
  left: calc(env(safe-area-inset-left,0px) + var(--pad));
  z-index:70;

  display:flex;
  align-items:center;
  gap:10px;

  padding:10px 12px;
  border-radius:18px;
  border:1px solid var(--stroke);
  background: var(--glass);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(0,0,0,.35);
  pointer-events:none;
}
.Mobilelogo img.brand-logo{ width:72px; margin:0; }
.Mobilelogo h3{
  margin:0;
  font-size:13px;
  letter-spacing:2px;
  opacity:.92;
  text-transform:uppercase;
}

/* ---------- top HUD layout ---------- */
.controller-hud-top{
  position:absolute;
  inset:0;
  z-index:10;
  pointer-events:none;
  transform: translateY(-10px);
}

/* ---------- TELEMETRY: tiny TOP RIGHT like ref ---------- */
.hud-right{
  position:absolute;
  top: calc(env(safe-area-inset-top,0px) + var(--pad));
  right: calc(env(safe-area-inset-right,0px) + var(--pad));
  pointer-events:auto;
}

.tele-card{
  width: 240px;               /* small pill card */
  padding:10px 12px;
  border-radius:18px;
  border:1px solid var(--stroke);
  background: var(--glass);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(0,0,0,.30);
}

.tele-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:12px;
}
.tlabel{ opacity:.78; }
.tval{ font-weight:900; }

.battery{
  margin-top:8px;
  height:7px;
  border-radius:999px;
  background: rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.12);
  overflow:hidden;
}
.battery-fill{
  height:100%;
  background: linear-gradient(90deg, rgba(92,255,240,.85), rgba(124,255,178,.85));
}

.signal{
  margin-top:8px;
  display:flex;
  gap:4px;
  align-items:flex-end;
}
.signal .bar{
  width:8px;
  border-radius:3px;
  background: rgba(255,255,255,.14);
}
.signal .bar:nth-child(1){ height:5px; }
.signal .bar:nth-child(2){ height:8px; }
.signal .bar:nth-child(3){ height:11px; }
.signal .bar:nth-child(4){ height:14px; }
.signal .bar.on{
  background: rgba(124,255,178,.90);
  box-shadow: 0 0 14px rgba(124,255,178,.22);
}

/* ---------- CENTER SLIDERS: short HUD in middle (like ref) ---------- */
.hud-left{
  position:absolute;
  left: 50%;
  top: calc(env(safe-area-inset-top,0px) + var(--pad) + 86px);
  transform: translateX(-50%);
  pointer-events:auto;
  width: min(560px, 52vw); /* not too long */
}

/* sliders panel becomes a centered glass pill */
.sliders{
  margin:0;
  padding:12px 14px;
  border-radius:22px;
  border:1px solid var(--stroke);
  background: var(--glass);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(0,0,0,.30);
}

/* align slider rows like ref */
.slider-line{
  display:grid;
  grid-template-columns: 64px 1fr 64px;
  gap:12px;
  align-items:center;
  font-size:12px;
}
.slider-line + .slider-line{ margin-top:10px; }

.slider-line span{ opacity:.9; }
.slider-line b{ text-align:right; }

/* make range look cleaner */
.slider-line input[type="range"]{
  width:100%;
  height: 22px;
  background: transparent;
  -webkit-appearance:none;
  appearance:none;
}
.slider-line input[type="range"]::-webkit-slider-runnable-track{
  height:6px;
  border-radius:999px;
  background: rgba(255,255,255,.18);
  border:1px solid rgba(255,255,255,.12);
}
.slider-line input[type="range"]::-webkit-slider-thumb{
  -webkit-appearance:none;
  appearance:none;
  width:22px;
  height:22px;
  border-radius:999px;
  background: rgba(255,255,255,.92);
  border:1px solid rgba(0,0,0,.25);
  box-shadow: 0 10px 18px rgba(0,0,0,.35);
  margin-top:-9px;
}
.slider-line input[type="range"]::-moz-range-track{
  height:6px;
  border-radius:999px;
  background: rgba(255,255,255,.18);
  border:1px solid rgba(255,255,255,.12);
}
.slider-line input[type="range"]::-moz-range-thumb{
  width:22px;
  height:22px;
  border-radius:999px;
  background: rgba(255,255,255,.92);
  border:1px solid rgba(0,0,0,.25);
  box-shadow: 0 10px 18px rgba(0,0,0,.35);
}

/* ---------- bottom center Room pill like ref ---------- */

.roomline .ok{ color: rgba(124,255,178,.95); }

/* error pill above room */
.errline{
  position:absolute;
  left:50%;
  bottom: calc(env(safe-area-inset-bottom,0px) + 60px);
  transform: translateX(-50%);
  pointer-events:none;

  margin:0;
  padding:8px 12px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.18);
  background: rgba(0,0,0,.28);
  backdrop-filter: blur(14px);
  font-size:12px;
  opacity:.95;
  white-space:nowrap;
}
.errline .err{ color:#ff8080; }

/* ---------- sticks: bottom corners, slightly up ---------- */
.mobile-controls{
  position:absolute;
  inset:0;
  z-index:55;
  pointer-events:none;
  transform: translateY(-40px);
}

/* raise sticks a bit + keep consistent */
.stick-zone{
  position:absolute;
  bottom: calc(env(safe-area-inset-bottom,0px) + 42px);
  width: min(26vw, 190px);
  height: min(26vw, 190px);
  min-width: 130px;
  min-height: 130px;

  pointer-events:auto;
  touch-action:none;
  user-select:none;
  -webkit-user-select:none;
}

.stick-zone.left{
  left: calc(env(safe-area-inset-left,0px) + 18px);
}
.stick-zone.right{
  right: calc(env(safe-area-inset-right,0px) + 18px);
}

.stick-base{
  position:absolute;
  inset:0;
  border-radius:999px;
  background: rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
}

.stick-hat{
  position:absolute;
  left:50%;
  top:50%;
  width: 48%;
  height: 48%;
  margin-left:-24%;
  margin-top:-24%;
  border-radius:999px;
  background: rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.22);
  box-shadow: 0 14px 30px rgba(0,0,0,.35);
  transition: transform 0.02s linear;
}

.stick-label{
  position:absolute;
  bottom: -18px;
  width:100%;
  text-align:center;
  font-size:11px;
  letter-spacing:1px;
  color: rgba(255,255,255,.65);
  pointer-events:none;
}

/* ---------- iPhone 14 landscape height: tighter ---------- */
@media (orientation: landscape) and (max-height: 430px){
  .Mobilelogo{ padding:8px 10px; }
  .Mobilelogo img.brand-logo{ width:64px; }
  .Mobilelogo h3{ font-size:11px; letter-spacing:1.6px; }

  .tele-card{ width: 210px; padding:9px 10px; }

  .hud-left{
    top: calc(env(safe-area-inset-top,0px) + var(--pad) + 78px);
    width: min(520px, 58vw);
  }

  .sliders{ padding:10px 12px; border-radius:20px; }

  .slider-line{
    grid-template-columns: 58px 1fr 58px;
    gap:10px;
    font-size:11px;
  }

  .stick-zone{
    width: min(24vw, 165px);
    height: min(24vw, 165px);
    min-width: 118px;
    min-height: 118px;
    bottom: calc(env(safe-area-inset-bottom,0px) + 36px);
  }
}

/* no iOS zoom issues needed here (only text inputs trigger zoom) */
button{ font-size: inherit; }
/* =========================
   FIXED HUD POSITIONS
   ========================= */


/* If you show error pill, keep it just under roomline */
.errline{
  top: calc(env(safe-area-inset-top,0px) + 132px);
  bottom: auto !important;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}


/* 3) Zoom/Look sliders -> BOTTOM CENTER (between joysticks) + narrower */
.hud-left{
  top: auto !important;
  bottom: calc(env(safe-area-inset-bottom,0px) + 70px); /* above sticks */
  left: 50%;
  transform: translateX(-50%);
  width: min(420px, 46vw) !important; /* less width */
}

/* Make it feel more compact */
.sliders{
  padding: 10px 12px;
  border-radius: 20px;
}

.slider-line{
  grid-template-columns: 54px 1fr 54px; /* tighter labels */
  font-size: 11px;
}

/* OPTIONAL: if sliders still overlap sticks on smaller heights, push them up a bit */
@media (orientation: landscape) and (max-height: 100px){
  .hud-left{
    bottom: calc(env(safe-area-inset-bottom,0px) + 82px);
    width: min(380px, 52vw) !important;
  }
}
/* ===== Force chip-btn + roomline at TOP in LANDSCAPE ===== */
@media (orientation: landscape) {

  /* Room line: top-center */
   .roomline{
    position: relative;
    font-size: xx-small;
  } 

  /* Chip button: top-left under logo */
  .chip-btn{
    position: relative;
    font-size: x-small;
  }
}

</style>
