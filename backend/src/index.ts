import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHotelContainer } from "./composition/root.js";
import { dispatchHotelRequest } from "./http/hotel-http.handler.js";
import { createStaticFileSender } from "./http/static.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, "../../frontend");

const { application } = createHotelContainer();
const serveStatic = createStaticFileSender(frontendDir);

createServer((req, res) => {
  void dispatchHotelRequest(req, res, application, serveStatic);
}).listen(3000, () => {
  console.log("Hotel system started: http://localhost:3000");
});
