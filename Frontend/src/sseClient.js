
// src/sseClient.js
export async function readSSE(response, handlers = {}) {
  const {
    onToken,
    onGenDone,
    onResult,
    onDone,
    onError,
    onEvent, // optional hook for custom events
  } = handlers;

  if (!response?.body) {
    onError?.(new Error("No response body for SSE"));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // process complete SSE frames "...\n\n"
      let sep;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        if (!raw || raw.startsWith(":")) continue; // comment/keepalive

        // Parse fields line by line
        let event = "message";
        const dataLines = [];
        for (const line of raw.split("\n")) {
          if (line.startsWith("event:")) {
            event = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }

        const dataStr = dataLines.join("\n");
        let payload = dataStr;
        try { payload = JSON.parse(dataStr); } catch (_) {}

        // Dispatch
        switch (event) {
          case "token":     onToken?.(payload); break;
          case "gen_done":  onGenDone?.(payload); break;
          case "result":    onResult?.(payload); break;
          case "done":      onDone?.(payload); return; // End of stream
          case "error":     onError?.(payload); return;
          default:          onEvent?.(event, payload); break;
        }
      }
    }
  } catch (err) {
    onError?.(err);
  }
}

