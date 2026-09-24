import http from "http";

const visited = new Set();

async function traceUrl(urlPath) {
  if (visited.has(urlPath)) return;
  visited.add(urlPath);

  const fullUrl = `http://localhost:8080${urlPath}`;
  return new Promise((resolve) => {
    http
      .get(fullUrl, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", async () => {
          console.log(`[${res.statusCode}] ${urlPath}`);
          if (res.statusCode !== 200) {
            console.error(`FAILED: ${urlPath} returned ${res.statusCode}`);
            console.error(data.substring(0, 300));
          } else {
            const imports = [];
            const regex = /(?:from|import)\s+["']([^"']+)["']/g;
            let match;
            while ((match = regex.exec(data)) !== null) {
              if (match[1].startsWith("/") || match[1].startsWith(".")) {
                imports.push(match[1]);
              }
            }
            for (const imp of imports) {
              let target = imp;
              if (imp.startsWith(".")) {
                const urlObj = new URL(imp, `http://localhost:8080${urlPath}`);
                target = urlObj.pathname + urlObj.search;
              }
              await traceUrl(target);
            }
          }
          resolve();
        });
      })
      .on("error", (err) => {
        console.error(`ERROR fetching ${urlPath}: ${err.message}`);
        resolve();
      });
  });
}

traceUrl("/node_modules/@tanstack/react-start/dist/plugin/default-entry/client.tsx");
