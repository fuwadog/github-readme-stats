import "dotenv/config";
import validateEnv from "./src/common/validateEnv.js";
validateEnv();

import express from "express";
import rateLimit from "./src/common/rateLimit.js";

import statsCard from "./api/index.js";
import repoCard from "./api/pin.js";
import langCard from "./api/top-langs.js";
import wakatimeCard from "./api/wakatime.js";
import gistCard from "./api/gist.js";

const app = express();
const router = express.Router();

app.use(express.json({ limit: "1mb" }));

router.get("/", statsCard);
router.get("/pin", repoCard);
router.get("/top-langs", langCard);
router.get("/wakatime", wakatimeCard);
router.get("/gist", gistCard);

app.use("/api", rateLimit, router);

const port = process.env.PORT || process.env.port || 9000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
