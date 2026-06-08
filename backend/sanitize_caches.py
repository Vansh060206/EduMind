import json
import re
from pathlib import Path

def sanitize_string(s):
    if not isinstance(s, str):
        return s
    
    # Replace control characters with literal escaped versions
    s = s.replace('\t', '\\t')
    s = s.replace('\f', '\\f')
    s = s.replace('\v', '\\v')
    
    # Replace backspace (ord 8).
    s = s.replace('\b', '\\b')
    
    # Replace carriage return if followed by letters of latex command
    s = re.sub(r'\r([a-zA-Z])', r'\\r\1', s)
    
    # Replace newline if followed by LaTeX command starting with n (e.g., neq, nabla, nu)
    s = re.sub(r'\n(eq|nabla|u\b|u\^|u_)', r'\\n\1', s)
    
    return s

def sanitize_dict(d):
    if isinstance(d, dict):
        return {k: sanitize_dict(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [sanitize_dict(v) for v in d]
    elif isinstance(d, str):
        return sanitize_string(d)
    return d

def main():
    cache_dir = Path(__file__).parent / 'curriculum_cache'
    for p in cache_dir.glob('*.json'):
        print(f"Sanitizing {p.name}...")
        try:
            with open(p, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            sanitized_data = sanitize_dict(data)
            
            with open(p, 'w', encoding='utf-8') as f:
                json.dump(sanitized_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error sanitizing {p.name}: {e}")
            
    print("Done sanitizing caches!")

if __name__ == '__main__':
    main()
