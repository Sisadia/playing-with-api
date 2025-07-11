const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const app = express();
const upload = multer({ dest: 'uploads/' });

const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
// Provide default data here to fix "missing default data" error
const db = new Low(adapter, { users: [] });

async function initDB() {
  await db.read();
  db.data ||= { users: [] };
  await db.write();
}

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a CSV file to onboard users
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The CSV file containing user data
 *     responses:
 *       200:
 *         description: Users uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Users uploaded successfully.
 *       400:
 *         description: No file uploaded or invalid file format
 *       409:
 *         description: Duplicate emails found in the file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Duplicate emails found. Upload failed.
 *                 duplicates:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: jane.doe@yopmail.com
 *       500:
 *         description: Internal server error during upload
 */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    await initDB();

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.join(__dirname, req.file.path);
    const results = [];
    let hasDuplicate = false;
    const duplicateEmails = new Set();
    const existingEmails = new Set(db.data.users.map(u => u["Email Address"].toLowerCase()));

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const emailRaw = row["Email Address"];
        if (!emailRaw) {
          console.warn('Skipped row with missing email:', row);
          return; // skip this row
        }
        const email = emailRaw.trim().toLowerCase();
        if (existingEmails.has(email)) {
          hasDuplicate = true;
          duplicateEmails.add(email);
        } else {
          results.push(row);
        }
      })
      .on('end', async () => {
        fs.unlinkSync(filePath); // delete temp uploaded file

        if (hasDuplicate) {
          return res.status(409).json({
            status: 'error',
            message: '❌ Duplicate emails found. Upload failed.',
            duplicates: Array.from(duplicateEmails),
          });
        }

        // Save to LowDB
        db.data.users.push(...results);
        await db.write();

        // Log onboarded users
        const logsDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFilePath = path.join(logsDir, `onboarded_users_${timestamp}.json`);
        fs.writeFileSync(logFilePath, JSON.stringify(results, null, 2));

        console.log(`✅ Onboarded ${results.length} user(s). Log saved to: ${logFilePath}`);

        return res.status(200).json({
          status: 'success',
          message: `✅ Successfully onboarded ${results.length} user(s).`,
          onboardedUsers: results,
          logFile: `logs/onboarded_users_${timestamp}.json`,
        });
      })
      .on('error', (err) => {
        console.error('❌ CSV processing error:', err);
        return res.status(500).json({ error: 'Error parsing CSV file' });
      });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});




/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: A list of onboarded users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: john.doe@yopmail.com
 *                       raw:
 *                         type: string
 *                         description: Raw CSV line data
 *       500:
 *         description: Server error while fetching users
 */
app.get('/users', async (req, res) => {
  try {
    await initDB();
    return res.status(200).json({ users: db.data.users });
  } catch (err) {
    console.error('❌ Failed to fetch users:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/reset', async (req, res) => {
  try {
    await initDB();
    db.data.users = [];
    await db.write();
    return res.status(200).json({ status: 'success', message: 'Database reset complete.' });
  } catch (err) {
    console.error('❌ Reset failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CSV Upload API",
      version: "1.0.0",
      description: "API for uploading and listing users from CSV",
    },
  },
  apis: ["./server.js"], // You can document endpoints using JSDoc-style comments
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));