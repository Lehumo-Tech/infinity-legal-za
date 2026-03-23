#!/usr/bin/env python3
"""
Comprehensive Rate Limiting Test with Valid Requests
"""

import requests
import json
import time
import uuid

BASE_URL = "https://shield-guardian-3.preview.emergentagent.com"
TIMEOUT = 15

def test_rate_limiting_with_valid_requests():
    """Test rate limiting with valid signup requests"""
    print("=== RATE LIMITING TEST WITH VALID REQUESTS ===")
    
    results = []
    
    # Send 6 valid signup requests rapidly
    for i in range(6):
        # Use unique email each time to avoid duplicate email errors
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "email": f"ratetest_{unique_id}@test.com",
            "password": "TestPass123!",
            "fullName": f"Rate Test {i+1}",
            "role": "client"
        }
        
        start_time = time.time()
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/signup", 
                json=payload, 
                timeout=TIMEOUT
            )
            elapsed = time.time() - start_time
            
            print(f"Request {i+1}: Status {response.status_code}, Time: {elapsed:.2f}s")
            results.append((i+1, response.status_code, elapsed))
            
            if response.status_code == 429:
                print(f"✅ Rate limited at request {i+1}")
                try:
                    error_data = response.json()
                    print(f"Rate limit message: {error_data.get('error', 'No error message')}")
                except:
                    print(f"Response text: {response.text}")
                break
            elif response.status_code == 200:
                print(f"✅ Request {i+1} succeeded (user created)")
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    print(f"❌ Validation error: {error_data.get('error', 'No error message')}")
                except:
                    print(f"Response text: {response.text}")
            else:
                print(f"⚠️ Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Request {i+1} failed: {e}")
            results.append((i+1, 'ERROR', 0))
        
        # Small delay to avoid overwhelming the server
        time.sleep(0.1)
    
    # Analyze results
    print(f"\n=== RESULTS ANALYSIS ===")
    successful_requests = sum(1 for _, status, _ in results if status == 200)
    rate_limited_requests = sum(1 for _, status, _ in results if status == 429)
    error_requests = sum(1 for _, status, _ in results if status == 400)
    
    print(f"Successful requests (200): {successful_requests}")
    print(f"Rate limited requests (429): {rate_limited_requests}")
    print(f"Validation errors (400): {error_requests}")
    
    # Check if rate limiting worked
    if rate_limited_requests > 0:
        print("✅ Rate limiting is working!")
        return True
    elif successful_requests >= 5:
        print("⚠️ Rate limiting may not be working - too many successful requests")
        return False
    else:
        print("⚠️ Inconclusive test - check for other issues")
        return False

def test_rate_limiting_with_invalid_requests():
    """Test rate limiting with invalid requests (original approach)"""
    print("\n=== RATE LIMITING TEST WITH INVALID REQUESTS ===")
    
    results = []
    
    # Send 6 invalid requests rapidly (missing required fields)
    for i in range(6):
        payload = {"email": f"ratetest_invalid_{i}@test.com"}  # Missing password/fullName
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/signup", 
                json=payload, 
                timeout=TIMEOUT
            )
            
            print(f"Request {i+1}: Status {response.status_code}")
            results.append((i+1, response.status_code))
            
            if response.status_code == 429:
                print(f"✅ Rate limited at request {i+1}")
                return True
                
        except Exception as e:
            print(f"❌ Request {i+1} failed: {e}")
        
        time.sleep(0.05)  # Very small delay
    
    # Check if any request was rate limited
    rate_limited = any(status == 429 for _, status in results)
    if rate_limited:
        print("✅ Rate limiting working with invalid requests")
        return True
    else:
        print("❌ Rate limiting not detected with invalid requests")
        return False

if __name__ == "__main__":
    print("🚀 Starting Comprehensive Rate Limiting Tests")
    
    # Test 1: Valid requests
    valid_test_result = test_rate_limiting_with_valid_requests()
    
    # Test 2: Invalid requests  
    invalid_test_result = test_rate_limiting_with_invalid_requests()
    
    print(f"\n=== FINAL RESULTS ===")
    print(f"Valid requests test: {'✅ PASSED' if valid_test_result else '❌ FAILED'}")
    print(f"Invalid requests test: {'✅ PASSED' if invalid_test_result else '❌ FAILED'}")
    
    if valid_test_result or invalid_test_result:
        print("✅ Rate limiting is working in at least one scenario")
    else:
        print("❌ Rate limiting may not be working properly")