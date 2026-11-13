import "dotenv/config";
import express from "express";
import cors from "cors";

import itemsRoutes from "./items.js";
import replicateRoutes from "./replicate.js";
import weatherRoutes from "./weather.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api", itemsRoutes);
app.use("/api", replicateRoutes);
app.use("/api", weatherRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
