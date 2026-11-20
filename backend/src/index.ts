import app from "./app.js";
import { env } from "./config/env.js";

// Start the server. Everything else about the app lives in app.ts.
app.listen(env.PORT, () => {
  console.log(`BookNest backend running on port ${env.PORT}`);
});
  