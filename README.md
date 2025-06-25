
# 📁 CSV Upload API Automation with Dynamic Data & CI Reporting

> ⚠️ **Note:** This project is an **R&D prototype**, developed to explore a solution for real-world challenges in API automation testing. The goal is to implement this mechanism in a real production QA project after validation.

---

## 🚀 Problem Statement

In my current API automation project, I encountered a challenge:  
We have an API that **onboards users via a CSV file**. However, if the CSV contains **duplicate values** (like existing email addresses or employee IDs), the API throws a `409 Conflict` error and fails the upload.

Two workarounds were initially proposed:
1. Manually generate a new CSV file before every run  
2. Reset the backend database daily to avoid duplication

Neither of those solutions were sustainable or CI-friendly.

---

## 💡 Solution Overview

So I built an R&D test framework that:
- 🔁 Automatically generates **unique** CSV data each time using `faker.js`
- 📩 Sends the CSV to the onboarding API using **Postman + Newman**
- 🧪 Runs on a **GitHub Actions CI schedule (every 30 minutes)**
- 📲 Delivers **HTML test reports to Telegram**, with pass/fail stats
- ⚡ Makes the whole process fully automated, repeatable, and scalable

This setup is currently being tested and **will be implemented in the real project** once verified.

---

## 📦 Tech Stack

| Feature         | Tool                     |
|-----------------|--------------------------|
| Data Generation | Node.js + Faker.js       |
| API Testing     | Postman + Newman         |
| CI/CD           | GitHub Actions           |
| Notification    | Telegram Bot             |
| Database        | LowDB (JSON based)       |
| Hosting         | Render                   |

---

## 📁 Project Structure

```bash
csv-upload-api/
├── .github/workflows/
│   └── api-test.yml              # GitHub Actions workflow
├── uploads/                      # Uploaded CSVs (if any)
├── temp.csv                      # Auto-generated test CSV
├── generate-csv.js               # Node.js CSV generator with faker
├── upload-collection.json        # Postman collection
├── server.js                     # Express server simulating API
├── db.json                       # LowDB mock database
├── package.json
└── README.md
```

---

## 🔁 CI/CD Workflow Highlights

- ✅ Triggers every **30 minutes**
- 📄 Generates fresh CSV using `faker`
- 🧼 Deletes old reports to avoid clutter
- 📩 Sends test summary + report to **Telegram**
- 📊 HTML report sent whether tests pass or fail
- 📬 Shows **passed/failed test count** in message

---

## 🔧 Setup Guide (for Local Testing)

1. **Clone the project**
   ```bash
   git clone https://github.com/yourusername/playing-with-api.git
   cd csv-upload-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the dummy server**
   ```bash
   node server.js
   ```

4. **Test the API manually via Postman**
   - Import `upload-collection.json`
   - Use `temp.csv` as the body form-data

---

## ☁️ Hosting

Deploy this dummy server on:

- [Render (Free)](https://render.com)

After deployment, use the public endpoint in the collection/env.

---

## 📲 Telegram Notification Setup

1. Create a Telegram bot using [@BotFather](https://t.me/BotFather)
2. Send a message to your bot to get your `chat_id`
3. Add the following GitHub secrets:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
