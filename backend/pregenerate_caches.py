import os
import sys
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Ensure we can import from backend root
sys.path.append(str(Path(__file__).parent))

from routes.courses import generate_curriculum_via_llm

CORE_COURSES = [
    {
        "id": "f6bc2a64-548f-4e13-a2fb-dd60d1f3c917",
        "title": "Rotational Motion",
        "subject": "Physics"
    },
    {
        "id": "1190caa1-7e13-4ace-b81a-2b6fbda3118c",
        "title": "Organic Chemistry",
        "subject": "Chemistry"
    },
    {
        "id": "f47cdd63-0771-4ecd-84ad-bd495bf9028a",
        "title": "Integral Calculus",
        "subject": "Maths"
    },
    {
        "id": "c7e0610a-b71d-4704-ba39-7fe982dfa2c1",
        "title": "Electrostatics",
        "subject": "Physics"
    },
    {
        "id": "0dc0abe6-a380-47d7-b2fb-3c5702569dd8",
        "title": "Units, Dimensions & Errors",
        "subject": "Physics"
    },
    {
        "id": "874b9291-b17f-43f0-b685-3c8ef47565f6",
        "title": "Mathematical Physics & Vectors",
        "subject": "Physics"
    },
    {
        "id": "823fb750-d61b-444e-b084-6b08a8cd2dca",
        "title": "Sets, Relations & Functions",
        "subject": "Maths"
    }
]

def safe_print(*args, **kwargs):
    sep = kwargs.get('sep', ' ')
    end = kwargs.get('end', '\n')
    text = sep.join(str(arg) for arg in args)
    try:
        sys.stdout.write(text + end)
        sys.stdout.flush()
    except Exception:
        try:
            safe_text = text.encode(sys.stdout.encoding or 'ascii', errors='replace').decode(sys.stdout.encoding or 'ascii')
            sys.stdout.write(safe_text + end)
            sys.stdout.flush()
        except Exception:
            pass

# Override built-in print with safe_print
print = safe_print

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("Error: GROQ_API_KEY not found in env.")
        sys.exit(1)

    cache_dir = Path(__file__).parent / "curriculum_cache"
    cache_dir.mkdir(exist_ok=True)

    # 1. Clean up only invalid or corrupted cache files, keeping valid ones
    print("Checking existing cache files in curriculum_cache...")
    valid_cache_ids = {course["id"] for course in CORE_COURSES}
    for item in cache_dir.glob("*.json"):
        course_id = item.stem
        if course_id not in valid_cache_ids:
            try:
                item.unlink()
                print(f"Deleted unrecognized/old cache file: {item.name}")
            except Exception as e:
                print(f"Failed to delete unrecognized cache {item.name}: {e}")
            continue

        # Check if it is a valid cache file
        try:
            with open(item, "r", encoding="utf-8") as f:
                data = json.load(f)
            is_valid = True
            if "modules" not in data or len(data["modules"]) != 4:
                is_valid = False
            else:
                for mod in data["modules"]:
                    if "lessons" not in mod or len(mod["lessons"]) != 3:
                        is_valid = False
                        break
                    for les in mod["lessons"]:
                        if "summary" not in les or len(les["summary"]) < 50:
                            is_valid = False
                            break
                    if not is_valid:
                        break
            if not is_valid:
                print(f"Cache file '{item.name}' is invalid/incomplete. Deleting for regeneration.")
                item.unlink()
        except Exception as e:
            print(f"Cache file '{item.name}' is corrupted: {e}. Deleting for regeneration.")
            try:
                item.unlink()
            except Exception:
                pass

    # 2. Pregenerate core course curriculums
    print("\nStarting pre-generation of core courses...")
    for course in CORE_COURSES:
        course_id = course["id"]
        title = course["title"]
        subject = course["subject"]
        
        cache_file = cache_dir / f"{course_id}.json"
        
        # Check if already cached successfully
        if cache_file.exists():
            print(f"Skipping '{title}' - already cached successfully.")
            continue
        
        # Generation with retries
        max_retries = 3
        success = False
        for attempt in range(max_retries):
            print(f"\nGenerating curriculum for '{title}' ({subject}) [Attempt {attempt + 1}/{max_retries}]...")
            try:
                generated = generate_curriculum_via_llm(course_id, title, subject, api_key)
                
                # Double check we got a valid payload
                if "modules" in generated and len(generated["modules"]) == 4:
                    with open(cache_file, "w", encoding="utf-8") as f:
                        json.dump(generated, f, ensure_ascii=False, indent=2)
                    print(f"Successfully cached curriculum for '{title}' -> {cache_file.name}")
                    success = True
                    break
                else:
                    print(f"Error: Generated structure for '{title}' has invalid modules length")
            except Exception as e:
                print(f"Failed to generate curriculum for '{title}': {e}")
            
            # Back off if we encountered an error
            print(f"Sleeping 15 seconds to let API rate limits clear...")
            time.sleep(15)
            
        if success:
            print("Sleeping 5 seconds before next course...")
            time.sleep(5)
        else:
            print(f"Could not generate curriculum for '{title}' after {max_retries} attempts.")

    print("\nPregeneration complete!")

if __name__ == "__main__":
    main()
