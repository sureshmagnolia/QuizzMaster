"""
QuizzMaster Portable Quiz Bundle Manager
Enables seamless exporting and importing of complete Quiz packages (.zip),
including all local media files, branding emblems, audio clips, and decoded base64 assets.
Ensures zero-loss transfer between PC1 and PC2.
"""

import os
import io
import json
import base64
import zipfile
import hashlib
import datetime
import mimetypes
import re

MEDIA_FIELD_NAMES = [
    'image', 'q_media_url', 'a_media_url', 'audio', 'audio_url',
    'video', 'video_url', 'logo_primary', 'logo_secondary', 'logo', 'avatar'
]

def find_local_media_file(base_dir, path_or_url):
    """
    Attempts to locate a referenced media file on the local filesystem.
    Returns the absolute path if found, or None.
    """
    if not path_or_url or not isinstance(path_or_url, str):
        return None
    
    clean_path = path_or_url.strip()
    if clean_path.startswith('data:') or clean_path.startswith('http://') or clean_path.startswith('https://'):
        return None
    
    # Strip URL params or hash
    clean_path = clean_path.split('?')[0].split('#')[0]
    # Normalize slashes
    clean_path = clean_path.replace('\\', '/')
    if clean_path.startswith('/'):
        clean_path = clean_path.lstrip('/')
        
    candidates = [
        os.path.join(base_dir, clean_path),
        os.path.join(base_dir, 'assets', clean_path),
        os.path.join(base_dir, 'assets', 'images', os.path.basename(clean_path)),
        os.path.join(base_dir, 'assets', 'audio', os.path.basename(clean_path)),
        os.path.join(base_dir, 'assets', 'branding', os.path.basename(clean_path)),
        os.path.join(base_dir, 'images', os.path.basename(clean_path)),
        os.path.join(base_dir, 'audio', os.path.basename(clean_path)),
        os.path.join(base_dir, 'media', clean_path),
        os.path.join(base_dir, os.path.basename(clean_path))
    ]
    
    for candidate in candidates:
        norm = os.path.normpath(candidate)
        if os.path.isfile(norm):
            return norm
            
    return None

def decode_base64_media(data_uri):
    """
    Decodes a base64 data URI into (binary_bytes, file_extension).
    Example: data:image/png;base64,iVBORw0... -> (bytes, '.png')
    """
    if not isinstance(data_uri, str) or not data_uri.startswith('data:'):
        return None, None
        
    match = re.match(r'data:([^;]+);base64,(.*)', data_uri, re.DOTALL)
    if not match:
        return None, None
        
    mime_type, b64_payload = match.group(1), match.group(2)
    ext = mimetypes.guess_extension(mime_type)
    if not ext:
        if 'image/jpeg' in mime_type or 'image/jpg' in mime_type:
            ext = '.jpg'
        elif 'image/png' in mime_type:
            ext = '.png'
        elif 'image/webp' in mime_type:
            ext = '.webp'
        elif 'audio/mp3' in mime_type or 'audio/mpeg' in mime_type:
            ext = '.mp3'
        elif 'video/mp4' in mime_type:
            ext = '.mp4'
        else:
            ext = '.bin'
            
    if ext == '.jpe':
        ext = '.jpg'
        
    try:
        data_bytes = base64.b64decode(b64_payload)
        return data_bytes, ext
    except Exception:
        return None, None

def export_quiz_bundle(base_dir, quiz_data):
    """
    Packages the quiz and all referenced local media into an in-memory ZIP archive.
    Returns:
        (zip_bytes, media_count, packaged_files_list)
    """
    # Create a deep copy of quiz_data to avoid mutating original
    quiz_copy = json.loads(json.dumps(quiz_data))
    
    buffer = io.BytesIO()
    packaged_files = []
    file_hashes = {}  # sha256 -> zip_internal_path (avoids storing duplicate files)
    
    with zipfile.ZipFile(buffer, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        
        def process_media_value(val, context_prefix):
            if not val or not isinstance(val, str):
                return val
            val_clean = val.strip()
            if not val_clean or val_clean == 'none':
                return val
                
            # Case 1: Base64 data URI
            if val_clean.startswith('data:'):
                data_bytes, ext = decode_base64_media(val_clean)
                if data_bytes and ext:
                    sha = hashlib.sha256(data_bytes).hexdigest()[:12]
                    if sha in file_hashes:
                        return file_hashes[sha]
                    
                    safe_name = f"{context_prefix}_{sha}{ext}"
                    zip_path = f"media/extracted/{safe_name}"
                    zf.writestr(zip_path, data_bytes)
                    file_hashes[sha] = zip_path
                    packaged_files.append(zip_path)
                    return zip_path
                return val
                
            # Case 2: Local file on disk
            local_path = find_local_media_file(base_dir, val_clean)
            if local_path and os.path.isfile(local_path):
                try:
                    with open(local_path, 'rb') as f:
                        file_bytes = f.read()
                    sha = hashlib.sha256(file_bytes).hexdigest()[:12]
                    if sha in file_hashes:
                        return file_hashes[sha]
                        
                    fname = os.path.basename(local_path)
                    # Preserve subfolder category if known
                    subfolder = 'images'
                    if fname.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a')):
                        subfolder = 'audio'
                    elif fname.lower().endswith(('.mp4', '.webm', '.mov')):
                        subfolder = 'videos'
                    elif 'logo' in context_prefix.lower() or 'branding' in context_prefix.lower():
                        subfolder = 'branding'
                        
                    zip_path = f"media/{subfolder}/{fname}"
                    zf.writestr(zip_path, file_bytes)
                    file_hashes[sha] = zip_path
                    packaged_files.append(zip_path)
                    return zip_path
                except Exception as err:
                    print(f"[BUNDLE EXPORT] Could not read local media '{local_path}': {err}")
                    return val
                    
            # Case 3: Remote HTTP / YouTube URL
            return val

        # 1. Process meta branding
        if 'meta' in quiz_copy and isinstance(quiz_copy['meta'], dict):
            meta = quiz_copy['meta']
            if 'logo_primary' in meta:
                meta['logo_primary'] = process_media_value(meta['logo_primary'], 'branding_logo_primary')
            if 'logo_secondary' in meta:
                meta['logo_secondary'] = process_media_value(meta['logo_secondary'], 'branding_logo_secondary')
            if 'branding' in meta and isinstance(meta['branding'], dict):
                br = meta['branding']
                if 'logo_primary' in br:
                    br['logo_primary'] = process_media_value(br['logo_primary'], 'branding_logo_primary')
                if 'logo_secondary' in br:
                    br['logo_secondary'] = process_media_value(br['logo_secondary'], 'branding_logo_secondary')

        # 2. Process teams
        if 'teams' in quiz_copy and isinstance(quiz_copy['teams'], list):
            for t_idx, team in enumerate(quiz_copy['teams']):
                if isinstance(team, dict):
                    t_id = team.get('id', f'team_{t_idx}')
                    if 'logo' in team:
                        team['logo'] = process_media_value(team['logo'], f'team_{t_id}_logo')
                    if 'avatar' in team:
                        team['avatar'] = process_media_value(team['avatar'], f'team_{t_id}_avatar')

        # 3. Process all stage questions
        if 'all_stage_questions' in quiz_copy and isinstance(quiz_copy['all_stage_questions'], dict):
            for qid, q in quiz_copy['all_stage_questions'].items():
                if isinstance(q, dict):
                    q_prefix = f"q_{qid}"
                    if 'image' in q:
                        q['image'] = process_media_value(q['image'], f"{q_prefix}_img")
                    if 'q_media_url' in q:
                        q['q_media_url'] = process_media_value(q['q_media_url'], f"{q_prefix}_qmedia")
                    if 'a_media_url' in q:
                        q['a_media_url'] = process_media_value(q['a_media_url'], f"{q_prefix}_amedia")
                    if 'audio' in q:
                        q['audio'] = process_media_value(q['audio'], f"{q_prefix}_audio")
                    if 'video' in q:
                        q['video'] = process_media_value(q['video'], f"{q_prefix}_video")

        # 4. Process prelims questions
        if 'prelims' in quiz_copy and isinstance(quiz_copy['prelims'], list):
            for p_idx, p in enumerate(quiz_copy['prelims']):
                if isinstance(p, dict):
                    p_num = p.get('serial_no', p.get('num', p_idx + 1))
                    p_prefix = f"prelim_{p_num}"
                    if 'image' in p:
                        p['image'] = process_media_value(p['image'], f"{p_prefix}_img")
                    if 'q_media_url' in p:
                        p['q_media_url'] = process_media_value(p['q_media_url'], f"{p_prefix}_qmedia")
                    if 'a_media_url' in p:
                        p['a_media_url'] = process_media_value(p['a_media_url'], f"{p_prefix}_amedia")

        # 5. Write the normalized master quiz JSON to the zip root
        quiz_json_bytes = json.dumps(quiz_copy, indent=2, ensure_ascii=False).encode('utf-8')
        zf.writestr('quiz.json', quiz_json_bytes)

        # 6. Generate human-readable README.txt
        meta = quiz_copy.get('meta', {})
        readme_content = f"""==================================================================
        QUIZZMASTER PORTABLE QUIZ BUNDLE
==================================================================
Title        : {meta.get('title', 'QuizzMaster Quiz')}
Subtitle     : {meta.get('subtitle', '')}
Institution  : {meta.get('institution', 'QuizzMaster')}
Theme        : {meta.get('theme', 'emerald')}
Export Date  : {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Version      : {quiz_copy.get('version', '2.0.0')}

PACKAGE SUMMARY:
- Teams Configured       : {len(quiz_copy.get('teams', []))}
- Rounds Configured      : {len(quiz_copy.get('rounds', []))}
- Stage Questions        : {len(quiz_copy.get('all_stage_questions', {}))}
- Prelims Questions      : {len(quiz_copy.get('prelims', []))}
- Packaged Media Files   : {len(packaged_files)}

HOW TO USE ON ANOTHER MACHINE (PC2):
1. Copy this ZIP file to PC2.
2. Launch QuizzMaster on PC2 using `run_app.bat` or `python server.py`.
3. Open QuizzMaster Studio (`http://localhost:8000/builder.html`) or
   Quizmaster Control (`http://localhost:8000/qm_control.html`).
4. Click 'Import Quiz Bundle (.zip)' and choose this file.
5. All questions, settings, and media files will be unpacked and ready instantly!
==================================================================
"""
        zf.writestr('README.txt', readme_content.encode('utf-8'))

    buffer.seek(0)
    zip_bytes = buffer.getvalue()
    return zip_bytes, len(packaged_files), packaged_files

def import_quiz_bundle(base_dir, zip_bytes_or_stream):
    """
    Extracts a QuizzMaster Portable ZIP bundle:
    - Extracts all files inside `media/` into `base_dir/media/` (or `base_dir/assets/media/`).
    - Validates paths against Zip Slip vulnerabilities.
    - Saves `quiz.json` as `presets/active_quiz.json`.
    - Returns `{ success: True, quiz: quiz_data, media_count: N, message: str }`.
    """
    try:
        if isinstance(zip_bytes_or_stream, bytes):
            buffer = io.BytesIO(zip_bytes_or_stream)
        else:
            buffer = zip_bytes_or_stream

        if not zipfile.is_zipfile(buffer):
            return {'success': False, 'error': 'Uploaded file is not a valid ZIP archive.'}

        buffer.seek(0)
        with zipfile.ZipFile(buffer, 'r') as zf:
            namelist = zf.namelist()
            
            # Find quiz.json
            quiz_filename = None
            for name in ['quiz.json', 'active_quiz.json']:
                if name in namelist:
                    quiz_filename = name
                    break
                    
            if not quiz_filename:
                # Search for any .json file in root
                for name in namelist:
                    if '/' not in name and name.endswith('.json'):
                        quiz_filename = name
                        break
                        
            if not quiz_filename:
                return {'success': False, 'error': 'No quiz.json manifest found in the ZIP archive.'}

            # Read and parse quiz.json
            quiz_raw = zf.read(quiz_filename).decode('utf-8')
            quiz_data = json.loads(quiz_raw)

            # Ensure extraction target directory exists
            media_dest_dir = os.path.join(base_dir, 'media')
            os.makedirs(media_dest_dir, exist_ok=True)
            
            extracted_media_count = 0
            base_dir_abs = os.path.abspath(base_dir)

            for member in zf.infolist():
                if member.is_dir():
                    continue
                # Only extract files inside media/ or assets/
                if member.filename.startswith(('media/', 'assets/')):
                    # Path traversal safety check
                    target_path = os.path.abspath(os.path.join(base_dir, member.filename))
                    if not target_path.startswith(base_dir_abs):
                        print(f"[SECURITY ALERT] Attempted directory traversal blocked: {member.filename}")
                        continue
                        
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    with zf.open(member) as source, open(target_path, 'wb') as target:
                        target.write(source.read())
                    extracted_media_count += 1

            # Save as active quiz on disk
            presets_dir = os.path.join(base_dir, 'presets')
            backups_dir = os.path.join(base_dir, 'backups')
            os.makedirs(presets_dir, exist_ok=True)
            os.makedirs(backups_dir, exist_ok=True)

            active_path = os.path.join(presets_dir, 'active_quiz.json')
            with open(active_path, 'w', encoding='utf-8') as f_act:
                json.dump(quiz_data, f_act, indent=2, ensure_ascii=False)

            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = os.path.join(backups_dir, f'quiz_imported_{ts}.json')
            with open(backup_path, 'w', encoding='utf-8') as f_bak:
                json.dump(quiz_data, f_bak, indent=2, ensure_ascii=False)

            title = quiz_data.get('meta', {}).get('title', 'Quiz')
            return {
                'success': True,
                'quiz': quiz_data,
                'media_count': extracted_media_count,
                'message': f"Successfully imported '{title}' with {extracted_media_count} media files unpacked!"
            }

    except Exception as e:
        return {'success': False, 'error': f"Failed to extract quiz bundle: {str(e)}"}
