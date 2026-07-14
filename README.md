# Visualization Tool for Electric Vehicle Charge and Range Analysis

An interactive, structured analysis dashboard showcasing charging behaviors, battery logistics, vehicle efficiency metrics, and consumer segment trends from a historical dataset of 50,000 charging sessions.

---

## 📊 Project Overview
This project converts raw telemetry and charging transaction data into interactive analytical visual views. It targets three user scenarios with distinct perspectives on EV analytics:
1. **Aarav (City Energy Planner)**: Analyzing neighborhood charging demands, peak utility load durations, and speed type trends to build grids and ensure stability.
2. **Meera (EV Taxi Fleet Manager)**: Monitoring charge durations, anticipating replacement schedules, and reviewing battery pack efficiencies under different regional thermal conditions.
3. **Ravi (Environmentally Conscious Consumer)**: Comparing range, fuel cost-to-performance ratio, and emission statistics across popular EV models under different driving styles (Sport, Eco, Normal).

---

## 🛠️ Tech Stack & Architecture
To ensure premium performance, the project uses a clean modular structure:
* **Preprocessed Backend**: Aggregated and structured JSON models (`data_summary.json` and `data_summary.js`) store summary statistics for the 50,000 charging sessions.
* **Modern Interface**: A pure Vanilla HTML/CSS/JS frontend utilizing a dark-theme glassmorphism design.
* **Analytical Visualization**: Powered dynamically by **Chart.js** via CDN, producing 11 unique charts with neon accent lines and gradients.
* **Review Setup Portal**: Integration of a simulated "Mentor Review Portal" using browser `localStorage` to log evaluation link requests.

---

## 🔍 Structured Analysis Takeaways

### 1. Charging Patterns (Aarav View)
* **High-Power Zones**: **Pune East** leads in average power consumption (**52.58 kWh**), followed by **Mumbai Central** (**49.61 kWh**).
* **Speed Type Distribution**: Level 1 (Slow) and Level 2 (Standard) charge events capture the largest volume. Fast DC charging remains an essential target for grid expansion.
* **Temporal Peaks**: Charging demand is uniformly spread across Morning, Afternoon, and Evening intervals, presenting an opportunity for Time-of-Use tariff programs.

### 2. Battery Performance (Meera View)
* **Charge Durations**: Session durations range uniformly from 10 to 140 minutes, indicating consistent scheduling queues.
* **Efficiency Metrics**: Average battery charging efficiency remains steady at **92-94%** across networks. Hotter hubs like Mumbai require pre-conditioned active cooling loops.

### 3. Model Comparison (Ravi View)
* **Model Popularity**: The **Tesla Model 3** captures the highest share (12,671 sessions), followed by Nissan Leaf, Tata Nexon EV, and Hyundai Ioniq 5.
* **Style impact**: Driving styles are balanced across Eco, Sport, and Normal modes. Eco mode maximizes regenerative braking yields.
* **Delivered Range**: Average range is stable around **350 km** across charging sessions.

---

## 🚀 How to Run the Dashboard

1. **Accessing**:
   * Directly double-click `index.html` to open it in any web browser.
   * Alternatively, serve it using any simple local HTTP server (e.g., Live Server extension in VS Code).
2. **Using the Dashboard**:
   * Use the left navigation sidebar to switch between different scenario views (Overview, Charging Patterns, Battery Performance, Model Comparison).
   * Go to the **Mentor Review Portal** to review the submitted GitHub repository and live demo links, or log a new submission.
