import re

def read_env(path):
    env = {}
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            match = re.match(r'^([A-Z0-9_]+)\s*=\s*(.*)$', line)
            if match:
                key, val = match.group(1), match.group(2).strip().strip('"').strip("'")
                env[key] = val
                print(f"Line {i}: {key} = {val[:30]}...")
            else:
                print(f"Line {i}: SKIPPED -> {line[:60]}")
    return env

env = read_env(".env.local")
print("\nKeys found:", list(env.keys()))
print("URL:", env.get("NEXT_PUBLIC_SUPABASE_URL", "MISSING"))
print("Key starts with:", env.get("SUPABASE_SERVICE_ROLE_KEY", "MISSING")[:20])
