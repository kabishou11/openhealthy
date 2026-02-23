#!/usr/bin/env python3
"""
OCR Service - GOT-OCR2.0 (General OCR Theory)
Local inference, no API calls required.
Model: stepfun-ai/GOT-OCR2_0 (ucaslcl/GOT-OCR2_0)

Supports:
  - Plain text OCR
  - Formatted OCR (tables, formulas, markdown)
  - Fine-grained OCR (by region box or color)
  - Multi-crop OCR (high-resolution images)
  - PDF OCR (via pdf2image)
  - Handwriting recognition

Usage:
    python glm-ocr-service.py [--port 8081] [--model-path PATH] [--auto-load]

Download model:
    # From HuggingFace
    git clone https://huggingface.co/stepfun-ai/GOT-OCR2_0 models/GOT-OCR2_0
    # From ModelScope
    modelscope download --model stepfun-ai/GOT-OCR2_0 --local_dir models/GOT-OCR2_0
"""

import os
import sys
import json
import base64
import argparse
import io
import signal
import tempfile
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler


def find_model_path():
    """Find GOT-OCR2.0 model path"""
    possible_paths = [
        Path(__file__).parent.parent.parent / "models" / "GOT-OCR2_0",
        Path(__file__).parent.parent.parent / "models" / "GOT-OCR2.0",
        Path(__file__).parent.parent.parent / "models" / "got-ocr",
        Path(os.path.expanduser("~")) / "models" / "GOT-OCR2_0",
    ]
    env_path = os.environ.get("GOT_OCR_PATH") or os.environ.get("GLM_OCR_PATH")
    if env_path:
        possible_paths.insert(0, Path(env_path))
    for path in possible_paths:
        if path.exists() and (path / "config.json").exists():
            print(f"[INFO] Found model at: {path}", flush=True)
            return str(path)
    return str(possible_paths[0])


MODEL_PATH = find_model_path()

# Global state
ocr_engine = None
model_loaded = False
loading_progress = {"stage": "ready", "percent": 0, "message": "ready"}
temp_dir = None


def update_progress(stage, percent, message=""):
    global loading_progress
    loading_progress = {"stage": stage, "percent": percent, "message": message}
    print(f"[{percent:3d}%] {stage}: {message}", flush=True)


def load_model():
    global ocr_engine, model_loaded, temp_dir

    if model_loaded:
        return True

    if not os.path.exists(MODEL_PATH):
        update_progress("error", 0,
            f"Model not found: {MODEL_PATH}\n"
            "Download: git clone https://huggingface.co/stepfun-ai/GOT-OCR2_0 models/GOT-OCR2_0"
        )
        return False

    try:
        update_progress("loading", 10, "Importing dependencies...")
        import torch
        from transformers import AutoModel, AutoTokenizer

        temp_dir = tempfile.mkdtemp(prefix="got_ocr_")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[INFO] Device: {device}", flush=True)

        update_progress("loading", 30, "Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)

        update_progress("loading", 60, "Loading model weights...")
        if device == "cuda":
            model = AutoModel.from_pretrained(
                MODEL_PATH,
                trust_remote_code=True,
                low_cpu_mem_usage=True,
                device_map="cuda",
                use_safetensors=True,
                pad_token_id=tokenizer.eos_token_id,
            ).eval().cuda()
        else:
            # CPU mode - slower but functional
            model = AutoModel.from_pretrained(
                MODEL_PATH,
                trust_remote_code=True,
                low_cpu_mem_usage=True,
                use_safetensors=True,
                pad_token_id=tokenizer.eos_token_id,
            ).eval()

        ocr_engine = {"model": model, "tokenizer": tokenizer, "device": device}
        update_progress("done", 100, f"Model loaded on {device}")
        model_loaded = True
        return True

    except Exception as e:
        update_progress("error", 0, str(e))
        import traceback
        traceback.print_exc()
        return False


def unload_model():
    global ocr_engine, model_loaded, temp_dir

    if ocr_engine:
        try:
            import torch
            del ocr_engine["model"]
            del ocr_engine["tokenizer"]
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass
        ocr_engine = None

    if temp_dir and os.path.exists(temp_dir):
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except Exception:
            pass
        temp_dir = None

    model_loaded = False
    update_progress("unloaded", 0, "Model unloaded")
    return True


def save_image_bytes(image_bytes: bytes, suffix: str = ".jpg") -> str:
    """Save image bytes to a temp file and return the path"""
    global temp_dir
    if temp_dir is None or not os.path.exists(temp_dir):
        temp_dir = tempfile.mkdtemp(prefix="got_ocr_")

    import time
    fname = os.path.join(temp_dir, f"img_{int(time.time()*1000000)}{suffix}")
    with open(fname, "wb") as f:
        f.write(image_bytes)
    return fname


def decode_image(image_data: str) -> bytes:
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]
    return base64.b64decode(image_data)


def ocr_image(image_bytes: bytes, ocr_type: str = "ocr", high_res: bool = False) -> str:
    """
    Run GOT-OCR2.0 on image bytes.
    ocr_type: 'ocr' (plain text) | 'format' (tables/formulas/markdown)
    high_res: use chat_crop for high-resolution images
    """
    global ocr_engine

    if ocr_engine is None:
        return "Error: model not loaded"

    try:
        from PIL import Image

        # Detect image format
        img = Image.open(io.BytesIO(image_bytes))
        fmt = img.format or "JPEG"
        suffix = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "GIF": ".gif"}.get(fmt, ".jpg")

        # Save to temp file (GOT-OCR2.0 requires file path)
        img_path = save_image_bytes(image_bytes, suffix)

        model = ocr_engine["model"]
        tokenizer = ocr_engine["tokenizer"]

        if high_res:
            result = model.chat_crop(tokenizer, img_path, ocr_type=ocr_type)
        else:
            result = model.chat(tokenizer, img_path, ocr_type=ocr_type)

        # Clean up temp file
        try:
            os.remove(img_path)
        except Exception:
            pass

        return result if result else "[no text recognized]"

    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"[OCR error] {str(e)}"


def ocr_pdf(pdf_bytes: bytes, ocr_type: str = "ocr") -> dict:
    """Convert PDF pages to images and OCR each page"""
    try:
        from pdf2image import convert_from_bytes
        from pdf2image.exceptions import PDFInfoNotInstalledError
    except ImportError:
        return {"error": "pdf2image not installed. Run: pip install pdf2image", "pages": 0, "text": ""}

    # Find poppler on Windows
    poppler_path = os.environ.get("POPPLER_PATH")
    if not poppler_path and sys.platform == "win32":
        candidates = [
            r"C:\poppler\Library\bin",
            r"C:\poppler\bin",
            r"C:\Program Files\poppler\bin",
            str(Path(__file__).parent.parent.parent / "poppler" / "bin"),
        ]
        for c in candidates:
            if os.path.exists(c):
                poppler_path = c
                break

    try:
        kwargs = {"dpi": 200}
        if poppler_path:
            kwargs["poppler_path"] = poppler_path

        images = convert_from_bytes(pdf_bytes, **kwargs)
        page_texts = []
        for i, image in enumerate(images):
            buf = io.BytesIO()
            image.save(buf, format="JPEG", quality=95)
            text = ocr_image(buf.getvalue(), ocr_type=ocr_type, high_res=True)
            page_texts.append(f"=== Page {i + 1} ===\n{text}")
            print(f"[INFO] PDF page {i + 1}/{len(images)} done", flush=True)

        return {"pages": len(images), "text": "\n\n".join(page_texts)}

    except Exception as e:
        err_msg = str(e)
        if "poppler" in err_msg.lower() or "pdfinfo" in err_msg.lower():
            err_msg = (
                "Poppler not found. Install for Windows:\n"
                "1. Download https://github.com/oschwartz10612/poppler-windows/releases\n"
                "2. Extract to C:\\poppler\\\n"
                "3. Or set POPPLER_PATH env var"
            )
        return {"error": err_msg, "pages": 0, "text": ""}


def extract_health_data(image_bytes: bytes) -> dict:
    """Extract structured health data from image using formatted OCR"""
    # Use 'format' type for better table/structured data recognition
    text = ocr_image(image_bytes, ocr_type="format", high_res=True)
    data = parse_health_data(text)
    data["raw_text"] = text
    return data


def parse_health_data(text: str) -> dict:
    import re
    data = {}

    def find_float(pattern):
        m = re.search(pattern + r"\s*(\d+\.?\d*)", text, re.IGNORECASE)
        if m:
            try: return float(m.group(1))
            except ValueError: pass
        return None

    def find_int(pattern):
        m = re.search(pattern + r"\s*(\d+)", text, re.IGNORECASE)
        if m:
            try: return int(m.group(1))
            except ValueError: pass
        return None

    def find_str(pattern):
        m = re.search(pattern + r"\s*(.+?)(?:\s|$|,|\u3002)", text, re.IGNORECASE)
        return m.group(1).strip() if m else None

    v = find_float(r"\u8eab\u9ad8[\uff1a:]");
    if v: data["height"] = v
    v = find_float(r"\u4f53\u91cd[\uff1a:]")
    if v: data["weight"] = v
    v = find_float(r"BMI[\uff1a:]")
    if v: data["bmi"] = v
    v = find_float(r"\u5de6\u773c[\u89c6\u529b\uff1a:]*")
    if v: data["vision_left"] = v
    v = find_float(r"\u53f3\u773c[\u89c6\u529b\uff1a:]*")
    if v: data["vision_right"] = v
    v = find_float(r"\u8840\u7ea2\u86cb\u767d[\uff1a:]")
    if v: data["hemoglobin"] = v
    v = find_int(r"\u5fc3\u7387[\uff1a:]")
    if v: data["heart_rate"] = v
    v = find_int(r"\u80ba\u6d3b\u91cf[\uff1a:]")
    if v: data["lung_capacity"] = v
    v = find_str(r"\u59d3\u540d[\uff1a:]")
    if v: data["name"] = v
    v = find_str(r"\u6027\u522b[\uff1a:]")
    if v: data["gender"] = v
    v = find_str(r"\u5b66\u53f7[\uff1a:]")
    if v: data["student_id"] = v
    v = find_str(r"\u5b66\u6821[\uff1a:]")
    if v: data["school"] = v

    bp = re.search(r"\u8840\u538b[\uff1a:]\s*(\d+)[/\uff0f](\d+)", text)
    if bp:
        try:
            data["blood_pressure_systolic"] = int(bp.group(1))
            data["blood_pressure_diastolic"] = int(bp.group(2))
        except (ValueError, IndexError):
            pass

    if data.get("height") and data.get("weight") and data["height"] > 0:
        h = data["height"] / 100
        data["bmi"] = round(data["weight"] / (h * h), 1)

    allergy = re.search(r"\u8fc7\u654f[\u539f\u7269]?[\uff1a:]\s*(.+?)(?:\s|$|\u3002)", text)
    if allergy:
        data["allergies"] = [x.strip() for x in re.split(r"[,\uff0c\u3001]", allergy.group(1)) if x.strip()]

    condition = re.search(r"\u65e2\u5f80[\u75c5\u75be]\u53f2[\uff1a:]\s*(.+?)(?:\s|$|\u3002)", text)
    if condition:
        data["conditions"] = [x.strip() for x in re.split(r"[,\uff0c\u3001]", condition.group(1)) if x.strip()]

    return data


class OCRHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

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
                "status": "healthy" if model_loaded else "not_loaded",
                "model_loaded": model_loaded,
                "progress": loading_progress,
                "service": "got-ocr2",
                "model_path": MODEL_PATH,
            })
        else:
            self.send_json(200, {
                "service": "GOT-OCR2.0 Service",
                "model_loaded": model_loaded,
                "model_path": MODEL_PATH,
                "endpoints": {
                    "POST /load": "Load model",
                    "POST /unload": "Unload model",
                    "POST /ocr": "OCR image (mode: ocr|format|handwriting|table, high_res: bool)",
                    "POST /health-checkup": "Extract health data from image",
                    "POST /pdf": "OCR PDF file",
                }
            })

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        # Load/unload don't need JSON body
        if self.path == "/load":
            success = load_model()
            if success:
                self.send_json(200, {"success": True, "message": "Model loaded", "model_loaded": True})
            else:
                self.send_json(500, {"success": False, "error": "Load failed", "progress": loading_progress})
            return

        if self.path == "/unload":
            unload_model()
            self.send_json(200, {"success": True, "message": "Model unloaded", "model_loaded": False})
            return

        try:
            data = json.loads(body.decode("utf-8")) if body else {}
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid JSON"})
            return

        if not model_loaded:
            self.send_json(503, {"error": "Model not loaded", "tip": "POST /load"})
            return

        try:
            if self.path == "/ocr":
                image_data = data.get("image", "")
                if not image_data:
                    self.send_json(400, {"error": "No image provided"})
                    return

                mode = data.get("mode", "general")
                high_res = data.get("high_res", False)

                # Map mode to ocr_type
                if mode in ("format", "table"):
                    ocr_type = "format"
                else:
                    ocr_type = "ocr"  # plain text, handwriting, general

                image_bytes = decode_image(image_data)
                text = ocr_image(image_bytes, ocr_type=ocr_type, high_res=high_res)
                self.send_json(200, {"success": True, "text": text})

            elif self.path == "/health-checkup":
                image_data = data.get("image", "")
                if not image_data:
                    self.send_json(400, {"error": "No image provided"})
                    return
                image_bytes = decode_image(image_data)
                result = extract_health_data(image_bytes)
                self.send_json(200, {"success": True, "data": result})

            elif self.path == "/pdf":
                file_data = data.get("file", "")
                ocr_type = data.get("ocr_type", "format")
                if not file_data:
                    self.send_json(400, {"error": "No file provided"})
                    return
                if "," in file_data:
                    file_data = file_data.split(",", 1)[1]
                pdf_bytes = base64.b64decode(file_data)
                result = ocr_pdf(pdf_bytes, ocr_type=ocr_type)
                if "error" in result:
                    self.send_json(500, result)
                else:
                    self.send_json(200, {"success": True, **result})

            else:
                self.send_json(404, {"error": f"Unknown endpoint: {self.path}"})

        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_json(500, {"error": str(e)})


def signal_handler(sig, frame):
    print("\nShutting down...", flush=True)
    unload_model()
    sys.exit(0)


def main():
    global MODEL_PATH

    parser = argparse.ArgumentParser(description="GOT-OCR2.0 Service")
    parser.add_argument("--port", type=int, default=8081)
    parser.add_argument("--model-path", type=str, default=None)
    parser.add_argument("--auto-load", action="store_true")
    args = parser.parse_args()

    if args.model_path:
        MODEL_PATH = args.model_path

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print(f"GOT-OCR2.0 Service | Port: {args.port} | Model: {MODEL_PATH}", flush=True)

    if args.auto_load:
        load_model()

    server = HTTPServer(("127.0.0.1", args.port), OCRHandler)
    print(f"Listening on http://127.0.0.1:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        unload_model()
        server.shutdown()


if __name__ == "__main__":
    main()
