# database.py
# This file creates ONE Supabase connection
# that every other file in the project uses.
# Think of it like a phone line to your database.

from supabase import create_client, Client
from dotenv import load_dotenv
import os

# load_dotenv() reads your .env file
# and makes the values available via os.getenv()
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# create_client() opens the connection to Supabase
# We store it in 'supabase' variable
# Every route will import this and use it
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)