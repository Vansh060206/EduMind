import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
sys.path.append("d:/Edumind/backend")

load_dotenv(dotenv_path="d:/Edumind/backend/.env")

from routes.tests import generate_custom_test, GenerateCustomTestRequest

async def main():
    data = GenerateCustomTestRequest(
        student_id="c2d26b0b-15c6-4dee-834f-7bc7ab9509d8",
        subject="Physics",
        topics="Rotational Motion, Kinematics"
    )
    try:
        res = await generate_custom_test(data)
        print("SUCCESS! Keys in generated pool:", res.keys())
        for diff in ["Easy", "Medium", "Hard"]:
            print(f"Number of {diff} questions: {len(res.get(diff, []))}")
            if res.get(diff):
                print(f"Sample {diff} question:", res[diff][0]["text"])
    except Exception as e:
        print("CRITICAL ERROR:", e)

if __name__ == "__main__":
    asyncio.run(main())
