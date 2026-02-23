#!/usr/bin/env python3
"""
OCR Service - Dual Backend
Supports two backends (user-selectable):
  1. GLM-OCR  (THUDM/GLM-OCR)        - via vLLM subprocess, best accuracy
  2. GOT-OCR2 (stepfun-ai/GOT-OCR2_0) - via transformers, no vLLM needed

Endpoints:
  POST /load            {"backend": "glm-ocr"|"got-ocr"}
  POST /unload
  GET  /health
  POST /ocr             {"image": "<base64>", "mode": "general|handwriting|table|format"}
  POST /health-checkup  {"image": "<base64>"}
  POST /pdf             {"file": "<base64>"}

Download models:
  GLM-OCR:   git clone https://huggingface.co/THUDM/GLM-OCR models/GLM-OCR
  GOT-OCR2:  git clone https://huggingface.co/stepfun-ai/GOT-OCR2_0 models/GOT-OCR2_0
"""

import os, sys, json, base64, argparse, io, signal, tempfile, threading, time, subprocess
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler


# ---------------------------------------------------------------------------
# Model path helpers
# ---------------------------------------------------------------------------

def find_path(env_keys, subdirs):
    for key in env_keys:
        v = os.environ.get(key)
        if v and os.path.exists(v) and os.path.exists(os.path.join(v, "config.json")):
            return v
    base = Path(__file__).parent.parent.parent / "models"
    for d in subdirs:
        p = base / d
        if p.exists() and (p / "config.json").exists():
            return str(p)
    return str(base / subdirs[0])


GLM_MODEL_PATH  = find_path(["GLM_OCR_PATH"],  ["GLM-OCR", "glm-ocr"])
GOT_MODEL_PATH  = find_path(["GOT_OCR_PATH"],  ["GOT-OCR2_0", "GOT-OCR2.0", "got-ocr"])

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------

current_backend  = None   # "glm-ocr" | "got-ocr" | None
model_loaded     = False
loading_in_prog  = False
loading_progress = {"stage": "ready", "percent": 0, "message": "ready"}
temp_dir         = None

# Backend instances
_glm_backend = None
_got_backend = None


def update_progress(stage, percent, message=""):
    global loading_progress
    loading_progress = {"stage": stage, "percent": percent, "message": message}
    print(f"[{percent:3d}%] {stage}: {message}", flush=True)


# ---------------------------------------------------------------------------
# GLM-OCR backend  (vLLM subprocess + OpenAI client)
# ---------------------------------------------------------------------------

VLLM_PORT = int(os.environ.get("VLLM_PORT", "8082"))

class GLMOCRBackend:
    def __init__(self):
        self.proc = None          # vLLM subprocess
        self.client = None        # openai.OpenAI client
        self.model_name = "GLM-OCR"

    def load(self):
        if not os.path.exists(GLM_MODEL_PATH):
            update_progress("error", 0,
                f"GLM-OCR model not found: {GLM_MODEL_PATH}\n"
                "Download: git clone https://huggingface.co/THUDM/GLM-OCR models/GLM-OCR")
            return False
        try:
            update_progress("loading", 10, "Checking vLLM installation...")
            try:
                import vllm  # noqa: F401
            except ImportError:
                update_progress("error", 0,
                    "vLLM not installed. Run: pip install vllm\n"
                    "(Requires CUDA GPU. For CPU-only use GOT-OCR2 backend instead.)")
                return False

            # Check if vLLM already running on our port
            if self._ping_vllm():
                update_progress("loading", 80, "Connecting to existing vLLM server...")
            else:
                update_progress("loading", 20, "Starting vLLM server...")
                self._start_vllm()
                update_progress("loading", 40, "Waiting for vLLM to be ready (this may take a few minutes)...")
                if not self._wait_vllm(timeout=300):
                    update_progress("error", 0, "vLLM server failed to start within 5 minutes")
                    self._kill_vllm()
                    return False

            update_progress("loading", 90, "Connecting OpenAI client...")
            from openai import OpenAI
            self.client = OpenAI(api_key="EMPTY", base_url=f"http://127.0.0.1:{VLLM_PORT}/v1")
            update_progress("done", 100, f"GLM-OCR ready via vLLM (port {VLLM_PORT})")
            return True
        except Exception as e:
            update_progress("error", 0, str(e))
            import traceback; traceback.print_exc()
            return False

    def _start_vllm(self):
        cmd = [
            sys.executable, "-m", "vllm.entrypoints.openai.api_server",
            "--model", GLM_MODEL_PATH,
            "--port", str(VLLM_PORT),
            "--trust-remote-code",
            "--max-model-len", "4096",
            "--host", "127.0.0.1",
        ]
        print(f"[INFO] Starting vLLM: {' '.join(cmd)}", flush=True)
        self.proc = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1,
        )
        # Stream vLLM logs in background
        def _log():
            for line in self.proc.stdout:
                print(f"[vLLM] {line}", end="", flush=True)
        threading.Thread(target=_log, daemon=True).start()

    def _ping_vllm(self):
        try:
            import urllib.request
            urllib.request.urlopen(f"http://127.0.0.1:{VLLM_PORT}/health", timeout=2)
            return True
        except Exception:
            return False

    def _wait_vllm(self, timeout=300):
        deadline = time.time() + timeout
        pct = 40
        while time.time() < deadline:
            if self.proc and self.proc.poll() is not None:
                update_progress("error", 0, f"vLLM process exited with code {self.proc.returncode}")
                return False
            if self._ping_vllm():
                return True
            time.sleep(3)
            pct = min(pct + 2, 85)
            update_progress("loading", pct, "Waiting for vLLM server...")
        return False

    def _kill_vllm(self):
        if self.proc:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=10)
            except Exception:
                try: self.proc.kill()
                except Exception: pass
            self.proc = None

    def unload(self):
        self._kill_vllm()
        self.client = None
        update_progress("unloaded", 0, "GLM-OCR unloaded")

    def ocr(self, image_bytes: bytes, mode: str = "general") -> str:
        if not self.client:
            return "[Error] GLM-OCR not loaded"
        try:
            b64 = base64.b64encode(image_bytes).decode()
            prompt = self._mode_prompt(mode)
            resp = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    {"type": "text", "text": prompt},
                ]}],
                max_tokens=4096,
            )
            return resp.choices[0].message.content or "[no text recognized]"
        except Exception as e:
            import traceback; traceback.print_exc()
            return f"[GLM-OCR error] {e}"

    def _mode_prompt(self, mode: str) -> str:
        prompts = {
            "health-checkup": (
                "\u8bc6\u522b\u56fe\u7247\u4e2d\u7684\u4f53\u68c0\u8868\u683c\uff0c"
                "\u8f93\u51fa\u6240\u6709\u6587\u5b57\u5185\u5bb9\uff0c\u4fdd\u6301\u539f\u59cb\u683c\u5f0f\u3002"
            ),
            "table":       "\u8bc6\u522b\u56fe\u7247\u4e2d\u7684\u8868\u683c\uff0c\u4fdd\u6301\u8868\u683c\u7ed3\u6784\u8f93\u51fa\u3002",
            "handwriting": "\u8bc6\u522b\u56fe\u7247\u4e2d\u7684\u624b\u5199\u6587\u5b57\uff0c\u76f4\u63a5\u8f93\u51fa\u8bc6\u522b\u7ed3\u679c\u3002",
            "format":      "\u8bc6\u522b\u56fe\u7247\u4e2d\u7684\u6587\u5b57\uff0c\u4fdd\u6301\u6392\u7248\u683c\u5f0f\u8f93\u51fa\u3002",
        }
        return prompts.get(mode, "\u8bc6\u522b\u56fe\u7247\u4e2d\u7684\u6587\u5b57\u5185\u5bb9\uff0c\u76f4\u63a5\u8f93\u51fa\u8bc6\u522b\u7ed3\u679c\u3002")


# ---------------------------------------------------------------------------
# GOT-OCR2.0 backend  (transformers, no vLLM)
# ---------------------------------------------------------------------------

class GOTOCRBackend:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cpu"

    def load(self):
        if not os.path.exists(GOT_MODEL_PATH):
            update_progress("error", 0,
                f"GOT-OCR2 model not found: {GOT_MODEL_PATH}\n"
                "Download: git clone https://huggingface.co/stepfun-ai/GOT-OCR2_0 models/GOT-OCR2_0")
            return False
        try:
            update_progress("loading", 10, "Importing dependencies...")
            import torch
            from transformers import AutoModel, AutoTokenizer

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"[INFO] Device: {self.device}", flush=True)

            update_progress("loading", 30, "Loading tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(GOT_MODEL_PATH, trust_remote_code=True)

            update_progress("loading", 60, "Loading model weights...")
            kwargs = dict(trust_remote_code=True, low_cpu_mem_usage=True,
                          use_safetensors=True, pad_token_id=self.tokenizer.eos_token_id)
            if self.device == "cuda":
                self.model = AutoModel.from_pretrained(GOT_MODEL_PATH, device_map="cuda", **kwargs).eval().cuda()
            else:
                self.model = AutoModel.from_pretrained(GOT_MODEL_PATH, **kwargs).eval()

            update_progress("done", 100, f"GOT-OCR2 ready on {self.device}")
            return True
        except Exception as e:
            update_progress("error", 0, str(e))
            import traceback; traceback.print_exc()
            return False

    def unload(self):
        if self.model is not None:
            try:
                import torch
                del self.model
                del self.tokenizer
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except Exception:
                pass
            self.model = None
            self.tokenizer = None
        update_progress("unloaded", 0, "GOT-OCR2 unloaded")

    def ocr(self, image_bytes: bytes, mode: str = "general", high_res: bool = False) -> str:
        if self.model is None:
            return "[Error] GOT-OCR2 not loaded"
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_bytes))
            fmt = img.format or "JPEG"
            suffix = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}.get(fmt, ".jpg")
            img_path = _save_tmp(image_bytes, suffix)
            ocr_type = "format" if mode in ("table", "format") else "ocr"
            result = (self.model.chat_crop(self.tokenizer, img_path, ocr_type=ocr_type)
                      if high_res else
                      self.model.chat(self.tokenizer, img_path, ocr_type=ocr_type))
            try: os.remove(img_path)
            except Exception: pass
            return result or "[no text recognized]"
        except Exception as e:
            import traceback; traceback.print_exc()
            return f"[GOT-OCR2 error] {e}"


# ---------------------------------------------------------------------------
# Shared utilities
# ---------------------------------------------------------------------------

def _save_tmp(data: bytes, suffix: str = ".jpg") -> str:
    global temp_dir
    if not temp_dir or not os.path.exists(temp_dir):
        temp_dir = tempfile.mkdtemp(prefix="ocr_svc_")
    fname = os.path.join(temp_dir, f"img_{int(time.time()*1_000_000)}{suffix}")
    with open(fname, "wb") as f:
        f.write(data)
    return fname


def decode_image(data: str) -> bytes:
    if "," in data:
        data = data.split(",", 1)[1]
    return base64.b64decode(data)


def ocr_pdf(pdf_bytes: bytes, mode: str = "general") -> dict:
    try:
        from pdf2image import convert_from_bytes
    except ImportError:
        return {"error": "pdf2image not installed. Run: pip install pdf2image", "pages": 0, "text": ""}
    poppler = os.environ.get("POPPLER_PATH")
    if not poppler and sys.platform == "win32":
        for c in [r"C:\poppler\Library\bin", r"C:\poppler\bin", r"C:\Program Files\poppler\bin"]:
            if os.path.exists(c):
                poppler = c; break
    try:
        kw = {"dpi": 200}
        if poppler: kw["poppler_path"] = poppler
        images = convert_from_bytes(pdf_bytes, **kw)
        texts = []
        for i, img in enumerate(images):
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=95)
            text = _do_ocr(buf.getvalue(), mode=mode, high_res=True)
            texts.append(f"=== Page {i+1} ===\n{text}")
            print(f"[INFO] PDF page {i+1}/{len(images)} done", flush=True)
        return {"pages": len(images), "text": "\n\n".join(texts)}
    except Exception as e:
        msg = str(e)
        if "poppler" in msg.lower():
            msg = ("Poppler not found. Install:\n"
                   "1. Download https://github.com/oschwartz10612/poppler-windows/releases\n"
                   "2. Extract to C:\\poppler\\\n3. Or set POPPLER_PATH env var")
        return {"error": msg, "pages": 0, "text": ""}


def _do_ocr(image_bytes: bytes, mode: str = "general", high_res: bool = False) -> str:
    """Route OCR to the currently loaded backend."""
    if current_backend == "glm-ocr" and _glm_backend:
        return _glm_backend.ocr(image_bytes, mode=mode)
    if current_backend == "got-ocr" and _got_backend:
        return _got_backend.ocr(image_bytes, mode=mode, high_res=high_res)
    return "[Error] No OCR backend loaded"


def extract_health_data(image_bytes: bytes) -> dict:
    text = _do_ocr(image_bytes, mode="health-checkup", high_res=True)
    data = _parse_health(text)
    data["raw_text"] = text
    return data


def _parse_health(text: str) -> dict:
    import re
    data = {}
    def ff(pat):
        m = re.search(pat + r"\s*(\d+\.?\d*)", text, re.IGNORECASE)
        return float(m.group(1)) if m else None
    def fi(pat):
        m = re.search(pat + r"\s*(\d+)", text, re.IGNORECASE)
        return int(m.group(1)) if m else None
    def fs(pat):
        m = re.search(pat + r"\s*(.+?)(?:\s|$|,|\u3002)", text, re.IGNORECASE)
        return m.group(1).strip() if m else None

    for k, p in [("height","\u8eab\u9ad8[\uff1a:]"), ("weight","\u4f53\u91cd[\uff1a:]"),
                 ("bmi","BMI[\uff1a:]"), ("vision_left","\u5de6\u773c[\u89c6\u529b\uff1a:]*"),
                 ("vision_right","\u53f3\u773c[\u89c6\u529b\uff1a:]*"), ("hemoglobin","\u8840\u7ea2\u86cb\u767d[\uff1a:]")]:
        v = ff(p)
        if v: data[k] = v
    for k, p in [("heart_rate","\u5fc3\u7387[\uff1a:]"), ("lung_capacity","\u80ba\u6d3b\u91cf[\uff1a:]")]:
        v = fi(p)
        if v: data[k] = v
    for k, p in [("name","\u59d3\u540d[\uff1a:]"), ("gender","\u6027\u522b[\uff1a:]"),
                 ("student_id","\u5b66\u53f7[\uff1a:]"), ("school","\u5b66\u6821[\uff1a:]")]:
        v = fs(p)
        if v: data[k] = v
    bp = re.search(r"\u8840\u538b[\uff1a:]\s*(\d+)[/\uff0f](\d+)", text)
    if bp:
        data["blood_pressure_systolic"]  = int(bp.group(1))
        data["blood_pressure_diastolic"] = int(bp.group(2))
    if data.get("height") and data.get("weight") and data["height"] > 0:
        h = data["height"] / 100
        data["bmi"] = round(data["weight"] / (h * h), 1)
    return data


# ---------------------------------------------------------------------------
# Load / Unload (run in background thread so /load returns immediately)
# ---------------------------------------------------------------------------

def _load_thread(backend_name: str):
    global current_backend, model_loaded, loading_in_prog, _glm_backend, _got_backend
    loading_in_prog = True
    model_loaded = False
    current_backend = None

    try:
        if backend_name == "glm-ocr":
            if _glm_backend is None:
                _glm_backend = GLMOCRBackend()
            ok = _glm_backend.load()
            if ok:
                current_backend = "glm-ocr"
                model_loaded = True
        elif backend_name == "got-ocr":
            if _got_backend is None:
                _got_backend = GOTOCRBackend()
            ok = _got_backend.load()
            if ok:
                current_backend = "got-ocr"
                model_loaded = True
        else:
            update_progress("error", 0, f"Unknown backend: {backend_name}")
    except Exception as e:
        update_progress("error", 0, str(e))
        import traceback; traceback.print_exc()
    finally:
        loading_in_prog = False


def start_load(backend_name: str):
    global loading_in_prog
    if loading_in_prog:
        return False, "Already loading"
    t = threading.Thread(target=_load_thread, args=(backend_name,), daemon=True)
    t.start()
    return True, "Loading started"


def do_unload():
    global current_backend, model_loaded, loading_in_prog
    if loading_in_prog:
        return False, "Cannot unload while loading"
    if current_backend == "glm-ocr" and _glm_backend:
        _glm_backend.unload()
    elif current_backend == "got-ocr" and _got_backend:
        _got_backend.unload()
    current_backend = None
    model_loaded = False
    if temp_dir and os.path.exists(temp_dir):
        try:
            import shutil; shutil.rmtree(temp_dir)
        except Exception: pass
    return True, "Model unloaded"


# ---------------------------------------------------------------------------
# HTTP Handler
# ---------------------------------------------------------------------------

class OCRHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {
                "status": "loading" if loading_in_prog else ("loaded" if model_loaded else "not_loaded"),
                "model_loaded": model_loaded,
                "loading": loading_in_prog,
                "progress": loading_progress,
                "backend": current_backend,
                "backends": {
                    "glm-ocr":  {"path": GLM_MODEL_PATH, "available": os.path.exists(GLM_MODEL_PATH)},
                    "got-ocr":  {"path": GOT_MODEL_PATH, "available": os.path.exists(GOT_MODEL_PATH)},
                },
            })
        else:
            self.send_json(200, {
                "service": "OCR Dual-Backend Service",
                "model_loaded": model_loaded,
                "backend": current_backend,
                "endpoints": {
                    "POST /load":           '{"backend": "glm-ocr"|"got-ocr"}',
                    "POST /unload":         "Unload current backend",
                    "POST /ocr":            '{"image": "<b64>", "mode": "general|handwriting|table|format"}',
                    "POST /health-checkup": '{"image": "<b64>"}',
                    "POST /pdf":            '{"file": "<b64>"}',
                },
            })

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        if self.path == "/load":
            try:
                data = json.loads(body) if body else {}
            except Exception:
                data = {}
            backend = data.get("backend", "got-ocr")
            ok, msg = start_load(backend)
            if ok:
                self.send_json(200, {"success": True, "loading": True, "message": msg, "backend": backend})
            else:
                self.send_json(409, {"success": False, "error": msg})
            return

        if self.path == "/unload":
            ok, msg = do_unload()
            self.send_json(200 if ok else 409, {"success": ok, "message": msg, "model_loaded": False})
            return

        try:
            data = json.loads(body.decode("utf-8")) if body else {}
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid JSON"}); return

        if loading_in_prog:
            self.send_json(503, {"error": "Model is loading, please wait"}); return
        if not model_loaded:
            self.send_json(503, {"error": "Model not loaded", "tip": "POST /load"}); return

        try:
            if self.path == "/ocr":
                img_data = data.get("image", "")
                if not img_data:
                    self.send_json(400, {"error": "No image provided"}); return
                mode = data.get("mode", "general")
                high_res = data.get("high_res", False)
                img_bytes = decode_image(img_data)
                text = _do_ocr(img_bytes, mode=mode, high_res=high_res)
                self.send_json(200, {"success": True, "text": text, "backend": current_backend})

            elif self.path == "/health-checkup":
                img_data = data.get("image", "")
                if not img_data:
                    self.send_json(400, {"error": "No image provided"}); return
                result = extract_health_data(decode_image(img_data))
                self.send_json(200, {"success": True, "data": result, "backend": current_backend})

            elif self.path == "/pdf":
                file_data = data.get("file", "")
                if not file_data:
                    self.send_json(400, {"error": "No file provided"}); return
                if "," in file_data:
                    file_data = file_data.split(",", 1)[1]
                result = ocr_pdf(base64.b64decode(file_data), mode=data.get("mode", "general"))
                if "error" in result:
                    self.send_json(500, result)
                else:
                    self.send_json(200, {"success": True, **result, "backend": current_backend})

            else:
                self.send_json(404, {"error": f"Unknown endpoint: {self.path}"})

        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json(500, {"error": str(e)})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def signal_handler(sig, frame):
    print("\nShutting down...", flush=True)
    do_unload()
    sys.exit(0)


def main():
    parser = argparse.ArgumentParser(description="OCR Dual-Backend Service")
    parser.add_argument("--port", type=int, default=8081)
    parser.add_argument("--auto-load", choices=["glm-ocr", "got-ocr"], default=None,
                        help="Auto-load a backend on startup")
    args = parser.parse_args()

    signal.signal(signal.SIGINT,  signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print(f"OCR Dual-Backend Service | Port: {args.port}", flush=True)
    print(f"  GLM-OCR  path: {GLM_MODEL_PATH} ({'found' if os.path.exists(GLM_MODEL_PATH) else 'NOT FOUND'})", flush=True)
    print(f"  GOT-OCR2 path: {GOT_MODEL_PATH} ({'found' if os.path.exists(GOT_MODEL_PATH) else 'NOT FOUND'})", flush=True)

    if args.auto_load:
        start_load(args.auto_load)

    server = HTTPServer(("127.0.0.1", args.port), OCRHandler)
    print(f"Listening on http://127.0.0.1:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        do_unload()
        server.shutdown()


if __name__ == "__main__":
    main()

