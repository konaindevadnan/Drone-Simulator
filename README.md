# Dual-Device High-Fidelity Drone Simulator 🛸📱

An interactive, real-time web application featuring a sophisticated **dual-device architecture**. The system splits the user experience across two network nodes: a primary desktop web browser (**The Viewer**) renders a high-performance, photorealistic 3D flight simulation, while a secondary mobile interface (**The Controller**) acts as a handheld flight deck managing manual telemetry inputs and gimbal look-angles.

---

## 🚀 Key Features

- **Dual-Device Synchronization:** Real-time, low-latency control streams and telemetry tracking bridged seamlessly over WebSockets.
- **Automated LAN Networking:** Zero-configuration network setup. The system auto-detects the host's local IP, configures Vite to listen across the entire LAN, and generates a **dynamic QR code** on the main screen for instant mobile pairing.
- **Multi-Touch Virtual Flight Sticks:** Cross-browser touch handling using PointerEvents with a 55px vector normalization radius and a **20% dead-zone clamp** to eliminate thumb drift.
- **Advanced Camera Configurations:** - *Third-Person View (TPV):* An organic trailing camera array using spherical linear interpolations (Slerp).
  - *First-Person View (FPV):* A cockpit-mounted camera with a **35° dynamic gimbal tilt** range slider and physical focal-length zoom simulation.
- **Octree Collision Assessment:** Real-time spatial partitioning that parses static terrain into an Octree. The drone is calculated as a 3D mathematical sphere, handling instant collision depth projections, velocity dampening, and impact-based sound effects.
- **Simulated Resource Telemetry:** Continuous tracking of a linear **5-minute battery drainage curve** and Euclidean distance-based **Signal Strength attenuation** (100% strength up to 30m, degrading to 0% at a 180m ceiling).

---

## 🎬 Project Preview

### System Overview & Mobile Control Demonstration
*Below is a video walkthrough demonstrating the dual-device synchronization, FPV/TPV camera transitions, and environmental flight mechanics.*

https://github.com/konaindevadnan/Drone-Simulator/blob/main/Mobile%20Control%20Drone%20Simulator%20Project.mp4

---

## 🛠️ Technical Stack & Architecture

### 🖥️ 3D Simulation Engine (Viewer)
- **Framework & Engine:** Three.js / Vue 3 (Vite)
- **Responsibilities:** Renders environment meshes, computes aerodynamic drag calculations (exponential damping friction of `0.9`), assesses bounding octree hulls, and maps projection matrices.

### 📱 Mobile Controller HUD (Controller)
- **Framework & Input:** Vue 3 / HTML5 Touch API
- **Responsibilities:** Captures dual-joystick PointerEvents, maps camera gimbal rotation vectors, and visualizes real-time power/signal degradation states.

### 🌐 Network Relay Broker (Server)
- **Runtime & Gateway:** Node.js / Socket.io
- **Responsibilities:** Bridges low-latency WebSocket traffic, creates virtual communication rooms, and automates host resolution mapping.

---

## 📦 Getting Started & Operation

### Prerequisites
- **Node.js** (v18.x or higher recommended)
- A mobile device connected to the **same local Wi-Fi network (LAN)** as your host computer.

### Running the Simulator (Windows Automated)
1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/konaindevadnan/Drone-Simulator.git](https://github.com/konaindevadnan/Drone-Simulator.git)
   cd Drone-Simulator
