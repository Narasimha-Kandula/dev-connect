#!/usr/bin/env python3
"""
Load Testing: Concurrent users, throughput measurement.
"""
import asyncio, json, time, sys, os

API = "http://localhost:4000/api/v1"
ADMIN_EMAIL = "admin@devconnect.dev"
ADMIN_PASS = "ChangeMe123!"

# Use ApacheBench for raw HTTP throughput
AB_PATH = "/usr/bin/ab"

async def test_login_throughput():
    """Test login endpoint throughput with ab."""
    print("\n[LOAD] 1. Login Endpoint Throughput")
    payload = json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    tmpfile = "/tmp/ab_login.json"
    with open(tmpfile, "w") as f:
        f.write(payload)

    import subprocess
    proc = subprocess.run(
        [AB_PATH, "-n", "200", "-c", "10", "-p", tmpfile, "-T", "application/json",
         f"{API}/auth/login"],
        capture_output=True, text=True, timeout=120
    )
    output = proc.stdout + proc.stderr
    for line in output.split("\n"):
        if "Requests per second" in line or "Failed requests" in line or "Transfer rate" in line:
            print(f"  {line.strip()}")
        if "Time per request" in line:
            print(f"  {line.strip()}")

    if "Failed requests:" in output:
        failed = [l for l in output.split("\n") if "Failed requests" in l]
        if failed:
            fails = int(failed[0].split(":")[1].strip().split()[0])
            if fails > 0:
                print(f"  ⚠ {fails} failed requests detected")
                return False
    return True

async def test_discover_latency():
    """Measure discovery endpoint latency under load."""
    print("\n[LOAD] 2. Discovery Endpoint Response Times")
    import httpx
    async with httpx.AsyncClient(timeout=120) as c:
        # Login once
        r = await c.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        data = r.json()
        token = data["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}

        times = []
        for i in range(30):
            t0 = time.time()
            r = await c.get(f"{API}/discover", headers=headers)
            elapsed = time.time() - t0
            times.append(elapsed)

        times.sort()
        avg = sum(times) / len(times)
        p50 = times[len(times) // 2]
        p95 = times[int(len(times) * 0.95)]
        p99 = times[int(len(times) * 0.99)]

        print(f"  Samples: {len(times)}")
        print(f"  Min:     {times[0]:.3f}s")
        print(f"  Avg:     {avg:.3f}s")
        print(f"  P50:     {p50:.3f}s")
        print(f"  P95:     {p95:.3f}s")
        print(f"  P99:     {p99:.3f}s")
        print(f"  Max:     {times[-1]:.3f}s")

        if p95 > 3.0:
            print(f"  ⚠ P95 > 3s — high latency")
            return False
        return True

async def test_swipe_throughput():
    """Test swipe throughput."""
    print("\n[LOAD] 3. Swipe Endpoint Throughput")
    import httpx
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        token = r.json()["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}

        r = await c.get(f"{API}/discover", headers=headers)
        profiles = r.json()
        if not profiles:
            print("  ⚠ No profiles to swipe on")
            return False

        times = []
        for i in range(50):
            target = profiles[i % len(profiles)]["userId"]
            action = "LIKE" if i % 2 == 0 else "PASS"
            t0 = time.time()
            r = await c.post(f"{API}/discover/swipe", headers=headers,
                             json={"targetId": target, "action": action})
            elapsed = time.time() - t0
            times.append(elapsed)

        times.sort()
        avg = sum(times) / len(times)

        print(f"  Swipes:   {len(times)}")
        print(f"  Avg time: {avg:.3f}s")
        print(f"  Min:      {times[0]:.3f}s")
        print(f"  Max:      {times[-1]:.3f}s")

        if avg > 5.0:
            print(f"  ⚠ Average swipe time > 5s")
            return False
        return True

async def test_concurrent_swipes():
    """Test concurrent swipes for race conditions."""
    print("\n[LOAD] 4. Concurrent Swipe (Race Condition)")
    import httpx
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        token = r.json()["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}

        r = await c.get(f"{API}/discover", headers=headers)
        profiles = r.json()
        if not profiles:
            print("  ⚠ No profiles")
            return False

        target = profiles[0]["userId"]

        # Fire 5 simultaneous LIKE swipes to test idempotency
        async def swipe_like():
            try:
                r = await c.post(f"{API}/discover/swipe", headers=headers,
                                 json={"targetId": target, "action": "LIKE"})
                return r.status_code, r.text[:200]
            except Exception as e:
                return 0, str(e)

        results = await asyncio.gather(*[swipe_like() for _ in range(5)])
        statuses = [r[0] for r in results]
        print(f"  Statuses from 5 concurrent swipes: {statuses}")

        # Check matches after
        r = await c.get(f"{API}/matches", headers=headers)
        matches = r.json()
        print(f"  Total matches after: {len(matches)}")

        # Verify no duplicate matches for same pair
        match_pairs = set()
        for m in matches:
            pair = (m["userOneId"], m["userTwoId"])
            if pair in match_pairs:
                print(f"  ⚠ DUPLICATE MATCH DETECTED: {pair}")
                return False
            match_pairs.add(pair)

        print(f"  ✓ No duplicate matches. {len(matches)} unique matches.")
        return True

async def main():
    print("=" * 60)
    print("  DEVCONNECT — LOAD TESTING SUITE")
    print("=" * 60)
    results = {}

    if os.path.exists(AB_PATH):
        results["login_throughput"] = await test_login_throughput()
    else:
        print("\n[LOAD] 1. Login — skipped (ab not available)")

    results["discover_latency"] = await test_discover_latency()
    results["swipe_throughput"] = await test_swipe_throughput()
    results["concurrent_swipe"] = await test_concurrent_swipes()

    print("\n" + "=" * 60)
    print("  RESULTS")
    print("=" * 60)
    all_pass = True
    for name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        if not passed: all_pass = False
        print(f"  {status} | {name}")
    print("=" * 60)
    print(f"  OVERALL: {'✓ ALL PASS' if all_pass else '✗ SOME FAILED'}")
    print("=" * 60)
    return 0 if all_pass else 1

if __name__ == "__main__":
    exit(asyncio.run(main()))
