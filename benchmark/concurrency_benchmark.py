#!/usr/bin/env python3
"""
DevTrack Repeatable Concurrency & Latency Benchmark Tool

Measures:
- Requests per second (Throughput)
- Average, p50, p95, and p99 latency
- Error / conflict rates
- Concurrency scalability under varying worker thread counts
"""

import argparse
import json
import statistics
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed


def parse_args():
    parser = argparse.ArgumentParser(description="DevTrack Performance Benchmark")
    parser.add_argument("--base-url", default="http://localhost:8080/api", help="Backend API base URL")
    parser.add_argument("--threads", type=int, default=10, help="Concurrent client worker threads")
    parser.add_argument("--total-requests", type=int, default=100, help="Total requests to dispatch")
    return parser.parse_args()


def make_request(method, url, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    start_time = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return resp.status, elapsed_ms, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return e.code, elapsed_ms, {}
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return 0, elapsed_ms, {"error": str(e)}


def run_benchmark(base_url, num_threads, total_requests):
    print("=" * 65)
    print(" DevTrack Concurrency & Throughput Benchmark")
    print(f" Target: {base_url} | Threads: {num_threads} | Total Requests: {total_requests}")
    print("=" * 65)

    # 1. Setup Benchmark Account & Project
    ts = int(time.time())
    user_email = f"benchmark_{ts}@example.com"
    reg_status, _, reg_data = make_request(
        "POST",
        f"{base_url}/auth/register",
        {"name": "Benchmark User", "email": user_email, "password": "Password123!"},
    )

    if reg_status not in (200, 201):
        print(f"[!] Failed to register benchmark user (Status: {reg_status}). Is backend running?")
        sys.exit(1)

    token = reg_data.get("token")
    if not token:
        print("[!] No bearer token returned in register response.")
        sys.exit(1)

    proj_status, _, proj_data = make_request(
        "POST",
        f"{base_url}/projects",
        {"name": f"Perf Project {ts}", "projectKey": f"P{ts % 10000}", "description": "Benchmark run"},
        token,
    )
    if proj_status not in (200, 201):
        print(f"[!] Failed to create benchmark project (Status: {proj_status}).")
        sys.exit(1)

    project_id = proj_data["id"]
    print(f"[*] Benchmark project initialized: #{project_id} ({proj_data.get('projectKey')})")

    # 2. Benchmark Simultaneous Issue Creation Under High Concurrency
    latencies = []
    status_counts = {}

    start_wall = time.perf_counter()

    with ThreadPoolExecutor(max_workers=num_threads) as pool:
        futures = []
        for i in range(total_requests):
            payload = {
                "title": f"Load Test Issue {i}",
                "description": "Synthetic issue for latency measurement",
                "type": "TASK",
                "status": "TODO",
                "priority": "MEDIUM",
            }
            url = f"{base_url}/projects/{project_id}/issues"
            futures.append(pool.submit(make_request, "POST", url, payload, token))

        for f in as_completed(futures):
            status_code, elapsed_ms, _ = f.result()
            latencies.append(elapsed_ms)
            status_counts[status_code] = status_counts.get(status_code, 0) + 1

    total_wall_sec = time.perf_counter() - start_wall
    throughput_rps = total_requests / total_wall_sec if total_wall_sec > 0 else 0.0

    latencies.sort()
    avg_latency = statistics.mean(latencies) if latencies else 0.0
    p50_latency = statistics.median(latencies) if latencies else 0.0
    p95_latency = latencies[int(len(latencies) * 0.95)] if latencies else 0.0
    p99_latency = latencies[int(len(latencies) * 0.99)] if latencies else 0.0

    success_requests = status_counts.get(201, 0) + status_counts.get(200, 0)
    error_rate = ((total_requests - success_requests) / total_requests) * 100.0

    print("\n--- Benchmark Execution Results ---")
    print(f"Total Requests:     {total_requests}")
    print(f"Elapsed Time:       {total_wall_sec:.3f} s")
    print(f"Throughput:         {throughput_rps:.2f} req/sec")
    print(f"Success Rate:       {((success_requests / total_requests) * 100.0):.1f}%")
    print(f"Error Rate:         {error_rate:.2f}%")
    print(f"Status Breakdown:   {status_counts}")
    print("\n--- Latency Percentiles (ms) ---")
    print(f"Average:            {avg_latency:.2f} ms")
    print(f"p50 (Median):       {p50_latency:.2f} ms")
    print(f"p95:                {p95_latency:.2f} ms")
    print(f"p99:                {p99_latency:.2f} ms")
    print("=" * 65)


if __name__ == "__main__":
    args = parse_args()
    run_benchmark(args.base_url, args.threads, args.total_requests)
