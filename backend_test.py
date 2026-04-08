#!/usr/bin/env python3
"""
Backend API Testing for Infinity Legal Platform - Pre-Launch MVP Endpoints
Testing the three NEW endpoints: /api/analyze, /api/waitlist, /api/user/export
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://waitlist-legal-sa.preview.emergentagent.com"
SUPABASE_URL = "https://qgjqrrxwcsggtjznjjqk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanFycnh3Y3NnZ3Rqem5qanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODU0NTksImV4cCI6MjA4OTc2MTQ1OX0.C8YSkrSSbx8LtcgaaFS5mhMU3Tvr0IMk7byurQEqUgw"

# Test credentials
TEST_EMAIL = "tsatsi@infinitylegal.org"
TEST_PASSWORD = "Infinity2026!"

def get_auth_token():
    """Get authentication token from Supabase"""
    try:
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        auth_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        response = requests.post(auth_url, json=auth_data, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Auth failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return None

def test_analyze_api():
    """Test POST /api/analyze endpoint - Free-tier mock AI legal analysis"""
    print("\n🔍 Testing POST /api/analyze (Free-tier AI Analysis)")
    print("=" * 60)
    
    test_cases = [
        {
            "name": "Labour law case",
            "data": {
                "description": "I was unfairly dismissed from my job without notice",
                "category": "labour"
            },
            "expected_legal_area": "Labour Law",
            "expected_urgency": "high"
        },
        {
            "name": "Criminal law case", 
            "data": {
                "description": "I was arrested for something I did not do",
                "category": "criminal"
            },
            "expected_legal_area": "Criminal Law",
            "expected_urgency": "emergency"
        },
        {
            "name": "Property law case with location",
            "data": {
                "description": "My landlord is trying to evict me illegally",
                "category": "property",
                "location": "Johannesburg"
            },
            "expected_legal_area": "Property Law"
        },
        {
            "name": "General case (default)",
            "data": {
                "description": "I need help with a legal matter in South Africa"
            },
            "expected_legal_area": "Civil Law"
        },
        {
            "name": "Validation error - too short",
            "data": {
                "description": "short"
            },
            "expect_error": True,
            "expected_status": 400
        },
        {
            "name": "Validation error - empty body",
            "data": {},
            "expect_error": True,
            "expected_status": 400
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        try:
            print(f"\n{i}. {test_case['name']}")
            
            response = requests.post(
                f"{BASE_URL}/api/analyze",
                json=test_case['data'],
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status: {response.status_code}")
            
            if test_case.get('expect_error'):
                if response.status_code == test_case['expected_status']:
                    print(f"   ✅ Expected error status {test_case['expected_status']} received")
                    passed += 1
                else:
                    print(f"   ❌ Expected status {test_case['expected_status']}, got {response.status_code}")
            else:
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check response structure
                    required_fields = ['success', 'analysis', 'disclaimer', 'freeTier']
                    analysis_fields = ['legalArea', 'category', 'urgency', 'summary', 'relevantLegislation', 'nextSteps', 'suggestedPlan', 'estimatedTimeline', 'confidenceScore']
                    
                    structure_ok = True
                    for field in required_fields:
                        if field not in data:
                            print(f"   ❌ Missing field: {field}")
                            structure_ok = False
                    
                    if 'analysis' in data:
                        for field in analysis_fields:
                            if field not in data['analysis']:
                                print(f"   ❌ Missing analysis field: {field}")
                                structure_ok = False
                    
                    if structure_ok:
                        print(f"   ✅ Response structure correct")
                        
                        # Check specific expectations
                        if 'expected_legal_area' in test_case:
                            if data['analysis']['legalArea'] == test_case['expected_legal_area']:
                                print(f"   ✅ Legal area: {data['analysis']['legalArea']}")
                            else:
                                print(f"   ❌ Expected legal area: {test_case['expected_legal_area']}, got: {data['analysis']['legalArea']}")
                                structure_ok = False
                        
                        if 'expected_urgency' in test_case:
                            if data['analysis']['urgency'] == test_case['expected_urgency']:
                                print(f"   ✅ Urgency: {data['analysis']['urgency']}")
                            else:
                                print(f"   ❌ Expected urgency: {test_case['expected_urgency']}, got: {data['analysis']['urgency']}")
                                structure_ok = False
                        
                        # Check freeTier flag
                        if data.get('freeTier') == True:
                            print(f"   ✅ Free tier flag set correctly")
                        else:
                            print(f"   ❌ Free tier flag not set correctly")
                            structure_ok = False
                        
                        if structure_ok:
                            passed += 1
                    
                else:
                    print(f"   ❌ Expected 200, got {response.status_code}")
                    print(f"   Response: {response.text}")
                    
        except Exception as e:
            print(f"   ❌ Test error: {e}")
    
    print(f"\n📊 Analyze API Results: {passed}/{total} tests passed")
    return passed == total

def test_waitlist_api():
    """Test POST /api/waitlist and GET /api/waitlist endpoints"""
    print("\n📝 Testing Waitlist API")
    print("=" * 60)
    
    passed = 0
    total = 5
    
    # Test 1: Create new waitlist entry
    try:
        print("\n1. Create new waitlist entry")
        unique_email = f"test_{int(time.time())}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/waitlist",
            json={
                "email": unique_email,
                "name": "Test User",
                "phone": "+27821234567",
                "plan": "Labour Legal Plan",
                "source": "pricing"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            if 'message' in data and 'entry' in data:
                print(f"   ✅ Waitlist entry created successfully")
                print(f"   Message: {data['message']}")
                passed += 1
            else:
                print(f"   ❌ Missing required fields in response")
        else:
            print(f"   ❌ Expected 201, got {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
    
    # Test 2: Duplicate email
    try:
        print("\n2. Duplicate email test")
        
        response = requests.post(
            f"{BASE_URL}/api/waitlist",
            json={
                "email": unique_email,
                "name": "Test User 2",
                "phone": "+27821234568"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('alreadyJoined') == True:
                print(f"   ✅ Duplicate email handled correctly")
                print(f"   Message: {data['message']}")
                passed += 1
            else:
                print(f"   ❌ alreadyJoined flag not set correctly")
        else:
            print(f"   ❌ Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
    
    # Test 3: Missing email and phone
    try:
        print("\n3. Missing email and phone validation")
        
        response = requests.post(
            f"{BASE_URL}/api/waitlist",
            json={
                "name": "Test User"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 400:
            print(f"   ✅ Validation error returned correctly")
            passed += 1
        else:
            print(f"   ❌ Expected 400, got {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
    
    # Test 4: Phone only (no email)
    try:
        print("\n4. Phone only entry")
        
        response = requests.post(
            f"{BASE_URL}/api/waitlist",
            json={
                "phone": "+27821234569",
                "name": "Phone Only User"
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 201:
            print(f"   ✅ Phone-only entry created successfully")
            passed += 1
        else:
            print(f"   ❌ Expected 201, got {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
    
    # Test 5: GET waitlist count
    try:
        print("\n5. GET waitlist count and recent entries")
        
        response = requests.get(f"{BASE_URL}/api/waitlist")
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'count' in data and 'recent' in data:
                print(f"   ✅ Waitlist data retrieved successfully")
                print(f"   Count: {data['count']}")
                print(f"   Recent entries: {len(data['recent'])}")
                passed += 1
            else:
                print(f"   ❌ Missing required fields in response")
        else:
            print(f"   ❌ Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
    
    print(f"\n📊 Waitlist API Results: {passed}/{total} tests passed")
    return passed == total

def test_user_export_api():
    """Test GET /api/user/export endpoint - POPIA data export"""
    print("\n📤 Testing GET /api/user/export (POPIA Data Export)")
    print("=" * 60)
    
    passed = 0
    total = 2
    
    # Test 1: Without authentication
    try:
        print("\n1. Without authentication")
        
        response = requests.get(f"{BASE_URL}/api/user/export")
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            print(f"   ✅ Unauthorized access correctly blocked")
            passed += 1
        else:
            print(f"   ❌ Expected 401, got {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
    
    # Test 2: With authentication
    try:
        print("\n2. With authentication")
        
        token = get_auth_token()
        if not token:
            print(f"   ❌ Could not get auth token")
            return False
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/api/user/export", headers=headers)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            required_fields = ['exportDate', 'user', 'data', 'summary', 'notice']
            data_sections = ['cases', 'tasks', 'notes', 'messages', 'leads', 'documents', 'intakes']
            summary_fields = ['totalCases', 'totalTasks', 'totalNotes', 'totalMessages', 'totalLeads', 'totalDocuments', 'totalIntakes']
            
            structure_ok = True
            
            for field in required_fields:
                if field not in data:
                    print(f"   ❌ Missing field: {field}")
                    structure_ok = False
            
            if 'data' in data:
                for section in data_sections:
                    if section not in data['data']:
                        print(f"   ❌ Missing data section: {section}")
                        structure_ok = False
            
            if 'summary' in data:
                for field in summary_fields:
                    if field not in data['summary']:
                        print(f"   ❌ Missing summary field: {field}")
                        structure_ok = False
            
            if structure_ok:
                print(f"   ✅ Response structure correct")
                print(f"   Export date: {data['exportDate']}")
                print(f"   User ID: {data['user']['id']}")
                print(f"   Total cases: {data['summary']['totalCases']}")
                print(f"   Total tasks: {data['summary']['totalTasks']}")
                print(f"   POPIA notice: {data['notice'][:50]}...")
                passed += 1
            
        else:
            print(f"   ❌ Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Test error: {e}")
    
    print(f"\n📊 User Export API Results: {passed}/{total} tests passed")
    return passed == total

def main():
    """Run all tests"""
    print("🚀 Starting Pre-Launch MVP API Testing")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = []
    
    # Test all three NEW endpoints
    results.append(("Analyze API", test_analyze_api()))
    results.append(("Waitlist API", test_waitlist_api()))
    results.append(("User Export API", test_user_export_api()))
    
    # Summary
    print("\n" + "=" * 80)
    print("🏁 FINAL RESULTS")
    print("=" * 80)
    
    total_passed = 0
    total_tests = len(results)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
        if passed:
            total_passed += 1
    
    print(f"\nOverall: {total_passed}/{total_tests} test suites passed")
    
    if total_passed == total_tests:
        print("🎉 ALL TESTS PASSED - Pre-Launch MVP APIs are working correctly!")
        return True
    else:
        print("⚠️  Some tests failed - see details above")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)