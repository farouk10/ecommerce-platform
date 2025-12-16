import requests
import time
from concurrent.futures import ThreadPoolExecutor

# Cible : Auth Service (Login) qui a souvent une limite plus stricte
TARGET_URL = "http://localhost:8081/api/auth/health"
# Ou Product pour une limite plus large: "http://localhost:8082/api/products"

REQUEST_COUNT = 120  # Plus que la limite de 100
workers = 10        # Pour aller vite (parallèle)

def send_request(i):
    try:
        resp = requests.get(TARGET_URL)
        return resp.status_code
    except:
        return 0

def test_rate_limiting():
    print(f"\n{'='*50}")
    print(f"🔹 TESTING RATE LIMITING (Bucket4j)")
    print(f"🔹 Target: {TARGET_URL}")
    print(f"🔹 Sending {REQUEST_COUNT} requests...")
    print(f"{'='*50}")

    start_time = time.time()
    success_count = 0
    blocked_count = 0

    with ThreadPoolExecutor(max_workers=workers) as executor:
        results = list(executor.map(send_request, range(REQUEST_COUNT)))

    for status in results:
        if status == 200:
            success_count += 1
        elif status == 429:
            blocked_count += 1

    duration = time.time() - start_time

    print(f"\n📊 RESULTS ({duration:.2f}s):")
    print(f"✅ Successful (200 OK): {success_count}")
    print(f"⛔ Blocked (429 Too Many Requests): {blocked_count}")

    if blocked_count > 0:
        print("\n🎉 RATE LIMITING IS WORKING! The API correctly blocked excess requests.")
    else:
        print("\n❌ RATE LIMITING FAILED. All requests passed. Check your Redis/Bucket4j config.")

if __name__ == "__main__":
    test_rate_limiting()
