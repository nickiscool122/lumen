import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const scramjetPath = join(__dirname, "node_modules/@mercuryworkshop/scramjet/dist");
const baremuxPath = join(__dirname, "node_modules/@mercuryworkshop/bare-mux/dist");
const epoxyPath = join(__dirname, "node_modules/@mercuryworkshop/epoxy-transport/dist");

logging.set_level(logging.WARN);
wisp.options.dns_method = "resolve";wisp.options.dns_result_order = "ipv4first";
wisp.options.dns_servers = ["1.1.1.3", "1.0.0.3"]; // Cloudflare family DNS (blocks malware/adult)

const app = express();

// Scramjet needs these to be same-origin, so serve from our own paths
app.use("/scram/", express.static(scramjetPath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use(express.static(join(__dirname, "public"), { extensions: ["html"] }));

app.use((req, res) => res.status(404).sendFile(join(__dirname, "public/index.html")));

const server = createServer(app);
server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
  else socket.end();
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => console.log(`lumen running on http://localhost:${PORT}`));

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => server.close(() => process.exit(0)));
