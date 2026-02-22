# 🏥 MediQueue Backend - MVP v1.0

### **Note from Chass**
> "Ello, I'm sharing the .env file directly in this ZIP kahit di siya standard practice (actually very bad thing to do siya kaya wag mo nalang bigay ung api key ko .env file). Binigay ko nalang diretso kasi tinatamad akong mag bigay ng permission sa database at yoko lagay .env sa github HASHSHSAHSA. Just don't upload the .env if you push this to a public GitHub repo!!!"

---

## 🗂️ Folder Structure

```
HospitalSystem/
├── Backend/
│   └── src/
│       ├── config/
│       │   └── database.ts
│       ├── controllers/
│       │   └── queueController.ts
│       ├── routes/
│       │   └── queueRoutes.ts
│       └── server.ts
├── node_modules/
├── .env
├── HandoverDocument.md
├── package-lock.json
├── package.json
```

## 🛠️ Installation & Setup

1. **Extract the ZIP**: Open the project folder in your vscode then open your terminal.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
   This will create your node_modules folder based on the package.json.
3. **Run the Server**:
   ```bash
   npm run dev
   ```
   The server runs on port 5000. You should see a "Server is running" message in your terminal.

📡 **API Endpoints** (Base URL: http://localhost:5000/api)

1. **Doctors**
   - `GET /doctors`: Returns a list of all doctors (ID, name, specialization).

2. **Patient Queue**
   - `POST /queue/join`: Adds a patient to the line.
     - **Body**: { "patientId": "UUID", "doctorId": 1 }
   - `GET /queue/patient-status/:patientId`: Returns the patient's specific live rank and ticket number.
     - **Response Example**:
       ```json
       {"ticket_number": 4,"status": "waiting","position_in_queue": 3}
       ```

3. **Admin / Doctor View**
   - `GET /queue/admin/:doctorId`: Returns the list of all patients waiting for that specific doctor today.
   - `PATCH /admin/call-next/:doctorId`: Updates the oldest 'waiting' patient to 'called'. This automatically shifts the position_in_queue for everyone else.

🧪 **Test Data (Hardcoded UUIDs)**
Use these existing IDs in your frontend to test the logic without creating new users.

| Name              | Role    | UUID                                   |
|-------------------|---------|----------------------------------------|
| Juan Dela Cruz    | Patient | a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 |
| Maria Clara       | Patient | 50507b85-3058-4ae6-b856-ddc25244c14c       |
| Crisostomo Ibarra | Patient | f3d251b8-587d-46dc-b7af-e59a7a761efb      |

💡 **Integration Tips**
- **Time Zones**: The backend resets the queue daily and displays time in Asia/Singapore (UTC+8).
- **No Auth Yet**: We are using raw UUIDs for now. Just pass the IDs above to see the data flow.
- **TS Warning**: I'm using tsx to run the server, so I don't have a tsconfig.json. If VS Code shows red lines, ignore them; as long as the terminal says "running," the API is good.

Tanong mo nalang ako if may problems.