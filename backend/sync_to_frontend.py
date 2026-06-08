import os
import json
from pathlib import Path

CORE_COURSES = [
    {"id": "f6bc2a64-548f-4e13-a2fb-dd60d1f3c917", "title": "Rotational Motion"},
    {"id": "1190caa1-7e13-4ace-b81a-2b6fbda3118c", "title": "Organic Chemistry"},
    {"id": "f47cdd63-0771-4ecd-84ad-bd495bf9028a", "title": "Integral Calculus"},
    {"id": "c7e0610a-b71d-4704-ba39-7fe982dfa2c1", "title": "Electrostatics"},
    {"id": "0dc0abe6-a380-47d7-b2fb-3c5702569dd8", "title": "Units, Dimensions & Errors"},
    {"id": "874b9291-b17f-43f0-b685-3c8ef47565f6", "title": "Mathematical Physics & Vectors"},
    {"id": "823fb750-d61b-444e-b084-6b08a8cd2dca", "title": "Sets, Relations & Functions"}
]

def main():
    backend_dir = Path(__file__).parent
    cache_dir = backend_dir / "curriculum_cache"
    frontend_file = backend_dir.parent / "frontend" / "src" / "utils" / "curriculum.js"

    print(f"Reading caches from {cache_dir}...")
    combined = {}

    for course in CORE_COURSES:
        course_id = course["id"]
        title = course["title"]
        cache_file = cache_dir / f"{course_id}.json"

        if cache_file.exists():
            print(f"Loading cached curriculum for: {title}")
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                combined[course_id] = data
            except Exception as e:
                print(f"Error reading cache for {title}: {e}")
        else:
            print(f"Warning: No cache file found for {title} (ID: {course_id})")

    # Generate the JS file content
    # We will dump it as formatted JSON and export it as a JS constant
    js_content = f"export const CURRICULUM = {json.dumps(combined, indent=2, ensure_ascii=False)};\n"

    print(f"Writing static curriculum to {frontend_file}...")
    try:
        frontend_file.parent.mkdir(exist_ok=True, parents=True)
        with open(frontend_file, "w", encoding="utf-8") as f:
            f.write(js_content)
        print("Success! Frontend curriculum updated.")
    except Exception as e:
        print(f"Error writing to frontend file: {e}")

if __name__ == "__main__":
    main()
