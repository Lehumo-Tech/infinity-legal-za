#!/usr/bin/env python3
"""
Focused Rate Limiting Test for Signup API
"""

import requests
import json
import time

BASE_URL = "https://shield-guardian-3.preview.emergentagent.com"
TIMEOUT = 15

def test_rate_limiting_detailed():
    """Detailed rate limiting test with more debugging"""
    print("=== DETAILED RATE LIMITING TEST ===")
    
    # Test with rapid succession (no delays)
    print("\nTesting with rapid succession...")
    for i in range(7):  # Try 7 requests
        payload = {"email": f"ratetest_rapid_{i}@test.com"}
        start_time = time.time()
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/signup", 
                json=payload, 
                timeout=TIMEOUT
            )
            elapsed = time.time() - start_time
            
            print(f"Request {i+1}: Status {response.status_code}, Time: {elapsed:.2f}s")
            
            if response.status_code == 429:
                print(f"✅ Rate limited at request {i+1}")
                try:
                    error_data = response.json()
                    print(f"Error message: {error_data.get('error', 'No error message')}")
                except:
                    print(f"Response text: {response.text}")
                break
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    print(f"Validation error: {error_data.get('error', 'No error message')}")
                except:
                    print(f"Response text: {response.text}")
            else:
                print(f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"Request {i+1} failed: {e}")
    
    # Wait a bit and try again
    print(f"\nWaiting 65 seconds for rate limit window to reset...")
    time.sleep(65)
    
    print("Testing after rate limit reset...")
    payload = {"email": "ratetest_after_reset@test.com"}
    response = requests.post(
        f"{BASE_URL}/api/auth/signup", 
        json=payload, 
        timeout=TIMEOUT
    )
    print(f"After reset: Status {response.status_code}")

if __name__ == "__main__":
    test_rate_limiting_detailed()