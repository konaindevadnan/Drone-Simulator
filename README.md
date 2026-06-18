# Dual-Device High-Fidelity Drone Simulator 🛸📱

[cite_start]An interactive, real-time web application featuring a sophisticated **dual-device architecture**[cite: 3]. [cite_start]The system splits the user experience across two network nodes: a primary desktop web browser (**The Viewer**) renders a high-performance, photorealistic 3D flight simulation, while a secondary mobile interface (**The Controller**) acts as a handheld flight deck managing manual telemetry inputs and gimbal look-angles[cite: 4].

---

## 🚀 Key Features

- [cite_start]**Dual-Device Synchronization:** Real-time, low-latency control streams and telemetry tracking bridged seamlessly over WebSockets[cite: 4, 7].
- [cite_start]**Automated LAN Networking:** Zero-configuration network setup[cite: 9]. [cite_start]The system auto-detects the host's local IP, configures Vite to listen across the entire LAN, and generates a **dynamic QR code** on the main screen for instant mobile pairing[cite: 13, 14, 17].
- [cite_start]**Multi-Touch Virtual Flight Sticks:** Cross-browser touch handling using PointerEvents with a 55px vector normalization radius and a **20% dead-zone clamp** to eliminate thumb drift[cite: 20, 21, 22].
- [cite_start]**Advanced Camera Configurations:** - *Third-Person View (TPV):* An organic trailing camera array using spherical linear interpolations (Slerp)[cite: 28].
  - [cite_start]*First-Person View (FPV):* A cockpit-mounted camera with a **35° dynamic gimbal tilt** range slider and physical focal-length zoom simulation[cite: 29, 30, 31].
- [cite_start]**Octree Collision Assessment:** Real-time spatial partitioning that parses static terrain into an Octree[cite: 33]. [cite_start]The drone is calculated as a 3D mathematical sphere, handling instant collision depth projections, velocity dampening, and impact-based sound effects[cite: 34, 36].
- [cite_start]**Simulated Resource Telemetry:** Continuous tracking of a linear **5-minute battery drainage curve** and Euclidean distance-based **Signal Strength attenuation** (100% strength up to 30m, degrading to 0% at a 180m ceiling)[cite: 38, 40, 41].

---

## 🎬 Project Preview

### System Overview & Mobile Control Demonstration
*Below is a video walkthrough demonstrating the dual-device synchronization, FPV/TPV camera transitions, and environmental flight mechanics.*

https://github.com/konaindevadnan/Drone-Simulator/blob/main/Mobile%20Control%20Drone%20Simulator%20Project.mp4

---

## 🛠️ Technical Stack & Architecture

### 🖥️ 3D Simulation Engine (Viewer)
- [cite_start]**Framework & Engine:** Three.js / Vue 3 (Vite) [cite: 7]
- [cite_start]**Responsibilities:** Renders environment meshes, computes aerodynamic drag calculations (exponential damping friction of `0.9`), assesses bounding octree hulls, and maps projection matrices[cite: 7, 25, 33].

### 📱 Mobile Controller HUD (Controller)
- [cite_start]**Framework & Input:** Vue 3 / HTML5 Touch API [cite: 7]
- [cite_start]**Responsibilities:** Captures dual-joystick PointerEvents, maps camera gimbal rotation vectors, and visualizes real-time power/signal degradation states[cite: 7, 20, 30, 38].

### 🌐 Network Relay Broker (Server)
- [cite_start]**Runtime & Gateway:** Node.js / Socket.io [cite: 7]
- [cite_start]**Responsibilities:** Bridges low-latency WebSocket traffic, creates virtual communication rooms, and automates host resolution mapping[cite: 6, 7].

---

## 📦 Getting Started & Operation

### Prerequisites
- **Node.js** (v18.x or higher recommended)
- [cite_start]A mobile device connected to the **same local Wi-Fi network (LAN)** as your host computer[cite: 13, 17].

### Running the Simulator (Windows Automated)
1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/konaindevadnan/Drone-Simulator.git](https://github.com/konaindevadnan/Drone-Simulator.git)
   cd Drone-Simulator
