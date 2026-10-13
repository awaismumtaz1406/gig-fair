# GigFair (`gig-fair`)

**GigFair** is a full-stack web application designed to empower gig workers across platforms (such as Foodpanda, Uber, Indrive, etc.) by logging daily/weekly earnings, calculating fair-wage scores, detecting pay anomalies, filing disputes/complaints, and generating verifiable earnings certificates.

---

## Architecture Overview

Below is the complete System Architecture Diagram for **GigFair**, represented in clean ASCII/Unicode structure suitable for documentation.

```text
+-----------------------------------------------------------------------------------+
|                              CLIENT SIDE (FRONTEND)                               |
|                            REACT APP (VITE / TS / TAILWIND)                       |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | Worker Dashboard   |   | Log Earnings & Upload |   | Complaints & Status    |  |
|  | (Metrics/Trend UI) |   | (Proof Screenshot)    |   | (Dispute Tracker)      |  |
|  +--------------------+   +-----------------------+   +------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                                  HTTPS / REST API (JSON)
                                           |
+------------------------------------------v----------------------------------------+
|                               BACKEND SERVER (DJANGO)                             |
|                                                                                   |
|  +---------------+  +-------------------+  +-----------------+  +-------------------+ |
|  | Admin Panel   |  | Authentication    |  | Gig & Earnings  |  | Verification      | |
|  | & Management  |  | (JWT / Auth)      |  | Logic (CRUD)    |  | Workflow          | |
|  +-------+-------+  +---------+---------+  +--------+--------+  +---------+---------+ |
|          |                    |                     |                   |         |
|          |                    |                     |   +---------------+         |
|          |                    |                     |   | Rename File (Timestamp) | |
|          |                    |                     |   | Save Image Path         | |
|          |                    |                     |   | Update Status (Pending) | |
|          |                    |                     |   +---------------+         |
+----------+--------------------+---------------------+-------------------+---------+
           |                    |                     |                   |
        READ/WRITE           READ/WRITE            READ/WRITE          FILE I/O
   (Django / PyMongo / MongoEngine)                                 (Local Server Storage)
           |                    |                     |                   |
+----------v--------------------+---------------------v----+              |
|                   MONGODB ATLAS (CLOUD)                  |              |
|                                                          |              |
|  +---------------+    +---------------+    +-----------+ |              |
|  | Users         |    | Earnings/Gigs |    | Complaints| |              |
|  | (Profiles)    |    | (Log Data)    |    | (Verifications)|           |
|  +---------------+    +---------------+    +-----------+ |              |
+----------------------------------------------------------+              |
                                                                          |
+-------------------------------------------------------------------------v---------+
|                              LOCAL SERVER STORAGE                                 |
|                                                                                   |
|                              /media/verification/                                 |
|                     [ Uploaded Screenshots (.jpg, .png) ]                         |
+-----------------------------------------------------------------------------------+

```

---

## Updated Architectural Components

1. **Frontend (Client Side):**
* Built with **React**, **TypeScript**, and **Tailwind CSS**.
* Provides real-time dashboard analytics, platform earnings logging, verification screenshot upload interface, dispute reporting, and certificate generation.


2. **Backend (Server Side):**
* Built with **Django (Python)** (or Express REST endpoint handlers).
* Manages JWT authentication, CRUD operations for gig earnings logs, fairness score algorithms, and the verification workflow.
* **Verification Workflow:** Receives uploaded proof screenshots, timestamps and renames the files, stores local image references, and sets dispute verification statuses (`Pending`, `Approved`, `Rejected`).


3. **Database (MongoDB Atlas):**
* Cloud-hosted MongoDB cluster housing primary collections:
* `users` — Worker profiles and platform credentials.
* `earnings` / `gigs` — Logged income entries, hours worked, deductions, net amounts, and calculated anomaly scores.
* `complaints` / `verifications` — Dispute metadata and proof attachment paths.




4. **Media Storage (Local Server Storage):**
* Physical filesystem storage (`/media/verification/`) used during development to manage uploaded platform screenshots before metadata links are written to Atlas.



---

## Key Features

* **Earnings Logging & Analytics:** Track daily earnings, hours worked, platform breakdown, and weekly trends.
* **Fairness & Anomaly Score:** Automated wage scoring comparing worker entries against city-wide platform medians.
* **Proof Verification:** Upload earnings screenshots for verification and dispute resolution.
* **Certificate Generation:** Download official income verification reports.
* **Cloud Database Persistence:** Integrated directly with MongoDB Atlas cloud clusters.

---

## Local Setup & Installation

### Prerequisites

* **Node.js** (v18+)
* **Python** (3.10+) / Django
* **MongoDB Atlas Account** (or local Compass configuration)

### Environment Variables (`.env`)

Create a `.env` file in your root backend directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.pvblfeu.mongodb.net/fairgig?retryWrites=true&w=majority
SECRET_KEY=your_django_secret_key
DEBUG=True

```

### Backend Setup (Django)

```bash
# Clone the repository
git clone https://github.com/your-username/gig-fair.git
cd gig-fair/backend

# Install dependencies
pip install -r requirements.txt

# Run migrations & start server
python manage.py runserver

```

### Frontend Setup (React)

```bash
cd gig-fair/frontend

# Install packages
npm install

# Start development server
npm run dev

```

---

## Diagram Update Summary (What Changed from Old Diagram)

* **Architecture Alignment:** Included complaint tracking, income verification workflows, and exact MongoDB Atlas collection mapping (`Users`, `Earnings/Gigs`, `Complaints/Verifications`).
* **Storage Flow:** Documented dual-path handling where file metadata/paths persist in **MongoDB Atlas** while raw binary assets settle in `/media/verification/`.

Would you like to export this architecture diagram as an image file or SVG for your presentation slides?






<img width="1449" height="736" alt="watermarked_img_15887867739155838331" src="https://github.com/user-attachments/assets/84d1958a-b073-4f61-bfc0-37e6a0ef796b" />



