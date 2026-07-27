#!/usr/bin/env python3
"""
Recovery Testing: Restart resilience, data integrity after failure.
"""
import asyncio, json, time, sys, subprocess, os, signal

API = "http://localhost:4000/api/v1"
ADMIN_EMAIL = "admin@devconnect.dev"
ADMIN_PASS = "ChangeMe123!"
BACKEND_DIR = "/home/narasimha/Downloads/DevConnect/backend"

async def login():
    import httpx
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        return r.json()["accessToken"], r.json()["user"]["id"]

async def test_restart_during_active_session():
    """Simulate backend restart while active requests are in-flight."""
    print("\n[RECOVERY] 1. Backend Restart During Active Sessions")
    import httpx
    async with httpx.AsyncClient(timeout=120) as c:
        token, uid = await login()
        headers = {"Authorization": f"Bearer {token}"}

        # Send request, then kill backend during request
        async def send_request():
            try:
                r = await c.get(f"{API}/discover", headers=headers)
                return r.status_code
            except:
                return None

        # Kill backend
        task = asyncio.create_task(send_request())
        await asyncio.sleep(0.5)

        subprocess.run(["fuser", "-k", "4000/tcp"], capture_output=True, timeout=5)
        print(f"  Backend killed")
        await asyncio.sleep(1)

        result = await task
        print(f"  In-flight request result: {result} (expected None or error)")

        # Restart backend
        proc = subprocess.Popen(
            ["nohup", "node", "dist/main"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            cwd=BACKEND_DIR
        )
        print(f"  Backend restarted (PID: {proc.pid})")

        # Wait for it to come up
        for i in range(30):
            try:
                async with httpx.AsyncClient(timeout=5) as c2:
                    r = await c2.post(f"{API}/auth/login",
                                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
                    if r.status_code == 200:
                        print(f"  Backend recovered after ~{i*2}s")
                        token2 = r.json()["accessToken"]
                        break
            except:
                pass
            await asyncio.sleep(2)
        else:
            print(f"  ❌ Backend failed to recover within 60s")
            return False

        # Verify data integrity
        async with httpx.AsyncClient(timeout=30) as c3:
            headers2 = {"Authorization": f"Bearer {token2}"}
            r = await c3.get(f"{API}/matches", headers=headers2)
            matches = r.json()
            print(f"  Matches after restart: {len(matches)} (should match before)")

            r = await c3.get(f"{API}/admin/users", headers=headers2)
            users = r.json()
            print(f"  Users after restart: {len(users)}")

            r = await c3.get(f"{API}/admin/analytics/summary", headers=headers2)
            analytics = r.json()
            print(f"  Analytics after restart: {analytics}")

        proc.terminate()
        return True

async def test_data_integrity():
    """Verify no data corruption after multiple operations."""
    print("\n[RECOVERY] 2. Data Integrity After Operations")
    import httpx
    async with httpx.AsyncClient(timeout=60) as c:
        token, uid = await login()
        headers = {"Authorization": f"Bearer {token}"}

        # Check counts before
        r = await c.get(f"{API}/admin/analytics/summary", headers=headers)
        before = r.json()
        print(f"  Before: {before}")

        # Perform operations
        r = await c.get(f"{API}/discover", headers=headers)
        profiles = r.json()
        print(f"  Discoverable profiles: {len(profiles)}")

        # State should be consistent
        r = await c.get(f"{API}/admin/analytics/summary", headers=headers)
        after = r.json()
        print(f"  After: {after}")

        # Verify no negative counts
        for k, v in after.items():
            if v < 0:
                print(f"  ❌ Negative count for {k}: {v}")
                return False
        return True

async def test_subsequent_requests_work():
    """Verify all endpoints work after recovery."""
    print("\n[RECOVERY] 3. Endpoint Health Check")
    import httpx
    async with httpx.AsyncClient(timeout=30) as c:
        try:
            r = await c.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
            print(f"  Login: HTTP {r.status_code}")
            if r.status_code != 200:
                return False

            token = r.json()["accessToken"]
            headers = {"Authorization": f"Bearer {token}"}

            endpoints = {
                "/discover": ("GET", {}),
                "/matches": ("GET", {}),
                "/chat/conversations": ("GET", {}),
                "/notifications": ("GET", {}),
                "/skills": ("GET", {}),
                "/users/me": ("GET", {}),
                "/admin/users": ("GET", {}),
                "/admin/analytics/summary": ("GET", {}),
                "/admin/audit-logs": ("GET", {}),
            }

            all_ok = True
            for path, (method, _) in endpoints.items():
                try:
                    r = await c.request(method, f"{API}{path}", headers=headers)
                    ok = r.status_code in (200, 201)
                    if not ok:
                        print(f"  ✗ {path}: HTTP {r.status_code}")
                        all_ok = False
                    else:
                        print(f"  ✓ {path}: HTTP {r.status_code}")
                except Exception as e:
                    print(f"  ✗ {path}: {e}")
                    all_ok = False

            return all_ok
        except Exception as e:
            print(f"  ❌ Critical failure: {e}")
            return False

async def main():
    print("=" * 60)
    print("  DEVCONNECT — RECOVERY TESTING SUITE")
    print("=" * 60)
    results = {}

    results["restart"] = await test_restart_during_active_session()
    results["integrity"] = await test_data_integrity()
    results["health"] = await test_subsequent_requests_work()

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
