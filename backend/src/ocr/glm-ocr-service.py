#!/usr/bin/env python3
"""
GLM-OCR Service - Using transformers with correct chat template
Based on official GLM-OCR README usage pattern

Usage:
    python glm-ocr-service.py [--port PORT] [--model-path PATH] [--auto-load]
"""

import os
import sys
import json
import base64
import argparse
import time
import io
import signal
import tempfile
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

# Cross-platform model path detection
def find_model_path():
    """Find GLM-OCR model path - checks multiple possible locations"""
    possible_paths = [
        # Project relative paths
        Path(__file__).parent.parent.parent / "models" / "GLM-OCR",
        Path(__file__).parent.parent / "models" / "GLM-OCR",
        Path(__file__).parent / "models" / "GLM-OCR",
        # Absolute paths (macOS)
        Path("/Users/kabishou11/Code/openhelthy/models/GLM-OCR"),
        # Windows
        Path("C:/openhelthy/models/GLM-OCR"),
        Path("D:/openhelthy/models/GLM-OCR"),
        Path(os.path.expanduser("~") + "/Code/openhelthy/models/GLM-OCR"),
    ]

    # Environment variable override
    env_path = os.environ.get("GLM_OCR_PATH")
    if env_path:
        possible_paths.insert(0, Path(env_path))

    for path in possible_paths:
        if path.exists() and (path / "config.json").exists():
            print(f"[INFO] Found model at: {path}")
            return str(path)

    return str(possible_paths[0])

GLM_OCR_PATH = find_model_path()

# Global state
ocr_engine = None
model_loaded = False
use_fallback = False  # GLM-OCR is primary, no fallback
loading_progress = {"stage": "就绪", "percent": 0, "message": "就绪"}
temp_dir = None

def update_progress(stage, progress, message=""):
    global loading_progress
    loading_progress = {"stage": stage, "percent": progress, "message": message}
    print(f"[{progress:3d}%] {stage}: {message}")

def load_model():
    """Load GLM-OCR using transformers with correct chat template approach"""
    global ocr_engine, model_loaded, use_fallback, temp_dir

    if model_loaded:
        return True

    # Check if model path exists
    if not os.path.exists(GLM_OCR_PATH):
        update_progress("错误", 0, f"模型不存在: {GLM_OCR_PATH}")
        return False

    try:
        update_progress("加载中", 10, "正在导入依赖...")

        import torch
        from transformers import AutoProcessor, AutoModelForImageTextToText

        # Create temp directory for image processing
        temp_dir = tempfile.mkdtemp(prefix="glm_ocr_")

        update_progress("加载中", 30, "正在加载处理器和模型...")
        # Use AutoProcessor which handles both tokenizer and image processor
        processor = AutoProcessor.from_pretrained(GLM_OCR_PATH, trust_remote_code=True)

        update_progress("加载中", 60, "正在加载模型权重...")
        # Use CPU for now, GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[INFO] Using device: {device}")

        model = AutoModelForImageTextToText.from_pretrained(
            GLM_OCR_PATH,
            trust_remote_code=True,
            torch_dtype=torch.float32,
            device_map=device if device == "cuda" else None
        )

        ocr_engine = {
            "model": model,
            "processor": processor,
            "device": device
        }
        use_fallback = False

        update_progress("完成", 100, "模型加载完成")
        model_loaded = True
        print(f"[INFO] GLM-OCR model loaded from: {GLM_OCR_PATH}")
        return True

    except Exception as e:
        update_progress("错误", 0, f"GLM-OCR加载失败: {str(e)}")
        import traceback
        traceback.print_exc()
        use_fallback = True
        model_loaded = True
        return True

def unload_model():
    """Unload model to free memory"""
    global ocr_engine, model_loaded, use_fallback, temp_dir

    if ocr_engine:
        try:
            if "model" in ocr_engine:
                del ocr_engine["model"]
            if "processor" in ocr_engine:
                del ocr_engine["processor"]
        except:
            pass
        ocr_engine = None

    # Clean up temp directory
    if temp_dir and os.path.exists(temp_dir):
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass
        temp_dir = None

    model_loaded = False
    use_fallback = True
    update_progress("已卸载", 0, "模型已卸载")
    return True

def save_image_to_temp(image_bytes: bytes) -> str:
    """Save image bytes to temp file and return path"""
    global temp_dir
    if temp_dir is None:
        temp_dir = tempfile.mkdtemp(prefix="glm_ocr_")

    # Generate unique filename
    timestamp = int(time.time() * 1000000)
    image_path = os.path.join(temp_dir, f"image_{timestamp}.jpg")

    # Save image
    from PIL import Image
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image.save(image_path, format='JPEG', quality=95)

    return image_path

def ocr_with_engine_direct(image_bytes: bytes, prompt: str = "Text Recognition:") -> str:
    """Perform OCR using GLM-OCR model with correct chat template"""
    global ocr_engine, temp_dir

    if ocr_engine is None:
        return "Error: 模型未加载"

    try:
        import torch
        import re

        # Save image to temp file (required for the processor)
        image_path = save_image_to_temp(image_bytes)
        print(f"[DEBUG] Processing image: {image_path}")

        # Get components
        device = ocr_engine.get("device", "cpu")
        processor = ocr_engine["processor"]
        model = ocr_engine["model"]

        # Build messages in the format specified in README
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "url": image_path},
                    {"type": "text", "text": prompt},
                ],
            }
        ]

        # Apply chat template and prepare inputs (following README exactly)
        inputs = processor.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt"
        ).to(model.device)

        # Remove token_type_ids if present (required by some models)
        inputs.pop("token_type_ids", None)

        # Generate
        print(f"[DEBUG] Generating OCR result...")
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=8192,
                do_sample=False,
                pad_token_id=processor.tokenizer.eos_token_id
            )

        # Decode only the generated part (skip input tokens)
        output_text = processor.decode(
            generated_ids[0][inputs["input_ids"].shape[1]:],
            skip_special_tokens=False
        )

        print(f"[DEBUG] Raw output: {output_text[:200]}...")

        # Clean up special tokens and markers
        result = output_text

        # Remove GLM special tokens
        result = re.sub(r'<\|[a-z_]+\|>', '', result)

        # Remove thinking blocks if present
        result = re.sub(r'<\|begin_of_thinking\|>.*?<\|end_of_thinking\|>', '', result, flags=re.DOTALL)

        # Clean up common artifacts
        result = result.replace("<|endoftext|>", "").strip()
        result = result.strip()

        # Validate result
        if result and len(result) > 5 and not result.startswith("<|"):
            print(f"[DEBUG] GLM-OCR result: {result[:100]}...")
            return result

        # If result is empty or invalid, return error
        print(f"[WARN] GLM-OCR produced empty/invalid output")
        return f"[GLM-OCR] 未识别到有效文字"

    except Exception as e:
        print(f"[ERROR] GLM-OCR inference error: {e}")
        import traceback
        traceback.print_exc()
        return f"[GLM-OCR] 识别失败: {str(e)}"

def ocr_with_fallback(image_bytes: bytes, prompt: str = "Text Recognition:") -> str:
    """Fallback OCR using Tesseract"""
    from PIL import Image

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        try:
            import pytesseract
            # Try Chinese + English
            text = pytesseract.image_to_string(image, lang='chi_sim+eng')
            if text.strip():
                print(f"[DEBUG] Tesseract result: {text.strip()[:100]}...")
                return text.strip()
            else:
                return "[Tesseract] 未识别到文字"
        except Exception as tts_err:
            print(f"[WARN] Tesseract error: {tts_err}")
            return f"[Fallback] Tesseract 不可用"

    except Exception as e:
        return f"Fallback OCR error: {str(e)}"

def ocr_with_engine(image_data: str, prompt: str = "Text Recognition:") -> str:
    """Perform OCR using GLM-OCR model"""
    global ocr_engine

    if not model_loaded:
        return "Error: 模型未加载"

    try:
        # Decode base64 image
        if image_data.startswith("data:image"):
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)

        # Use GLM-OCR directly
        if ocr_engine is not None:
            return ocr_with_engine_direct(image_bytes, prompt)
        else:
            return "Error: OCR引擎未初始化"

    except Exception as e:
        return f"Error: {str(e)}"

def extract_health_data(image_data: str) -> dict:
    """Extract structured health data from image"""
    text = ocr_with_engine(image_data, "请识别并提取体检表中的所有文字内容:")
    data = parse_health_data(text)
    data['raw_text'] = text
    return data

def parse_health_data(text: str) -> dict:
    """Parse health checkup data from OCR text"""
    import re
    data = {}

    # Name patterns
    name_match = re.search(r'姓名[：:]?\s*(.+?)(?:\s|$|，|。)', text, re.IGNORECASE)
    if name_match:
        data['name'] = name_match[1].strip()

    # Gender patterns
    gender_match = re.search(r'性别[：:]?\s*(男|女)', text, re.IGNORECASE)
    if gender_match:
        data['gender'] = gender_match[1]

    # Height patterns
    height_match = re.search(r'身高[：:]?\s*(\d+\.?\d*)\s*cm', text, re.IGNORECASE)
    if height_match:
        data['height'] = float(height_match[1])

    # Weight patterns
    weight_match = re.search(r'体重[：:]?\s*(\d+\.?\d*)\s*kg', text, re.IGNORECASE)
    if weight_match:
        data['weight'] = float(weight_match[1])

    # BMI patterns
    bmi_match = re.search(r'BMI[：:]?\s*(\d+\.?\d*)', text, re.IGNORECASE)
    if bmi_match:
        data['bmi'] = float(bmi_match[1])

    # Calculate BMI
    if data.get('height') and data.get('weight') and data['height'] > 0 and data['weight'] > 0:
        height_m = data['height'] / 100
        data['bmi'] = round(data['weight'] / (height_m * height_m), 1)

    # Vision
    vision_left_match = re.search(r'左眼[视力：:]?\s*(\d+\.?\d*)', text, re.IGNORECASE)
    vision_right_match = re.search(r'右眼[视力：:]?\s*(\d+\.?\d*)', text, re.IGNORECASE)
    if vision_left_match or vision_right_match:
        data['vision_left'] = float(vision_left_match[1]) if vision_left_match else 0
        data['vision_right'] = float(vision_right_match[1]) if vision_right_match else 0

    # Blood pressure
    bp_match = re.search(r'血压[：:]?\s*(\d+)[/／](\d+)', text, re.IGNORECASE)
    if bp_match:
        data['blood_pressure_systolic'] = int(bp_match[1])
        data['blood_pressure_diastolic'] = int(bp_match[2])

    # Heart rate
    heart_match = re.search(r'心率[：:]?\s*(\d+)', text, re.IGNORECASE)
    if heart_match:
        data['heart_rate'] = int(heart_match[1])

    # Lung capacity
    lung_match = re.search(r'肺活量[：:]?\s*(\d+)', text, re.IGNORECASE)
    if lung_match:
        data['lung_capacity'] = int(lung_match[1])

    # Hemoglobin
    hemoglobin_match = re.search(r'血红蛋白[：:]?\s*(\d+\.?\d*)', text, re.IGNORECASE)
    if hemoglobin_match:
        data['hemoglobin'] = float(hemoglobin_match[1])

    # Student ID
    student_id_match = re.search(r'学号[：:]?\s*(.+?)(?:\s|$|，|。)', text, re.IGNORECASE)
    if student_id_match:
        data['student_id'] = student_id_match[1].strip()

    # School
    school_match = re.search(r'学校[：:]?\s*(.+?)(?:\s|$|，|。)', text, re.IGNORECASE)
    if school_match:
        data['school'] = school_match[1].strip()

    # Allergies
    allergy_match = re.search(r'过敏[原物]?[：:]?\s*(.+?)(?:\s|$|，|。)', text, re.IGNORECASE)
    if allergy_match:
        data['allergies'] = [x.strip() for x in re.split(r'[,，、]', allergy_match[1]) if x.strip()]

    # Medical conditions
    condition_match = re.search(r'既往[病疾]史[：:]?\s*(.+?)(?:\s|$|，|。)', text, re.IGNORECASE)
    if condition_match:
        data['conditions'] = [x.strip() for x in re.split(r'[,，、]', condition_match[1]) if x.strip()]

    return data


class OCRHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        global model_loaded, loading_progress

        if self.path == "/health":
            self.send_json_response(200, {
                "status": "healthy" if model_loaded else "not_loaded",
                "model_loaded": model_loaded,
                "progress": loading_progress,
                "service": "glm-ocr",
                "engine": "glm-ocr"
            })
        elif self.path == "/":
            self.send_json_response(200, {
                "service": "GLM-OCR Service",
                "version": "1.0.0",
                "model_path": GLM_OCR_PATH,
                "platform": sys.platform,
                "engine": "glm-ocr",
                "endpoints": {
                    "GET /health": "Check service status",
                    "POST /load": "Load OCR model",
                    "POST /unload": "Unload model",
                    "POST /ocr": "OCR recognition",
                    "POST /health-checkup": "Extract health data",
                }
            })
        else:
            self.send_json_response(404, {"error": "Not found"})

    def do_POST(self):
        global model_loaded, loading_progress

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body.decode())

            # Load model
            if self.path == "/load":
                success = load_model()
                if success:
                    self.send_json_response(200, {
                        "success": True,
                        "message": "模型加载完成",
                        "model_loaded": True,
                        "engine": "glm-ocr"
                    })
                else:
                    self.send_json_response(500, {
                        "success": False,
                        "error": "模型加载失败",
                        "progress": loading_progress
                    })
                return

            # Unload model
            if self.path == "/unload":
                unload_model()
                self.send_json_response(200, {
                    "success": True,
                    "message": "模型已卸载",
                    "model_loaded": False
                })
                return

            # Check if model is loaded
            if not model_loaded:
                self.send_json_response(503, {
                    "error": "模型未加载",
                    "message": "请先点击加载模型按钮",
                    "tip": "POST /load"
                })
                return

            action = data.get("action", "")

            if action == "health":
                image = data.get("image", "")
                if not image:
                    self.send_json_response(400, {"error": "No image provided"})
                    return
                result = extract_health_data(image)
                self.send_json_response(200, {"success": True, "data": result})

            elif action == "ocr":
                image = data.get("image", "")
                prompt = data.get("prompt", "Text Recognition:")
                if not image:
                    self.send_json_response(400, {"error": "No image provided"})
                    return
                result = ocr_with_engine(image, prompt)
                self.send_json_response(200, {"success": True, "text": result})

            else:
                self.send_json_response(400, {"error": f"Unknown action: {action}"})

        except json.JSONDecodeError:
            self.send_json_response(400, {"error": "Invalid JSON"})
        except Exception as e:
            print(f"Exception: {e}")
            import traceback
            traceback.print_exc()
            self.send_json_response(500, {"error": str(e)})


def signal_handler(sig, frame):
    print("\n收到终止信号，正在关闭...")
    unload_model()
    sys.exit(0)


def main():
    global GLM_OCR_PATH

    parser = argparse.ArgumentParser(description="GLM-OCR Service")
    parser.add_argument("--port", type=int, default=8081, help="Service port")
    parser.add_argument("--model-path", type=str, default=None, help="Model path")
    parser.add_argument("--auto-load", action="store_true", help="Auto-load model on startup")
    args = parser.parse_args()

    # Update global model path if specified
    if args.model_path:
        GLM_OCR_PATH = args.model_path

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("=" * 50)
    print("  GLM-OCR Service")
    print("=" * 50)
    print(f"Platform: {sys.platform}")
    print(f"Python: {sys.version.split()[0]}")
    print(f"Service Port: {args.port}")
    print(f"Model Path: {GLM_OCR_PATH}")
    print(f"Engine: GLM-OCR")
    print("")

    if args.auto_load:
        print("Auto-loading model...")
        load_model()
        model_loaded = True

    # Bind to localhost for security
    server = HTTPServer(("127.0.0.1", args.port), OCRHandler)
    print(f"\n服务运行在 http://127.0.0.1:{args.port}")
    print("\n端点:")
    print("  GET  /health          - 检查服务状态")
    print("  POST /load            - 加载模型")
    print("  POST /unload          - 卸载模型")
    print("  POST /ocr             - OCR识别")
    print("  POST /health-checkup  - 体检数据提取")
    print("\n按 Ctrl+C 停止\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在关闭...")
        unload_model()
        server.shutdown()


if __name__ == "__main__":
    main()
