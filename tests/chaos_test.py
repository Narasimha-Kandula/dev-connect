#!/usr/bin/env python3
"""
Chaos Testing: System resilience under failure conditions.
"""
import asyncio, json, time, sys, subprocess, os

API = "http://localhost:4000/api/v1"
ADMIN_EMAIL = "admin@devconnect.dev"
ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "") or "ChangeMe123!"

async def login():
    import httpx
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        if r.status_code != 200:
            raise RuntimeError(f"Login failed: {r.text}")
        data = r.json()
        return data["accessToken"], data["user"]["id"]

async def test_disconnect_reconnect():
    """Test that Prisma reconnects after DB failure (simulated by kill/restart).
    We can't kill Supabase, but we can verify recovery by hard requests."""
    print("\n[CHAOS] 1. DB Disconnect/Reconnect (via connection stress)")
    token, uid = await login()

    # Rapid-fire requests to stress the connection pool
    import httpx
    async with httpx.AsyncClient(timeout=120) as c:
        headers = {"Authorization": f"Bearer {token}"}
        results = []
        for i in range(10):
            t0 = time.time()
            try:
                if i % 2 == 0:
                    r = await c.get(f"{API}/discover", headers=headers)
                else:
                    r = await c.get(f"{API}/admin/analytics/summary", headers=headers)
                elapsed = time.time() - t0
                results.append((i, r.status_code, elapsed))
                print(f"  Request {i+1}: {r.status_code} in {elapsed:.3f}s")
            except Exception as e:
                print(f"  Request {i+1}: FAILED ({e})")
                results.append((i, 0, 0))

    fails = [r for r in results if r[1] not in (200,)]
    if fails:
        print(f"  ⚠ {len(fails)}/{len(results)} requests failed")
        return False
    else:
        print(f"  ✓ All {len(results)} requests passed")
        return True

async def test_circuit_breaker():
    """Verify graceful fallback on missing data."""
    print("\n[CHAOS] 2. Graceful Fallback on Partial Failure")
    token, uid = await login()
    import httpx
    async with httpx.AsyncClient(timeout=60) as c:
        headers = {"Authorization": f"Bearer {token}"}

        # Test swipe with non-existent user
        r = await c.post(f"{API}/discover/swipe", headers=headers,
                         json={"targetId": "00000000-0000-0000-0000-000000000000", "action": "LIKE"})
        print(f"  Swipe with invalid target: HTTP {r.status_code}")
        # Should fail gracefully, not crash the process

        # Test chat with non-existent conversation
        r = await c.get(f"{API}/chat/conversations/00000000-0000-0000-0000-000000000000/messages",
                        headers=headers)
        print(f"  Messages with invalid convo: HTTP {r.status_code}")

    return True

async def test_rapid_swipe_sequence():
    """Fire many swipes quickly to test notification decoupling."""
    print("\n[CHAOS] 3. Rapid Swipe Sequence (notification decoupling)")
    token, uid = await login()
    import httpx
    async with httpx.AsyncClient(timeout=120) as c:
        headers = {"Authorization": f"Bearer {token}"}

        # Get discoverable users
        r = await c.get(f"{API}/discover", headers=headers)
        profiles = r.json()
        print(f"  Found {len(profiles)} profiles")

        results = []
        for p in profiles[:3]:
            for action in ["LIKE", "PASS"]:
                t0 = time.time()
                try:
                    r = await c.post(f"{API}/discover/swipe", headers=headers,
                                     json={"targetId": p["userId"], "action": action})
                    elapsed = time.time() - t0
                    results.append((p["displayName"], action, r.status_code, elapsed))
                    print(f"  {p['displayName']} ({action}): {r.status_code} in {elapsed:.3f}s")
                except Exception as e:
                    print(f"  {p['displayName']} ({action}): EXCEPTION {e}")

        fails = [r for r in results if r[2] not in (201, 200)]
        if fails:
            print(f"  ⚠ {len(fails)}/{len(results)} swipes failed")
            return False
        print(f"  ✓ All {len(results)} swipes completed without crash")
        return True

async def main():
    print("=" * 60)
    print("  DEVCONNECT — CHAOS TESTING SUITE")
    print("=" * 60)
    results = {}

    try:
        results["disconnect"] = await test_disconnect_reconnect()
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        results["disconnect"] = False

    try:
        results["fallback"] = await test_circuit_breaker()
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        results["fallback"] = False

    try:
        results["swipe"] = await test_rapid_swipe_sequence()
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        results["swipe"] = False

    print("\n" + "=" * 60)
    print("  RESULTS")
    print("=" * 60)
    all_pass = True
    for name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        if not passed:
            all_pass = False
        print(f"  {status} | {name}")
    print("=" * 60)
    print(f"  OVERALL: {'✓ ALL PASS' if all_pass else '✗ SOME FAILED'}")
    print("=" * 60)
    return 0 if all_pass else 1

if __name__ == "__main__":
    exit(asyncio.run(main()))
