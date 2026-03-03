# Incentive-Driven Community Smoke Monitoring in the WUI

## Slide 1 - Title
**Incentive-Driven Community Smoke Monitoring in the Wildland-Urban Interface (WUI)**

- Jyun-Fan Tsai
- Dorgie LLC.
- 2026.03.26 / 4th International Smoke Symposium

**Opening line (speaker cue):**
- Wildfire smoke often reaches communities before flames do, but sensing and connectivity coverage do not always exist where they are most needed.

---

## Slide 2 - Why This Matters (Problem Context)
**Wildfire Smoke Risk Is Expanding Faster Than Monitoring Coverage**

- Wildland-Urban Interface (WUI) areas combine high fire risk with growing populations
- Smoke exposure causes health risks even when fire is far from homes
- Early smoke detection and local air quality visibility support public response
- Coverage gaps are common in semi-rural and edge communities

**Speaker cue:**
- The challenge is not only sensor technology; it is where sensors are deployed and whether they stay online.

---

## Slide 3 - Current Gaps in Monitoring
**What Is Missing in Existing Approaches?**

- Fixed government stations: high quality, but expensive and sparse
- Community sensors (e.g., PurpleAir): useful, but placement is not optimized for risk coverage
- Network connectivity is uneven (WiFi / cellular / hotspot availability varies)
- No strong mechanism to coordinate private devices for public monitoring goals

**Key message:**
- We have pieces of the system, but not a mechanism to align them.

---

## Slide 4 - Core Idea
**Use Incentives to Coordinate Sensor and Network Contributions**

- Create a reward mechanism that targets **specific high-priority locations**
- Reward people who bring their own sensors online
- Reward network providers who contribute connectivity (WiFi / 5G / hotspot / gateway)
- Allow a sponsor (city, NGO, insurer, community group) to fund coverage expansion

**Key message:**
- Incentives should reward verified public monitoring contribution, not just device ownership.

---

## Slide 5 - Roles in the Ecosystem
**Who Participates?**

- **Reward Sponsor**
  - Defines target area and budget
  - Pays for coverage in priority zones
- **Sensor Owner**
  - Deploys and maintains a sensor (e.g., PurpleAir-like node)
  - Keeps it online and transmitting
- **Network Provider**
  - Provides reliable data backhaul (WiFi / 5G / hotspot / LoRa gateway)
  - Enables sensor data delivery
- **Platform / Coordinator**
  - Publishes tasks, verifies contribution, calculates rewards

**Speaker cue:**
- The platform is the coordination layer, but the infrastructure can remain community-owned.

---

## Slide 6 - System Architecture (End-to-End)
**How the System Works**

1. Sponsor defines a monitoring objective (location, duration, budget, priority map)
2. Platform publishes reward opportunities for under-covered zones
3. Sensor owners deploy or activate sensors in target areas
4. Network providers offer connectivity for data transmission
5. Platform verifies location, uptime, and data quality
6. Rewards are distributed based on measured contribution

**Data flow (for diagram):**
- Sensor -> Network -> Platform -> Dashboard / Alerts / Public AQ tools

---

## Slide 7 - Incentive Design (Three Reward Layers)
**Reward Components**

- **A. Placement Reward**
  - Higher reward for sensors placed in coverage gaps or high-risk zones
  - Encourages deployment to where data is most valuable

- **B. Online / Uptime Reward**
  - Rewards consistent operation and regular reporting
  - Prevents “deploy once, then go offline”

- **C. Connectivity Reward**
  - Rewards network providers for stable, low-latency data transport
  - Recognizes that sensing depends on communication infrastructure

**Key message:**
- This aligns deployment, operation, and connectivity incentives at the same time.

---

## Slide 8 - Example Reward Formula
**A Practical Reward Calculation (Illustrative)**

**Total Reward = Base × Location Score × Data Quality Score × Uptime Score + Connectivity Bonus**

- **Location Score**
  - Is the sensor in a target zone?
  - Does it reduce a coverage gap?
- **Data Quality Score**
  - Valid range checks, calibration status, consistency with nearby nodes
- **Uptime Score**
  - Online rate, reporting frequency, continuity during target periods
- **Connectivity Bonus**
  - Reliable transmission, latency, availability of network service

**Speaker cue:**
- The exact weights can be tuned by sponsor goals (public health, emergency response, cost control).

---

## Slide 9 - Verification and Anti-Gaming
**How to Prevent Abuse and Low-Value Participation**

- **Location verification**
  - GPS metadata, installation confirmation, periodic checks
- **Data validation**
  - Outlier detection, cross-check with nearby sensors, drift monitoring
- **Uptime verification**
  - Timestamp continuity and packet delivery records
- **Network contribution verification**
  - Measured relayed traffic / successful transmissions / service availability
- **Penalty rules**
  - Reduced rewards or suspension for repeated invalid submissions

**Key message:**
- A reward system without verification will optimize for gaming, not coverage.

---

## Slide 10 - Prototype Website
**A Web Platform for Incentive-Based Sensor Participation**

- Sensor owners can register PurpleAir devices using anonymous accounts
- Sponsors can define a target geographic area and assign a reward budget
- The platform matches active sensors to sponsored target zones
- The system verifies eligible participation and distributes rewards every hour

**Key workflow:**
- Register device -> Join target area -> Stay online -> Receive hourly rewards

---

## Slide 11 - Expected Impact and Use Cases
**Why This Matters Beyond One Pilot**

- Improves smoke monitoring in underserved WUI communities
- Adds resilience through distributed, community-participating infrastructure
- Helps agencies and emergency managers see local conditions sooner
- Creates a path to scale with limited public budgets
- Can generalize to other environmental monitoring:
  - Heat stress
  - Flood sensing
  - Neighborhood air quality

---

## Slide 12 - Challenges and Open Questions
**What Still Needs Careful Design**

- Who funds rewards long-term, and how sustainable is the budget?
- How do we protect privacy while verifying location and contribution?
- How should rewards differ across WiFi, 5G, and LoRa-like networks?
- How do we ensure equity (not only rewarding already well-connected areas)?
- How do we integrate with public agencies and trusted alert systems?

**Key message:**
- Technical feasibility is only one part; governance and incentive design determine real-world success.

---

## Slide 13 - Conclusion
**Takeaways**

- The main bottleneck is not only sensing hardware, but coordinated deployment and connectivity
- A multi-role incentive mechanism can align private resources with public monitoring goals
- Rewarding both sensors and networks can improve coverage where it matters most
- This is a mechanism-design problem as much as an IoT problem

**Closing line (speaker cue):**
- If we can reward the right contribution in the right place, community-owned infrastructure can become a practical layer of wildfire smoke resilience.

---

## Slide 14 - Q&A
**Questions?**

- Thank you
- Contact: jyunfan@dorgie.com / lab website

---

## Optional Appendix (if asked)
**Possible Metrics for Future Experiments**

- Coverage utility score (weighted by population + risk)
- Mean time to first smoke signal in target zones
- Reward cost per unit coverage improvement
- False positive / false negative rates
- Retention rate of sensor owners and network providers
