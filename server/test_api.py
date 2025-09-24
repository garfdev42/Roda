#!/usr/bin/env python3
"""
Simple test script for Roda API
Run this after setting up the database and starting the server
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_endpoint(method, url, data=None, params=None):
    full_url = f"{BASE_URL}{url}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(full_url, params=params)
        elif method.upper() == "POST":
            response = requests.post(full_url, json=data)
        elif method.upper() == "PUT":
            response = requests.put(full_url, json=data)
        else:
            return f"Unsupported method: {method}"
        
        if response.status_code == 200:
            return f"OK {method} {url}"
        else:
            return f"ERROR {method} {url} - {response.status_code}: {response.text[:100]}"
    
    except requests.exceptions.ConnectionError:
        return f"CONNECTION ERROR {method} {url} (Is the server running?)"
    except Exception as e:
        return f"ERROR {method} {url} - {str(e)}"

def main():
    print("Testing Roda API")
    print("=" * 50)
    
    tests = [
        ("GET", "/health"),
        ("GET", "/"),
        ("GET", "/api/v1/clientes/", None, {"page": 1, "size": 5}),
        ("GET", "/api/v1/creditos/", None, {"page": 1, "size": 5}),
        ("GET", "/api/v1/creditos/1"),
        ("GET", "/api/v1/creditos/1/schedule"),
        ("GET", "/api/v1/creditos/1/summary"),
        ("GET", "/api/v1/creditos/analytics/overview"),
        ("GET", "/api/v1/payments/", None, {"page": 1, "size": 5}),
        ("GET", "/api/v1/payments/analytics/summary"),
    ]
    
    results = []
    for test in tests:
        method, url = test[0], test[1]
        data = test[2] if len(test) > 2 else None
        params = test[3] if len(test) > 3 else None
        
        result = test_endpoint(method, url, data, params)
        results.append(result)
        print(result)
    
    print("\n" + "=" * 50)
    
    success_count = sum(1 for r in results if r.startswith("OK"))
    total_count = len(results)
    
    print(f"Results: {success_count}/{total_count} tests passed")
    
    if success_count == total_count:
        print("All tests passed! Your API is working correctly.")
        print(f"\nTry these URLs in your browser:")
        print(f"   API Docs: {BASE_URL}/docs")
        print(f"   ReDoc: {BASE_URL}/redoc")
        print(f"   Health: {BASE_URL}/health")
    else:
        print("Some tests failed. Check the server logs and database connection.")

if __name__ == "__main__":
    main() 