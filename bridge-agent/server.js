const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.BRIDGE_PORT || 3001;
const ARCHIVE_BASE_PATH = process.env.ARCHIVE_BASE_PATH || 'D:\\';
const BRIDGE_SECRET = process.env.BRIDGE_SECRET;

app.use(cors());
app.use(express.json());

const verifySecret = (req, res, next) => {
  const secret = req.headers['x-bridge-secret'];
  if (secret !== BRIDGE_SECRET) {
    return res.status(403).json({ error: 'Unauthorized: Invalid bridge secret' });
  }
  next();
};

app.get('/health', (req, res) => {
  res.json({ status: "online", archivePath: ARCHIVE_BASE_PATH });
});

app.post('/archive', verifySecret, async (req, res) => {
  const { projectId, projectName, fileName, fileUrl, utFileKey, category } = req.body;

  if (!projectName || !fileName || !fileUrl || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9 _-]/g, "").trim();

    let categoryFolder = "General";
    switch(category) {
        case "LIAISONING": categoryFolder = "Liaisoning"; break;
        case "TECHNICAL": categoryFolder = "Technical"; break;
        case "COMMERCIAL": categoryFolder = "Commercial"; break;
        case "HANDOVER_SHEET": categoryFolder = "Handover Sheet"; break;
    }

    const targetDir = path.join(ARCHIVE_BASE_PATH, sanitizedProjectName, categoryFolder);
    const filePath = path.join(targetDir, fileName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    console.log(`[ARCHIVE] Downloading ${fileName} from ${fileUrl}...`);
    
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    fs.writeFileSync(filePath, buffer);
    
    console.log(`[ARCHIVE] Saved to local disk: ${filePath}`);

    res.json({ success: true, localPath: filePath });
  } catch (error) {
    console.error(`[ARCHIVE ERROR]`, error);
    res.status(500).json({ error: 'Failed to archive file', details: error.message });
  }
});

app.get('/files/:projectName', async (req, res) => {
    try {
        const { projectName } = req.params;
        const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
        const projectPath = path.join(ARCHIVE_BASE_PATH, sanitizedProjectName);
        
        if (!fs.existsSync(projectPath)) {
            return res.status(404).json({ error: "Project archive not found locally." });
        }

        const result = {
            files: { Liaisoning: [], Technical: [], Commercial: [], "Handover Sheet": [], General: [] }
        };

        const categories = Object.keys(result.files);
        for (const cat of categories) {
            const catPath = path.join(projectPath, cat);
            if (fs.existsSync(catPath)) {
                result.files[cat] = fs.readdirSync(catPath).filter(f => fs.statSync(path.join(catPath, f)).isFile());
            }
        }

        res.json(result);
    } catch (e) {
        res.status(500).json({ error: "Failed to scan files" });
    }
});

app.get('/files/:projectName/:category/:fileName', (req, res) => {
    try {
        const { projectName, category, fileName } = req.params;
        
        if (fileName.includes('..') || category.includes('..') || projectName.includes('..')) {
           return res.status(403).json({ error: "Invalid path" });
        }

        const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
        const filePath = path.join(ARCHIVE_BASE_PATH, sanitizedProjectName, category, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }

        if (fileName.endsWith('.pdf')) res.setHeader('Content-Type', 'application/pdf');
        else if (fileName.endsWith('.xlsx')) res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        else if (fileName.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
        else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    } catch (e) {
        res.status(500).json({ error: "Failed to stream file" });
    }
});

app.listen(PORT, () => {
  console.log(`[MNMSOLAR] Bridge Agent Started on Port: ${PORT}`);
});
