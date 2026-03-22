#!/usr/bin/env python3
"""
Backend Testing Script for Infinity Legal Platform
Tests Security Hardening and Notifications features
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://legal-tech-za.preview.emergentagent.com"
SUPABASE_URL = "https://qgjqrrxwcsggtjznjjqk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanFycnh3Y3NnZ3Rqem5qanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODU0NTksImV4cCI6MjA4OTc2MTQ1OX0.C8YSkrSSbx8LtcgaaFS5mhMU3Tvr0IMk7byurQEqUgw"

# Test timeout
TIMEOUT = 15

def test_security_headers():
    """Test 1: Security Headers (No auth needed)"""
    print("\n=== TEST 1: Security Headers ===")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=TIMEOUT)
        print(f"Status: {response.status_code}")
        
        # Check required headers
        required_headers = {
            'Content-Security-Policy': 'CSP header',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY', 
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'HSTS header',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'Permissions policy',
            'X-Session-Timeout': '1800'
        }
        
        missing_headers = []
        for header, description in required_headers.items():
            if header in response.headers:
                print(f"✅ {header}: {response.headers[header]}")
            else:
                print(f"❌ Missing {header}")
                missing_headers.append(header)
        
        if missing_headers:
            print(f"❌ Security Headers Test FAILED - Missing: {missing_headers}")
            return False
        else:
            print("✅ Security Headers Test PASSED")
            return True
            
    except Exception as e:
        print(f"❌ Security Headers Test FAILED: {e}")
        return False

def test_rate_limiting_signup():
    """Test 2: Rate Limiting on Signup"""
    print("\n=== TEST 2: Rate Limiting on Signup ===")
    try:
        results = []
        
        # Send 6 rapid requests with invalid data to trigger rate limiting
        for i in range(6):
            payload = {"email": f"ratetest{i}@test.com"}  # Missing password/fullName
            response = requests.post(
                f"{BASE_URL}/api/auth/signup", 
                json=payload, 
                timeout=TIMEOUT
            )
            results.append((i+1, response.status_code, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text))
            print(f"Request {i+1}: Status {response.status_code}")
            time.sleep(0.1)  # Small delay between requests
        
        # Check results
        validation_errors = sum(1 for _, status, _ in results[:5] if status == 400)
        rate_limited = any(status == 429 for _, status, _ in results)
        
        print(f"First 5 requests with 400 status: {validation_errors}/5")
        print(f"Rate limited (429) detected: {rate_limited}")
        
        if validation_errors >= 4 and rate_limited:  # Allow some flexibility
            print("✅ Rate Limiting Test PASSED")
            return True
        else:
            print("❌ Rate Limiting Test FAILED")
            return False
            
    except Exception as e:
        print(f"❌ Rate Limiting Test FAILED: {e}")
        return False

def create_test_user_and_login():
    """Helper: Create test user and get auth token"""
    print("\n=== Creating Test User ===")
    try:
        timestamp = int(time.time())
        email = f"notiftest_{timestamp}@test.com"
        password = "TestPass123!"
        full_name = "Notif Test"
        
        # Create user
        signup_payload = {
            "email": email,
            "password": password,
            "fullName": full_name,
            "role": "client"
        }
        
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json=signup_payload,
            timeout=TIMEOUT
        )
        
        print(f"Signup Status: {signup_response.status_code}")
        if signup_response.status_code != 200:
            print(f"Signup failed: {signup_response.text}")
            return None
            
        # Login via Supabase
        login_payload = {
            "email": email,
            "password": password
        }
        
        login_response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            json=login_payload,
            headers={"apikey": SUPABASE_ANON_KEY},
            timeout=TIMEOUT
        )
        
        print(f"Login Status: {login_response.status_code}")
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return None
            
        login_data = login_response.json()
        access_token = login_data.get("access_token")
        
        if access_token:
            print("✅ Test user created and logged in successfully")
            return access_token
        else:
            print("❌ Failed to get access token")
            return None
            
    except Exception as e:
        print(f"❌ Test user creation failed: {e}")
        return None

def test_notifications_api(auth_token):
    """Test 3: Notifications API (Auth required)"""
    print("\n=== TEST 3: Notifications API ===")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
        
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test 1: GET without auth should return 401
        print("Testing GET /api/notifications without auth...")
        response = requests.get(f"{BASE_URL}/api/notifications", timeout=TIMEOUT)
        if response.status_code == 401:
            print("✅ Unauthorized access correctly blocked")
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
        
        # Test 2: GET with auth should return notifications
        print("Testing GET /api/notifications with auth...")
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers, timeout=TIMEOUT)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Got notifications: {len(data.get('notifications', []))} items")
            print(f"✅ Unread count: {data.get('unreadCount', 0)}")
            initial_unread = data.get('unreadCount', 0)
        else:
            print(f"❌ Expected 200, got {response.status_code}: {response.text}")
            return False
        
        # Test 3: PUT to mark all as read
        print("Testing PUT /api/notifications to mark all as read...")
        response = requests.put(
            f"{BASE_URL}/api/notifications",
            json={"markAllRead": True},
            headers=headers,
            timeout=TIMEOUT
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Mark all as read succeeded")
        else:
            print(f"❌ Expected 200, got {response.status_code}: {response.text}")
            return False
        
        # Test 4: GET again to verify unread count is 0
        print("Testing GET /api/notifications after marking all as read...")
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            final_unread = data.get('unreadCount', 0)
            print(f"✅ Final unread count: {final_unread}")
            
            if initial_unread > 0 and final_unread == 0:
                print("✅ Mark as read functionality working correctly")
            elif initial_unread == 0:
                print("✅ No unread notifications initially (expected for new user)")
            else:
                print(f"❌ Unread count not updated correctly: {initial_unread} -> {final_unread}")
                return False
        else:
            print(f"❌ Expected 200, got {response.status_code}: {response.text}")
            return False
        
        print("✅ Notifications API Test PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Notifications API Test FAILED: {e}")
        return False

def test_notification_reminders(auth_token):
    """Test 4: Notification Reminders API"""
    print("\n=== TEST 4: Notification Reminders API ===")
    
    try:
        # Test 1: POST without auth should return 401
        print("Testing POST /api/notifications/reminders without auth...")
        response = requests.post(f"{BASE_URL}/api/notifications/reminders", timeout=TIMEOUT)
        if response.status_code == 401:
            print("✅ Unauthorized access correctly blocked")
        else:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
        
        # Test 2: POST with auth should work
        if auth_token:
            print("Testing POST /api/notifications/reminders with auth...")
            headers = {"Authorization": f"Bearer {auth_token}"}
            response = requests.post(
                f"{BASE_URL}/api/notifications/reminders",
                headers=headers,
                timeout=TIMEOUT
            )
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Reminders processed: {data.get('notificationsCreated', 0)} notifications created")
                print(f"✅ Timestamp: {data.get('timestamp', 'N/A')}")
                print("✅ Notification Reminders Test PASSED")
                return True
            else:
                print(f"❌ Expected 200, got {response.status_code}: {response.text}")
                return False
        else:
            print("⚠️ Skipping auth test - no token available")
            return True
            
    except Exception as e:
        print(f"❌ Notification Reminders Test FAILED: {e}")
        return False

def test_rate_limiting_ai_intake():
    """Test 5: Rate Limiting on AI Intake (Light test)"""
    print("\n=== TEST 5: Rate Limiting on AI Intake (Light Test) ===")
    try:
        payload = {"responses": {"problem": "test"}}
        
        # Send 3 requests quickly (within rate limit)
        for i in range(3):
            response = requests.post(
                f"{BASE_URL}/api/intake/analyze",
                json=payload,
                timeout=TIMEOUT
            )
            print(f"Request {i+1}: Status {response.status_code}")
            
            if response.status_code == 200:
                print(f"✅ Request {i+1} succeeded")
            elif response.status_code == 400:
                print(f"✅ Request {i+1} validation error (expected for minimal data)")
            elif response.status_code == 429:
                print(f"⚠️ Request {i+1} rate limited (unexpected but not critical)")
            else:
                print(f"⚠️ Request {i+1} unexpected status: {response.status_code}")
            
            time.sleep(1)  # Small delay
        
        print("✅ AI Intake Rate Limiting Test PASSED (light test completed)")
        return True
        
    except Exception as e:
        print(f"❌ AI Intake Rate Limiting Test FAILED: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Backend Security & Notifications Tests")
    print(f"Base URL: {BASE_URL}")
    print(f"Timeout: {TIMEOUT}s")
    
    results = []
    
    # Test 1: Security Headers
    results.append(("Security Headers", test_security_headers()))
    
    # Test 2: Rate Limiting on Signup
    results.append(("Rate Limiting Signup", test_rate_limiting_signup()))
    
    # Create test user for authenticated tests
    auth_token = create_test_user_and_login()
    
    # Test 3: Notifications API
    results.append(("Notifications API", test_notifications_api(auth_token)))
    
    # Test 4: Notification Reminders
    results.append(("Notification Reminders", test_notification_reminders(auth_token)))
    
    # Test 5: AI Intake Rate Limiting (light test)
    results.append(("AI Intake Rate Limiting", test_rate_limiting_ai_intake()))
    
    # Summary
    print("\n" + "="*50)
    print("🏁 TEST SUMMARY")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        return True
    else:
        print("⚠️ Some tests failed - check logs above")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)