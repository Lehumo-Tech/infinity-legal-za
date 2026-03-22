#!/usr/bin/env python3
"""
Debug Rate Limiting Implementation
"""

import requests
import json
import time

BASE_URL = "https://legal-tech-za.preview.emergentagent.com"
TIMEOUT = 15

def debug_rate_limiting():
    """Debug the rate limiting by examining headers and responses"""
    print("=== DEBUGGING RATE LIMITING ===")
    
    # Test with a simple request to see headers
    print("Testing with a single request to examine headers...")
    
    payload = {"email": "debug@test.com"}  # Invalid request
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/signup", 
            json=payload, 
            timeout=TIMEOUT
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response headers:")
        for header, value in response.headers.items():
            if 'rate' in header.lower() or 'limit' in header.lower():
                print(f"  {header}: {value}")
        
        print(f"Response body: {response.text}")
        
        # Now send multiple requests in quick succession to force rate limiting
        print(f"\nSending 10 requests rapidly...")
        for i in range(10):
            payload = {"email": f"debug{i}@test.com"}
            response = requests.post(
                f"{BASE_URL}/api/auth/signup", 
                json=payload, 
                timeout=TIMEOUT
            )
            print(f"Request {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print(f"✅ Rate limited at request {i+1}")
                print(f"Response: {response.text}")
                return True
            
            # No delay - send as fast as possible
        
        print("❌ No rate limiting detected after 10 rapid requests")
        return False
        
    except Exception as e:
        print(f"❌ Debug test failed: {e}")
        return False

if __name__ == "__main__":
    debug_rate_limiting()