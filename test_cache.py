import requests
import time

PRODUCT_URL = "http://localhost:8082/api/products"

def test_cache_performance():
    print(f"\n{'='*50}")
    print(f"🔹 TESTING REDIS CACHE PERFORMANCE")
    print(f"{'='*50}")

    # 1. Premier appel (Cache Miss -> DB)
    start_time = time.time()
    response1 = requests.get(f"{PRODUCT_URL}?page=0&size=10")
    duration1 = (time.time() - start_time) * 1000 # ms
    print(f"1️⃣ First Call (DB Access): {duration1:.2f} ms")

    if response1.status_code != 200:
        print("❌ Error: API not reachable")
        return

    # 2. Deuxième appel (Cache Hit -> Redis)
    start_time = time.time()
    response2 = requests.get(f"{PRODUCT_URL}?page=0&size=10")
    duration2 = (time.time() - start_time) * 1000 # ms
    print(f"2️⃣ Second Call (Redis Cache): {duration2:.2f} ms")

    # Analyse
    if duration2 < duration1:
        print(f"✅ CACHE WORKING! Speedup: {duration1/duration2:.1f}x faster")
    else:
        print("⚠️ CACHE MIGHT NOT BE WORKING (or network latency variation)")

    print("\n👉 CHECK SERVER LOGS: You should see SQL queries ONLY for the 1st call.")

if __name__ == "__main__":
    test_cache_performance()
