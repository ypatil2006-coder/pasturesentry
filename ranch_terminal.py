#!/usr/bin/env python3
"""
PastureSentry AI — Live Edge Neural Telemetry Monitor & UI Proxy
Passively intercepts UI queries from the web dashboard on port 11434,
forwards to local Ollama on port 11435, and streams live tokens to this terminal.

No typing required in terminal! Interact strictly via the Web UI.
"""
import sys
import os
import time
import json
import re
import socket
import shutil
import subprocess
from datetime import datetime
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error

PROXY_PORT = 11434
OLLAMA_PORT = 11435
OLLAMA_BASE = f"http://127.0.0.1:{OLLAMA_PORT}"

# ANSI Colors
CLR_RESET = "\033[0m"
CLR_BOLD = "\033[1m"
CLR_GREEN = "\033[1;32m"
CLR_YELLOW = "\033[1;33m"
CLR_CYAN = "\033[1;36m"
CLR_MAGENTA = "\033[1;35m"
CLR_RED = "\033[1;31m"
CLR_WHITE = "\033[1;37m"
CLR_DIM = "\033[2m"

def get_divider(char="=", max_len=68):
    cols = shutil.get_terminal_size((max_len, 20)).columns
    return char * min(cols - 2, max_len)

def is_port_listening(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0

def ensure_ollama_backend():
    """Ensure Ollama daemon is active on OLLAMA_PORT (11435)."""
    if is_port_listening(OLLAMA_PORT):
        return True

    print(f"{CLR_YELLOW}[SETUP] Starting local Ollama backend on port {OLLAMA_PORT}...{CLR_RESET}")
    if is_port_listening(PROXY_PORT):
        os.system("fuser -k 11434/tcp >/dev/null 2>&1 || pkill -f 'ollama serve' 2>/dev/null")
        time.sleep(1)

    env = os.environ.copy()
    env["HOME"] = "/home/yash"
    env["OLLAMA_MODELS"] = "/home/yash/.ollama/models"
    env["OLLAMA_HOST"] = f"127.0.0.1:{OLLAMA_PORT}"
    
    subprocess.Popen(
        ["/home/yash/.local/bin/ollama", "serve"],
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    
    for _ in range(15):
        time.sleep(0.5)
        if is_port_listening(OLLAMA_PORT):
            print(f"{CLR_GREEN}✓ Ollama backend ready on port {OLLAMA_PORT}{CLR_RESET}")
            return True

    print(f"{CLR_RED}✗ Could not start Ollama on port {OLLAMA_PORT}{CLR_RESET}")
    return False

def extract_user_friendly_query(prompt: str) -> str:
    """Extracts human-readable instruction or question from frontend prompt wrapper."""
    match_nl = re.search(r'User Instruction:\s*"(.*?)"', prompt, re.DOTALL)
    if match_nl:
        return match_nl.group(1).strip()

    match_chat = re.search(r'Rancher Query:\s*(.*?)(?:\nAnswer|$)', prompt, re.DOTALL)
    if match_chat:
        return match_chat.group(1).strip()

    if "Tactical Emergency Dispatcher" in prompt or "curfew breach" in prompt.lower():
        match_missing = re.search(r'(\d+)\s*cattle are missing', prompt)
        cnt = match_missing.group(1) if match_missing else "4"
        return f"Emergency SAR Vector Synthesis ({cnt} cattle missing past curfew)"

    return prompt.strip()[:140]

class LiveProxyHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        url = f"{OLLAMA_BASE}{self.path}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PastureSentryProxy"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read()
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ["content-length", "access-control-allow-origin"]:
                        self.send_header(k, v)
                self.send_cors_headers()
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except Exception as e:
            self.send_response(502)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_len)

        if self.path == "/api/generate":
            self.handle_generate(body_bytes)
        else:
            self.forward_generic_post(body_bytes)

    def forward_generic_post(self, body_bytes: bytes):
        url = f"{OLLAMA_BASE}{self.path}"
        try:
            req = urllib.request.Request(
                url,
                data=body_bytes,
                headers={"Content-Type": "application/json", "User-Agent": "PastureSentryProxy"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ["content-length", "access-control-allow-origin"]:
                        self.send_header(k, v)
                self.send_cors_headers()
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except Exception as e:
            self.send_response(502)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def handle_generate(self, body_bytes: bytes):
        try:
            payload = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            self.forward_generic_post(body_bytes)
            return

        model = payload.get("model", "qwen2.5-coder:3b")
        prompt = payload.get("prompt", "")
        user_query = extract_user_friendly_query(prompt)
        timestamp = datetime.now().strftime("%H:%M:%S")

        div = get_divider("=")
        subdiv = get_divider("-")

        # Terminal Visual Notification
        print("\n" + CLR_YELLOW + div + CLR_RESET)
        print(f"{CLR_CYAN}⚡ [LIVE UI INTERACTION CAPTURED FROM WEB COCKPIT]{CLR_RESET} {CLR_DIM}[{timestamp}]{CLR_RESET}")
        print(f"{CLR_WHITE}RANCHER QUERY :{CLR_RESET} {CLR_BOLD}\"{user_query}\"{CLR_RESET}")
        print(f"{CLR_WHITE}TARGET MODEL  :{CLR_RESET} {CLR_GREEN}{model}{CLR_RESET} {CLR_DIM}(Offline Edge GPU){CLR_RESET}")
        print(f"{CLR_WHITE}CONNECTIVITY  :{CLR_RESET} {CLR_GREEN}100% LOCAL WEIGHTS — ZERO INTERNET REQUIRED{CLR_RESET}")
        print(CLR_YELLOW + subdiv + CLR_RESET)
        print(f"{CLR_MAGENTA}🧠 [LOCAL MODEL REASONING & GENERATING STREAMED TOKENS]:{CLR_RESET}\n")

        upstream_payload = dict(payload)
        upstream_payload["stream"] = True

        start_time = time.time()
        token_count = 0
        accumulated_text = ""

        try:
            req = urllib.request.Request(
                f"{OLLAMA_BASE}/api/generate",
                data=json.dumps(upstream_payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )

            with urllib.request.urlopen(req, timeout=45) as resp:
                for line in resp:
                    if not line:
                        continue
                    line_str = line.decode("utf-8").strip()
                    if not line_str:
                        continue
                    try:
                        chunk = json.loads(line_str)
                        token = chunk.get("response", "")
                        if token:
                            token_count += 1
                            accumulated_text += token
                            sys.stdout.write(f"{CLR_GREEN}{token}{CLR_RESET}")
                            sys.stdout.flush()
                        if chunk.get("done", False):
                            break
                    except json.JSONDecodeError:
                        continue

            total_duration = time.time() - start_time
            speed = token_count / total_duration if total_duration > 0 else 0

            # Clean code fence if wrapped
            clean_display = accumulated_text.strip()

            print("\n" + CLR_YELLOW + subdiv + CLR_RESET)
            print(f"{CLR_WHITE}✓ INFERENCE FINISHED :{CLR_RESET} {CLR_GREEN}{token_count} tokens{CLR_RESET} in {CLR_GREEN}{total_duration:.2f}s{CLR_RESET} ({CLR_CYAN}{speed:.1f} tokens/sec{CLR_RESET})")
            print(f"{CLR_WHITE}✓ DISPATCHED TO UI   :{CLR_RESET} Rendered in Web Cockpit immediately")
            print(CLR_YELLOW + div + CLR_RESET)
            print(f"\n{CLR_DIM}[WAITING FOR NEXT QUERY FROM BROWSER UI...]{CLR_RESET}")

            final_resp = {
                "model": model,
                "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "response": accumulated_text,
                "done": True,
                "total_duration": int(total_duration * 1e9),
                "eval_count": token_count,
            }
            final_bytes = json.dumps(final_resp).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_cors_headers()
            self.send_header("Content-Length", str(len(final_bytes)))
            self.end_headers()
            self.wfile.write(final_bytes)

        except Exception as err:
            print(f"\n{CLR_RED}[PROXY ERROR] Upstream generation error: {err}{CLR_RESET}\n")
            self.send_response(500)
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(err)}).encode())

def print_banner():
    os.system("clear" if os.name == "posix" else "cls")
    div = get_divider("=")
    print(CLR_YELLOW + div + CLR_RESET)
    print(f"  {CLR_GREEN}🤠 PASTURESENTRY AI — LIVE EDGE NEURAL TELEMETRY MONITOR{CLR_RESET}")
    print(f"  {CLR_CYAN}Model   : qwen2.5-coder:3b (Offline Edge Hardware) | Zero Cloud{CLR_RESET}")
    print(f"  {CLR_WHITE}Gateway : http://localhost:{PROXY_PORT} (Capturing UI requests live){CLR_RESET}")
    print(f"  {CLR_WHITE}Status  : {CLR_GREEN}PASSIVE MONITOR ACTIVE — ZERO TYPING REQUIRED{CLR_RESET}")
    print(CLR_YELLOW + div + CLR_RESET)
    print(f"\n{CLR_BOLD}💡 HOW TO USE IN DEMO:{CLR_RESET}")
    print(f"  1. Keep this terminal open on one side of your screen.")
    print(f"  2. Open your browser to {CLR_CYAN}http://localhost:5173/#cockpit{CLR_RESET}.")
    print(f"  3. Click ANY 1-click suggestion or type any prompt in the UI.")
    print(f"  4. Watch this terminal light up with the prompt & streamed tokens live!\n")
    print(f"{CLR_GREEN}● LISTENING FOR BROWSER / UI INTERACTIONS...{CLR_RESET}\n")

def main():
    if not ensure_ollama_backend():
        sys.exit(1)

    if is_port_listening(PROXY_PORT):
        os.system(f"fuser -k {PROXY_PORT}/tcp >/dev/null 2>&1")
        time.sleep(0.5)

    server = ThreadingHTTPServer(("0.0.0.0", PROXY_PORT), LiveProxyHandler)
    print_banner()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print(f"\n{CLR_YELLOW}[SHUTDOWN] Stopping PastureSentry Live Monitor...{CLR_RESET}")
        server.shutdown()
        print(f"{CLR_GREEN}Monitor stopped cleanly.{CLR_RESET}")

if __name__ == "__main__":
    main()
