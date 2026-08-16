// backend/routes/scan.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } }); // 8MB

// helper: pick a python executable
function pickPythonExecutable() {
  // allow override
  if (process.env.PYTHON_PATH && process.env.PYTHON_PATH.trim()) {
    return process.env.PYTHON_PATH;
  }
  // try common names
  const candidates = ["python", "python3", "py"];
  return candidates;
}

function spawnPython(cmdCandidates, args, opts = {}) {
  // if candidates is string -> use it
  if (typeof cmdCandidates === "string") {
    return spawn(cmdCandidates, args, opts);
  }
  // try each candidate synchronously: spawn and if spawn fails immediate (ENOENT) try next
  // We'll attempt to spawn and listen for 'error' event; if error ENOENT, try next.
  let triedIndex = 0;
  let lastChild = null;

  function trySpawn(resolve, reject) {
    if (triedIndex >= cmdCandidates.length) {
      return reject(new Error("No python executable found: tried " + cmdCandidates.join(", ")));
    }
    const cmd = cmdCandidates[triedIndex++];
    const child = spawn(cmd, args, opts);
    lastChild = child;

    child.once("error", (err) => {
      // ENOENT = command not found -> try next candidate
      if (err.code === "ENOENT") {
        trySpawn(resolve, reject);
      } else {
        reject(err);
      }
    });

    // if we get stdout or close normally, treat it as success
    child.once("spawn", () => resolve(child));
  }

  // return a Promise that resolves to a spawned child
  return new Promise((resolve, reject) => trySpawn(resolve, reject));
}

router.post("/file", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  const imgPath = req.file.path;
  const modelPath = path.join(__dirname, "..", "model", "model.tflite");
  const inferPath = path.join(__dirname, "..", "inference", "inference.py");

  if (!fs.existsSync(inferPath)) {
    fs.unlinkSync(imgPath);
    console.error("inference.py not found at", inferPath);
    return res.status(500).json({ error: "inference.py not found on server", path: inferPath });
  }
  if (!fs.existsSync(modelPath)) {
    fs.unlinkSync(imgPath);
    console.error("model.tflite not found at", modelPath);
    return res.status(500).json({ error: "model.tflite not found on server", path: modelPath });
  }

  const pythonCandidates = pickPythonExecutable();

  const args = [
    inferPath,
    "--model",
    modelPath,
    "--image",
    imgPath
  ];

  try {
    // spawnPython may return a Promise (if we used multiple candidates)
    const child = await spawnPython(pythonCandidates, args);

    let stdout = "";
    let stderr = "";
    // set a timeout guard in case python hangs
    const killTimer = setTimeout(() => {
      stderr += "\n[ERROR] Python process timed out after 30s. Killing.";
      child.kill("SIGKILL");
    }, 30000);

    child.stdout.on("data", (d) => {
      const s = d.toString();
      stdout += s;
      process.stdout.write("[PYOUT] " + s);
    });
    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      process.stderr.write("[PYERR] " + s);
    });

    child.on("close", (code) => {
      clearTimeout(killTimer);
      // always delete uploaded file
      try { fs.unlinkSync(imgPath); } catch (e) {}

      if (code !== 0) {
        console.error("Python exited with code", code);
        console.error("stderr:", stderr);
        return res.status(500).json({ error: "Python inference failed", code, stderr });
      }

      // try parse stdout as JSON
      try {
        const parsed = JSON.parse(stdout);
        return res.json(parsed);
      } catch (e) {
        console.error("Invalid JSON from python. stdout:", stdout);
        return res.status(500).json({ error: "Invalid JSON from python", raw_stdout: stdout, stderr });
      }
    });
  } catch (err) {
    // spawn errors
    try { fs.unlinkSync(imgPath); } catch (e) {}
    console.error("Failed to spawn python:", err);
    return res.status(500).json({ error: "Failed to start python", details: err.message });
  }
});

module.exports = router;
