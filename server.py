import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import time
import json
import datetime
import base64
import re

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def sanitize_question_text(val):
    if isinstance(val, str):
        val = re.sub(r'When a swimming micro-invertebrate touches the trigger hair, the trapdoor snaps open in less than a millisecond, creating a high-speed vacuum that sucks the prey inside[—–-]the fastest mechanical movement in the entire plant kingdom!\s*', '', val, flags=re.IGNORECASE)
        val = re.sub(r'ഒരു സൂക്ഷ്മജീവി ഇതിന്റെ രോമങ്ങളിൽ സ്പർശിച്ചാൽ സെക്കൻഡിന്റെ ആയിരത്തിലൊരംശം കൊണ്ട് വാതിൽ തുറന്ന് ജീവിയെ ഉള്ളിലേക്ക് വലിച്ചെടുക്കുന്നു[—–-]സസ്യലോകത്തെ ഏറ്റവും വേഗതയേറിയ ചലനമാണിത്!\s*', '', val, flags=re.IGNORECASE)
        val = re.sub(r'Coexisting with long-extinct dinosaurs over two hundred million years ago as an ancient gymnosperm living fossil, this rugged palm-like plant bears massive cones whose toxic starch-rich seeds were traditionally soaked in water for days and boiled to make celebratory flatbreads during lean monsoon months\.\s*(?:What is this indigenous cone-bearing mountain flora\?\s*)?', '', val, flags=re.IGNORECASE)
        val = re.sub(r'ദിനോസറുകളുടെ കാലം മുതൽ ഭൂമിയിൽ മാറ്റമില്ലാതെ തുടരുന്ന ഒരു ജിംനോസ്പേം ജീവത്ഫോസിലായ, പനയോലകൾ പോലുള്ള ഇലകളും കൂറ്റൻ കോണുകളുമുള്ളതും, കായ്കളിലെ വിഷാംശം ദിവസങ്ങളോളം വെള്ളത്തിലിട്ട് തിളപ്പിച്ചു കളഞ്ഞ് പഞ്ഞമാസങ്ങളിൽ വിശേഷ വിഭവങ്ങളുണ്ടാക്കാൻ ആദിവാസി ജനവിഭാഗങ്ങൾ ഉപയോഗിച്ചിരുന്നതുമായ പശ്ചിമഘട്ടത്തിലെ പുരാതന കാട്ടുസസ്യമേത്\?\s*', '', val, flags=re.IGNORECASE)
        val = re.sub(r'\s*\[\s*(?:verified(?:\s+on\s+the\s+go)?|admin|audit|review(?:ed)?|draft|note|notes|custom|check|status|scoring|marks?|points?|english(?:\s*prompt)?|മലയാളം(?:\s*ചോദ്യം)?)[^\]]*\]', '', val, flags=re.IGNORECASE)
        val = re.sub(r'\s*\[\s*\+?\d+\s*(?:pts?|marks?|points?)\s*\]', '', val, flags=re.IGNORECASE)
        val = re.sub(r'\s*\[\s*malayalam:[^\]]*\]', '', val, flags=re.IGNORECASE)
        val = re.sub(r'^\s*(?:English\s*(?:Prompt|Question)?|Prompt|ചോദ്യം|മലയാളം(?:\s*ചോദ്യം)?)\s*:\s*', '', val, flags=re.IGNORECASE)
        return val.strip()
    elif isinstance(val, list):
        return [sanitize_question_text(item) for item in val]
    elif isinstance(val, dict):
        return {k: sanitize_question_text(v) for k, v in val.items()}
    return val

def save_question_to_disk(base_dir, qid, updates):
    file_path = os.path.join(base_dir, 'js', 'quiz_data.js')
    if not os.path.exists(file_path):
        return {'success': False, 'error': f'quiz_data.js not found at {file_path}'}
        
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    prefix = 'const QUIZ_DATA = '
    idx_start = text.find(prefix)
    if idx_start == -1:
        return {'success': False, 'error': 'Could not find QUIZ_DATA prefix'}
    
    body = text[idx_start + len(prefix):]
    idx_export = body.find('if (typeof')
    if idx_export != -1:
        candidate = body[:idx_export].strip()
    else:
        candidate = body.strip()

    if candidate.endswith(';'):
        candidate = candidate[:-1].strip()

    try:
        data = json.loads(candidate)
    except Exception as e:
        return {'success': False, 'error': f'JSON decode error: {e}'}
    
    qid_str = str(qid).strip()
    target = None
    if qid_str in data.get('all_stage_questions', {}):
        target = data['all_stage_questions'][qid_str]
    elif str(qid).startswith('prelim_'):
        try:
            p_idx = int(str(qid).replace('prelim_', ''))
            if 0 <= p_idx < len(data.get('prelims', [])):
                target = data['prelims'][p_idx]
        except Exception:
            pass
            
    if not target and 'prelims' in data:
        for p in data['prelims']:
            if str(p.get('serial_no')) == qid_str or str(p.get('serial')) == qid_str or str(p.get('num')) == qid_str or str(p.get('id')) == qid_str:
                target = p
                break
                
    if not target and 'all_stage_questions' in data:
        for k, sq in data['all_stage_questions'].items():
            if str(sq.get('serial_no')) == qid_str or str(sq.get('serial')) == qid_str or str(sq.get('id')) == qid_str or str(sq.get('num')) == qid_str:
                target = sq
                break

    if not target:
        return {'success': False, 'error': f'Question ID {qid} not found in database'}

    for k, v in updates.items():
        if v is not None:
            if k in ('fact_en', 'fact_ml'):
                target[k] = str(v).strip()
            else:
                target[k] = sanitize_question_text(v)

    if 'question_en' in updates and updates['question_en'] is not None:
        target['prompt_en'] = target['question_en']
        target['clue_en'] = ''
    if 'question_ml' in updates and updates['question_ml'] is not None:
        target['prompt_ml'] = target['question_ml']
        target['clue_ml'] = ''

    # Create automated backup directory
    backup_dir = os.path.join(base_dir, 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(backup_dir, f'quiz_data_auto_backup_{ts}.js')
    
    with open(backup_path, 'w', encoding='utf-8') as bf:
        bf.write(text)

    export_footer = "\n\nif (typeof module !== 'undefined') {\n    module.exports = QUIZ_DATA;\n}\n\nif (typeof window !== 'undefined') { window.quizData = (typeof QUIZ_DATA !== 'undefined' ? QUIZ_DATA : (typeof quizData !== 'undefined' ? quizData : {})); }\n"
    new_text = prefix + json.dumps(data, indent=4, ensure_ascii=False) + ';' + export_footer
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_text)

    return {'success': True, 'message': f'Question #{qid} successfully saved permanently to disk!'}

class ThreadingServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/save_question':
            try:
                content_len = int(self.headers.get('Content-Length', self.headers.get('content-length', 0)))
                post_body = self.rfile.read(content_len).decode('utf-8', errors='replace') if content_len > 0 else '{}'
                payload = json.loads(post_body) if post_body.strip() else {}
                qid = payload.get('qid')
                updates = payload.get('updates', {})
                
                result = save_question_to_disk(DIRECTORY, qid, updates)
                
                self.send_response(200 if result.get('success') else 400)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
                print(f"[SERVER] Saved question #{qid} to disk: {result.get('success')}")
            except Exception as e:
                print(f"[SERVER ERROR] /api/save_question: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
        elif self.path == '/api/save_quiz_package':
            try:
                content_len = int(self.headers.get('Content-Length', self.headers.get('content-length', 0)))
                post_body = self.rfile.read(content_len).decode('utf-8', errors='replace') if content_len > 0 else '{}'
                package = json.loads(post_body) if post_body.strip() else {}
                
                os.makedirs(os.path.join(DIRECTORY, 'presets'), exist_ok=True)
                os.makedirs(os.path.join(DIRECTORY, 'backups'), exist_ok=True)

                ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_path = os.path.join(DIRECTORY, 'backups', f'quiz_package_backup_{ts}.json')
                with open(backup_path, 'w', encoding='utf-8') as f_b:
                    json.dump(package, f_b, indent=2, ensure_ascii=False)

                active_path = os.path.join(DIRECTORY, 'presets', 'active_quiz.json')
                with open(active_path, 'w', encoding='utf-8') as f_a:
                    json.dump(package, f_a, indent=2, ensure_ascii=False)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Quiz package saved successfully!'}).encode('utf-8'))
                print(f"[SERVER] Saved active quiz package: {package.get('meta', {}).get('title', 'Quiz')}")
            except Exception as e:
                print(f"[SERVER ERROR] /api/save_quiz_package: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))

        elif self.path == '/api/upload_image':
            try:
                content_len = int(self.headers.get('Content-Length', self.headers.get('content-length', 0)))
                post_body = self.rfile.read(content_len).decode('utf-8', errors='replace') if content_len > 0 else '{}'
                payload = json.loads(post_body) if post_body.strip() else {}
                qid = payload.get('qid')
                filename = payload.get('filename', f'Q{qid}.jpg')
                base64_data = payload.get('data', '')
                media_desc = payload.get('media_desc', '')
                
                if base64_data and ',' in base64_data:
                    base64_data = base64_data.split(',', 1)[1]
                    
                file_bytes = base64.b64decode(base64_data)
                
                ext = os.path.splitext(filename)[1].lower()
                if not ext:
                    ext = '.jpg'
                    
                qid_file_id = qid
                file_path = os.path.join(DIRECTORY, 'js', 'quiz_data.js')
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        txt = f.read()
                    data = extract_quiz_data_json(txt)
                    qid_str = str(qid).strip()
                    for k, sq in data.get('all_stage_questions', {}).items():
                        if str(sq.get('serial_no')) == qid_str or str(sq.get('serial')) == qid_str:
                            qid_file_id = sq.get('id', qid)
                            break
                    if qid_file_id == qid:
                        for p in data.get('prelims', []):
                            if str(p.get('serial_no')) == qid_str or str(p.get('serial')) == qid_str:
                                qid_file_id = p.get('num', p.get('id', qid))
                                break
                except Exception:
                    pass

                save_name = f'Q{qid_file_id}{ext}'
                dest_path = os.path.join(DIRECTORY, 'assets', 'images', save_name)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                
                with open(dest_path, 'wb') as img_f:
                    img_f.write(file_bytes)
                    
                relative_path = f'assets/images/{save_name}'
                
                updates = {'image': relative_path, 'has_visual': True}
                if media_desc:
                    updates['media_desc'] = media_desc
                    
                save_result = save_question_to_disk(DIRECTORY, qid, updates)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'image': relative_path,
                    'message': f'Image saved permanently as {relative_path} and linked to Question #{qid}!'
                }).encode('utf-8'))
                print(f"[SERVER] Uploaded image {relative_path} for question #{qid}")
            except Exception as e:
                print(f"[SERVER ERROR] /api/upload_image: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_cors_headers()
            self.end_headers()

def find_available_port(start_port=8000):
    import socket
    port = start_port
    while port < start_port + 50:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            port += 1
    return start_port

def run_server():
    global PORT
    actual_port = find_available_port(PORT)
    PORT = actual_port
    with ThreadingServer(('127.0.0.1', PORT), Handler) as httpd:
        print(f"\n==================================================================")
        print(f"       SAHYADRI WILDLIFE QUIZ 2026 - DUAL SCREEN SERVER")
        print(f"==================================================================")
        print(f"[*] Server directory : {DIRECTORY}")
        print(f"[*] Public Screen URL : http://localhost:{PORT}/public_display.html")
        print(f"[*] QM Control URL   : http://localhost:{PORT}/qm_control.html")
        print(f"[*] Permanent Disk Save Enabled for /api/save_question & /api/upload_image")
        print(f"==================================================================\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer shutting down gracefully.")
            httpd.shutdown()

if __name__ == '__main__':
    run_server()
