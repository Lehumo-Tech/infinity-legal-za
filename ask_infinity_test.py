#!/usr/bin/env python3
"""
Ask Infinity API Testing - Infinity Legal Platform
Testing the AI Legal Assistant API and core platform APIs
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://demo-staging-1.preview.emergentagent.com"
SUPABASE_URL = "https://qgjqrrxwcsggtjznjjqk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanFycnh3Y3NnZ3Rqem5qanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODU0NTksImV4cCI6MjA4OTc2MTQ1OX0.C8YSkrSSbx8LtcgaaFS5mhMU3Tvr0IMk7byurQEqUgw"

# Test credentials
TEST_EMAIL = "test_intake@infinitylegal.org"
TEST_PASSWORD = "TestPass2026!"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def add_result(self, test_name, passed, details=""):
        self.results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        if passed:
            self.passed += 1
            print(f"✅ {test_name}: PASSED - {details}")
        else:
            self.failed += 1
            print(f"❌ {test_name}: FAILED - {details}")
    
    def summary(self):
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed ({success_rate:.1f}%)")
        print(f"{'='*60}")
        return self.passed, self.failed, success_rate

def login_to_supabase():
    """Login to Supabase and get access token"""
    try:
        print(f"🔐 Logging in to Supabase as {TEST_EMAIL}...")
        
        login_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(login_url, headers=headers, json=data)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            print(f"✅ Login successful, token obtained")
            return access_token
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_ask_service_info(results):
    """Test 1: GET /api/ask — Service Info"""
    print(f"\n{'='*60}")
    print("TESTING ASK INFINITY API - SERVICE INFO")
    print(f"{'='*60}")
    
    try:
        url = f"{BASE_URL}/api/ask"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            service = data.get("service", "")
            description = data.get("description", "")
            disclaimer = data.get("disclaimer", "")
            status = data.get("status", "")
            
            if (service == "Ask Infinity" and 
                "AI Legal Information Assistant" in description and
                disclaimer and 
                status == "active"):
                results.add_result("GET /api/ask Service Info", True, 
                    f"Service: {service}, Status: {status}, Description present, Disclaimer present")
            else:
                results.add_result("GET /api/ask Service Info", False, 
                    f"Missing required fields. service={service}, status={status}, description={description[:50]}..., disclaimer={disclaimer[:50]}...")
        else:
            results.add_result("GET /api/ask Service Info", False, 
                f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("GET /api/ask Service Info", False, f"Exception: {str(e)}")

def test_ask_labour_question(results):
    """Test 2a: POST /api/ask — Labour Question"""
    try:
        url = f"{BASE_URL}/api/ask"
        payload = {
            "query": "What are my rights if I've been unfairly dismissed?",
            "messageCount": 0
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get("response", "")
            categories = data.get("categories", [])
            message_count = data.get("messageCount", 0)
            
            # Check for legislation citations
            has_lra = "LRA" in response_text or "Labour Relations Act" in response_text
            has_bcea = "BCEA" in response_text or "Basic Conditions of Employment Act" in response_text
            has_relevant_legislation = "Relevant Legislation" in response_text
            has_no_cta = "Select This Plan" not in response_text  # Should NOT have CTA for messageCount < 2
            
            if (has_relevant_legislation and (has_lra or has_bcea) and has_no_cta and message_count == 1):
                results.add_result("POST /api/ask Labour Question", True, 
                    f"Contains legislation citations, no CTA (messageCount={message_count}), categories: {categories}")
            else:
                results.add_result("POST /api/ask Labour Question", False, 
                    f"Missing requirements. LRA/BCEA: {has_lra or has_bcea}, Relevant Legislation: {has_relevant_legislation}, No CTA: {has_no_cta}, messageCount: {message_count}")
        else:
            results.add_result("POST /api/ask Labour Question", False, 
                f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/ask Labour Question", False, f"Exception: {str(e)}")

def test_ask_consumer_question(results):
    """Test 2b: POST /api/ask — Consumer Question"""
    try:
        url = f"{BASE_URL}/api/ask"
        payload = {
            "query": "Can I return defective goods to the store?",
            "messageCount": 0
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get("response", "")
            categories = data.get("categories", [])
            
            # Check for Consumer Protection Act citations
            has_cpa = "Consumer Protection Act" in response_text
            has_section_20 = "Section 20" in response_text
            has_section_55_56 = "Section 55" in response_text or "Section 56" in response_text
            
            if has_cpa and (has_section_20 or has_section_55_56):
                results.add_result("POST /api/ask Consumer Question", True, 
                    f"Contains Consumer Protection Act citations, categories: {categories}")
            else:
                results.add_result("POST /api/ask Consumer Question", False, 
                    f"Missing Consumer Protection Act citations. CPA: {has_cpa}, Section 20: {has_section_20}, Section 55/56: {has_section_55_56}")
        else:
            results.add_result("POST /api/ask Consumer Question", False, 
                f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/ask Consumer Question", False, f"Exception: {str(e)}")

def test_ask_rental_question(results):
    """Test 2c: POST /api/ask — Rental Question"""
    try:
        url = f"{BASE_URL}/api/ask"
        payload = {
            "query": "My landlord won't return my deposit",
            "messageCount": 1
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get("response", "")
            categories = data.get("categories", [])
            
            # Check for Rental Housing Act citations and 14 days mention
            has_rental_act = "Rental Housing Act" in response_text
            has_14_days = "14 days" in response_text
            
            if has_rental_act and has_14_days:
                results.add_result("POST /api/ask Rental Question", True, 
                    f"Contains Rental Housing Act and 14 days mention, categories: {categories}")
            else:
                results.add_result("POST /api/ask Rental Question", False, 
                    f"Missing requirements. Rental Housing Act: {has_rental_act}, 14 days: {has_14_days}")
        else:
            results.add_result("POST /api/ask Rental Question", False, 
                f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/ask Rental Question", False, f"Exception: {str(e)}")

def test_ask_cta_trigger(results):
    """Test 2d: POST /api/ask — CTA Trigger (messageCount >= 2)"""
    try:
        url = f"{BASE_URL}/api/ask"
        payload = {
            "query": "What about overtime pay?",
            "messageCount": 3
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get("response", "")
            categories = data.get("categories", [])
            
            # Check for CTA (plan recommendation)
            has_cta = "Select This Plan" in response_text or "Need Personalised Help" in response_text
            has_r99_or_r139 = "R99" in response_text or "R139" in response_text
            has_court_representation = "court representation" in response_text.lower()
            
            if has_cta and (has_r99_or_r139 or has_court_representation):
                results.add_result("POST /api/ask CTA Trigger", True, 
                    f"Contains CTA with plan recommendation and court representation, categories: {categories}")
            else:
                results.add_result("POST /api/ask CTA Trigger", False, 
                    f"Missing CTA requirements. CTA: {has_cta}, R99/R139: {has_r99_or_r139}, Court rep: {has_court_representation}")
        else:
            results.add_result("POST /api/ask CTA Trigger", False, 
                f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/ask CTA Trigger", False, f"Exception: {str(e)}")

def test_ask_validation_empty_query(results):
    """Test 3a: POST /api/ask — Validation (Empty Query)"""
    try:
        url = f"{BASE_URL}/api/ask"
        payload = {
            "query": ""
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "question" in error.lower() or "provide" in error.lower():
                results.add_result("POST /api/ask Empty Query Validation", True, 
                    f"Correctly returned 400 for empty query: {error}")
            else:
                results.add_result("POST /api/ask Empty Query Validation", False, 
                    f"Expected query validation error, got: {error}")
        else:
            results.add_result("POST /api/ask Empty Query Validation", False, 
                f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/ask Empty Query Validation", False, f"Exception: {str(e)}")

def test_ask_validation_no_query_field(results):
    """Test 3b: POST /api/ask — Validation (No Query Field)"""
    try:
        url = f"{BASE_URL}/api/ask"
        payload = {}
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "question" in error.lower() or "provide" in error.lower():
                results.add_result("POST /api/ask No Query Field Validation", True, 
                    f"Correctly returned 400 for missing query field: {error}")
            else:
                results.add_result("POST /api/ask No Query Field Validation", False, 
                    f"Expected query validation error, got: {error}")
        else:
            results.add_result("POST /api/ask No Query Field Validation", False, 
                f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/ask No Query Field Validation", False, f"Exception: {str(e)}")

def test_ask_validation_long_query(results):
    """Test 3c: POST /api/ask — Validation (Long Query > 1000 chars)"""
    try:
        url = f"{BASE_URL}/api/ask"
        long_query = "A" * 1001  # 1001 characters
        payload = {
            "query": long_query
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "long" in error.lower() or "1000" in error:
                results.add_result("POST /api/ask Long Query Validation", True, 
                    f"Correctly returned 400 for long query: {error}")
            else:
                results.add_result("POST /api/ask Long Query Validation", False, 
                    f"Expected long query validation error, got: {error}")
        else:
            results.add_result("POST /api/ask Long Query Validation", False, 
                f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/ask Long Query Validation", False, f"Exception: {str(e)}")

def test_ask_history_context(results):
    """Test 4: POST /api/ask — History Context"""
    try:
        url = f"{BASE_URL}/api/ask"
        payload = {
            "query": "What about my notice period?",
            "messageCount": 2,
            "history": [
                {"role": "user", "content": "I was fired"},
                {"role": "assistant", "content": "The LRA protects you..."}
            ]
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get("response", "")
            categories = data.get("categories", [])
            
            # Should work and return relevant response with legislation citations
            has_legislation = ("Act" in response_text or "Section" in response_text or 
                             "LRA" in response_text or "BCEA" in response_text)
            
            if has_legislation and len(response_text) > 100:
                results.add_result("POST /api/ask History Context", True, 
                    f"Successfully processed history context with legislation citations, categories: {categories}")
            else:
                results.add_result("POST /api/ask History Context", False, 
                    f"Missing legislation citations or insufficient response. Has legislation: {has_legislation}, Response length: {len(response_text)}")
        else:
            results.add_result("POST /api/ask History Context", False, 
                f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/ask History Context", False, f"Exception: {str(e)}")

def test_health_check(results):
    """Test 5: GET /api/health — Health Check"""
    print(f"\n{'='*60}")
    print("TESTING CORE APIs - REGRESSION TESTS")
    print(f"{'='*60}")
    
    try:
        url = f"{BASE_URL}/api/health"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            status = data.get("status", "")
            if status == "healthy":
                results.add_result("GET /api/health", True, f"Health check passed: {status}")
            else:
                results.add_result("GET /api/health", False, f"Expected healthy status, got: {status}")
        else:
            results.add_result("GET /api/health", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("GET /api/health", False, f"Exception: {str(e)}")

def test_intakes_list(token, results):
    """Test 6: GET /api/intakes — Intakes List"""
    if not token:
        results.add_result("GET /api/intakes", False, "No auth token available for testing")
        return
    
    try:
        url = f"{BASE_URL}/api/intakes"
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            # Should return intakes list (could be empty)
            results.add_result("GET /api/intakes", True, f"Successfully retrieved intakes list")
        else:
            results.add_result("GET /api/intakes", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("GET /api/intakes", False, f"Exception: {str(e)}")

def test_intake_submit(results):
    """Test 7: POST /api/intake/submit — Intake Submit (existing functionality)"""
    try:
        url = f"{BASE_URL}/api/intake/submit"
        
        # Valid intake data
        payload = {
            "firstName": "Test",
            "lastName": "User",
            "email": f"test_{int(time.time())}@example.com",  # Unique email
            "phone": "+27821234567",
            "caseType": "labour",
            "urgency": "medium",
            "description": "This is a test intake submission for regression testing purposes",
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 201:
            data = response.json()
            success = data.get("success", False)
            case_id = data.get("caseId", "")
            
            if success and case_id:
                results.add_result("POST /api/intake/submit", True, f"Successfully created intake: {case_id}")
            else:
                results.add_result("POST /api/intake/submit", False, f"Expected success and caseId, got success={success}, caseId={case_id}")
        else:
            results.add_result("POST /api/intake/submit", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("POST /api/intake/submit", False, f"Exception: {str(e)}")

def main():
    """Main test execution"""
    print("🚀 Starting Ask Infinity API Testing")
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    
    results = TestResults()
    
    # PRIMARY FOCUS: Ask Infinity API Tests
    test_ask_service_info(results)
    test_ask_labour_question(results)
    test_ask_consumer_question(results)
    test_ask_rental_question(results)
    test_ask_cta_trigger(results)
    test_ask_validation_empty_query(results)
    test_ask_validation_no_query_field(results)
    test_ask_validation_long_query(results)
    test_ask_history_context(results)
    
    # SECONDARY: Core APIs Regression Tests
    test_health_check(results)
    
    # Login for authenticated tests
    token = login_to_supabase()
    if token:
        test_intakes_list(token, results)
    else:
        results.add_result("GET /api/intakes", False, "Could not obtain auth token for testing")
    
    # Test intake submit (no auth required)
    test_intake_submit(results)
    
    # Final Summary
    passed, failed, success_rate = results.summary()
    
    # Detailed results
    print(f"\n{'='*60}")
    print("DETAILED TEST RESULTS")
    print(f"{'='*60}")
    for result in results.results:
        status = "✅ PASS" if result["passed"] else "❌ FAIL"
        print(f"{status}: {result['test']} - {result['details']}")
    
    print(f"\n🎯 TESTING COMPLETED")
    print(f"📊 Success Rate: {success_rate:.1f}% ({passed}/{passed + failed})")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Ask Infinity API and core platform APIs are working correctly.")
    else:
        print(f"⚠️  {failed} test(s) failed. Please review the issues above.")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)