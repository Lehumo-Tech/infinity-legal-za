#!/usr/bin/env python3
"""
Backend Testing for P0 Fix: Public Intake Wizard DB Save
Infinity Legal Platform - Testing Agent
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://phase-rebuild.preview.emergentagent.com"
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

def test_public_intake_submit_successful(results):
    """Test 1: Successful submission with valid data"""
    print(f"\n{'='*60}")
    print("TESTING P0: PUBLIC INTAKE WIZARD DB SAVE")
    print(f"{'='*60}")
    
    try:
        url = f"{BASE_URL}/api/intake/submit"
        
        # Valid payload as specified in review request
        valid_payload = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "janedoe@testmail.co.za",
            "phone": "+27821234567",
            "caseType": "criminal",
            "urgency": "high",
            "description": "I was arrested without warrant and need urgent legal representation for my criminal case",
            "opposingParty": "State Prosecutor",
            "opposingPartyContact": "",
            "witnesses": "John Smith, eyewitness",
            "hasDocuments": True,
            "documentList": "Arrest warrant, bail documents",
            "incidentDate": "2026-03-15",
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=valid_payload)
        
        if response.status_code == 201:
            data = response.json()
            success = data.get("success", False)
            case_id = data.get("caseId", "")
            
            if success and case_id and case_id.startswith("IL-"):
                results.add_result("Successful Submission", True, f"Created intake with caseId: {case_id}")
                return case_id  # Return for conflict testing
            else:
                results.add_result("Successful Submission", False, f"Expected success=true and caseId starting with IL-, got success={success}, caseId={case_id}")
        else:
            results.add_result("Successful Submission", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Successful Submission", False, f"Exception: {str(e)}")
    
    return None

def test_conflict_detection(results):
    """Test 2: Conflict detection (409) - same email+caseType within 7 days"""
    try:
        url = f"{BASE_URL}/api/intake/submit"
        
        # Same payload as test 1 to trigger conflict
        duplicate_payload = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "janedoe@testmail.co.za",
            "phone": "+27821234567",
            "caseType": "criminal",
            "urgency": "high",
            "description": "I was arrested without warrant and need urgent legal representation for my criminal case",
            "opposingParty": "State Prosecutor",
            "opposingPartyContact": "",
            "witnesses": "John Smith, eyewitness",
            "hasDocuments": True,
            "documentList": "Arrest warrant, bail documents",
            "incidentDate": "2026-03-15",
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=duplicate_payload)
        
        if response.status_code == 409:
            data = response.json()
            success = data.get("success", True)  # Should be false
            error = data.get("error", "")
            existing_ref = data.get("existingReference", "")
            
            if not success and "already submitted" in error.lower() and existing_ref:
                results.add_result("Conflict Detection", True, f"Correctly detected conflict: {error}")
            else:
                results.add_result("Conflict Detection", False, f"Expected conflict response with error message and existingReference, got success={success}, error={error}, existingReference={existing_ref}")
        else:
            results.add_result("Conflict Detection", False, f"Expected 409 conflict, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Conflict Detection", False, f"Exception: {str(e)}")

def test_validation_errors(results):
    """Test 3: Validation errors (400) - various invalid inputs"""
    
    # Test 3a: Missing firstName (too short)
    try:
        url = f"{BASE_URL}/api/intake/submit"
        invalid_payload = {
            "firstName": "A",  # Too short
            "lastName": "Doe",
            "email": "test@example.com",
            "phone": "+27821234567",
            "caseType": "criminal",
            "urgency": "high",
            "description": "This is a test description that is long enough to pass validation",
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=invalid_payload)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "first name" in error.lower() or "2 characters" in error.lower():
                results.add_result("Validation - Short firstName", True, f"Correctly rejected short firstName: {error}")
            else:
                results.add_result("Validation - Short firstName", False, f"Expected firstName validation error, got: {error}")
        else:
            results.add_result("Validation - Short firstName", False, f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Validation - Short firstName", False, f"Exception: {str(e)}")
    
    # Test 3b: Invalid email
    try:
        url = f"{BASE_URL}/api/intake/submit"
        invalid_payload = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "invalid-email",  # Invalid email
            "phone": "+27821234567",
            "caseType": "criminal",
            "urgency": "high",
            "description": "This is a test description that is long enough to pass validation",
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=invalid_payload)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "email" in error.lower():
                results.add_result("Validation - Invalid email", True, f"Correctly rejected invalid email: {error}")
            else:
                results.add_result("Validation - Invalid email", False, f"Expected email validation error, got: {error}")
        else:
            results.add_result("Validation - Invalid email", False, f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Validation - Invalid email", False, f"Exception: {str(e)}")
    
    # Test 3c: Invalid phone (not SA format)
    try:
        url = f"{BASE_URL}/api/intake/submit"
        invalid_payload = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane@example.com",
            "phone": "123456789",  # Invalid SA phone format
            "caseType": "criminal",
            "urgency": "high",
            "description": "This is a test description that is long enough to pass validation",
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=invalid_payload)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "phone" in error.lower() or "sa" in error.lower():
                results.add_result("Validation - Invalid phone", True, f"Correctly rejected invalid phone: {error}")
            else:
                results.add_result("Validation - Invalid phone", False, f"Expected phone validation error, got: {error}")
        else:
            results.add_result("Validation - Invalid phone", False, f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Validation - Invalid phone", False, f"Exception: {str(e)}")
    
    # Test 3d: Description too short (< 20 chars)
    try:
        url = f"{BASE_URL}/api/intake/submit"
        invalid_payload = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane@example.com",
            "phone": "+27821234567",
            "caseType": "criminal",
            "urgency": "high",
            "description": "Short desc",  # Too short
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=invalid_payload)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "description" in error.lower() or "20 characters" in error.lower():
                results.add_result("Validation - Short description", True, f"Correctly rejected short description: {error}")
            else:
                results.add_result("Validation - Short description", False, f"Expected description validation error, got: {error}")
        else:
            results.add_result("Validation - Short description", False, f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Validation - Short description", False, f"Exception: {str(e)}")
    
    # Test 3e: Missing consent
    try:
        url = f"{BASE_URL}/api/intake/submit"
        invalid_payload = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane@example.com",
            "phone": "+27821234567",
            "caseType": "criminal",
            "urgency": "high",
            "description": "This is a test description that is long enough to pass validation",
            "consent": False,  # Missing consent
            "popiaConsent": True
        }
        
        response = requests.post(url, json=invalid_payload)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "consent" in error.lower():
                results.add_result("Validation - Missing consent", True, f"Correctly rejected missing consent: {error}")
            else:
                results.add_result("Validation - Missing consent", False, f"Expected consent validation error, got: {error}")
        else:
            results.add_result("Validation - Missing consent", False, f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Validation - Missing consent", False, f"Exception: {str(e)}")
    
    # Test 3f: Missing caseType
    try:
        url = f"{BASE_URL}/api/intake/submit"
        invalid_payload = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane@example.com",
            "phone": "+27821234567",
            # Missing caseType
            "urgency": "high",
            "description": "This is a test description that is long enough to pass validation",
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=invalid_payload)
        
        if response.status_code == 400:
            data = response.json()
            error = data.get("error", "")
            if "case" in error.lower() or "type" in error.lower():
                results.add_result("Validation - Missing caseType", True, f"Correctly rejected missing caseType: {error}")
            else:
                results.add_result("Validation - Missing caseType", False, f"Expected caseType validation error, got: {error}")
        else:
            results.add_result("Validation - Missing caseType", False, f"Expected 400, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Validation - Missing caseType", False, f"Exception: {str(e)}")

def test_different_case_type_same_email(results):
    """Test 4: Different caseType same email (200) - should succeed"""
    try:
        url = f"{BASE_URL}/api/intake/submit"
        
        # Different caseType (family) for same email
        different_case_payload = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "janedoe@testmail.co.za",  # Same email as test 1
            "phone": "+27821234567",
            "caseType": "family",  # Different case type
            "urgency": "medium",
            "description": "I need help with a family law matter regarding custody arrangements",
            "opposingParty": "Ex-spouse",
            "opposingPartyContact": "",
            "witnesses": "",
            "hasDocuments": False,
            "documentList": "",
            "incidentDate": "2026-03-10",
            "consent": True,
            "popiaConsent": True
        }
        
        response = requests.post(url, json=different_case_payload)
        
        if response.status_code == 201:
            data = response.json()
            success = data.get("success", False)
            case_id = data.get("caseId", "")
            
            if success and case_id and case_id.startswith("IL-"):
                results.add_result("Different CaseType Same Email", True, f"Successfully created family law intake: {case_id}")
            else:
                results.add_result("Different CaseType Same Email", False, f"Expected success=true and caseId, got success={success}, caseId={case_id}")
        else:
            results.add_result("Different CaseType Same Email", False, f"Expected 201, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Different CaseType Same Email", False, f"Exception: {str(e)}")

def test_empty_body(results):
    """Test 5: Empty body (400/500)"""
    try:
        url = f"{BASE_URL}/api/intake/submit"
        
        # Empty body
        response = requests.post(url, json={})
        
        if response.status_code in [400, 500]:
            data = response.json()
            error = data.get("error", "")
            results.add_result("Empty Body Validation", True, f"Correctly handled empty body with status {response.status_code}: {error}")
        else:
            results.add_result("Empty Body Validation", False, f"Expected 400 or 500, got {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Empty Body Validation", False, f"Exception: {str(e)}")

def test_staff_portal_compatibility(token, results):
    """Test 6: Staff portal compatibility - verify intakes appear in listing"""
    if not token:
        results.add_result("Staff Portal Compatibility", False, "No auth token available for testing")
        return
    
    try:
        url = f"{BASE_URL}/api/intakes"
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            intakes = data.get("intakes", []) if isinstance(data, dict) else data
            
            # Look for our test intake
            found_test_intake = False
            for intake in intakes:
                if isinstance(intake, dict):
                    contact = intake.get("contact", {})
                    if contact.get("email") == "janedoe@testmail.co.za":
                        found_test_intake = True
                        # Check if it has source: "public_wizard"
                        source = intake.get("source", "")
                        analysis = intake.get("analysis", {})
                        category = analysis.get("category", "")
                        
                        if source == "public_wizard" and category:
                            results.add_result("Staff Portal Compatibility", True, f"Found public wizard intake in staff portal with category: {category}")
                        else:
                            results.add_result("Staff Portal Compatibility", False, f"Found intake but missing source=public_wizard or category. source={source}, category={category}")
                        break
            
            if not found_test_intake:
                results.add_result("Staff Portal Compatibility", False, f"Test intake not found in staff portal. Found {len(intakes)} intakes total")
        else:
            results.add_result("Staff Portal Compatibility", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Staff Portal Compatibility", False, f"Exception: {str(e)}")

def main():
    """Main test execution"""
    print("🚀 Starting P0 Fix: Public Intake Wizard DB Save Testing")
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    
    results = TestResults()
    
    # Step 1: Test public intake submission (no auth required)
    test_public_intake_submit_successful(results)
    
    # Step 2: Test conflict detection
    test_conflict_detection(results)
    
    # Step 3: Test validation errors
    test_validation_errors(results)
    
    # Step 4: Test different case type same email
    test_different_case_type_same_email(results)
    
    # Step 5: Test empty body
    test_empty_body(results)
    
    # Step 6: Login for staff portal compatibility test
    token = login_to_supabase()
    if token:
        test_staff_portal_compatibility(token, results)
    else:
        results.add_result("Staff Portal Compatibility", False, "Could not obtain auth token for testing")
    
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
        print("🎉 ALL TESTS PASSED! P0 fix: Public Intake Wizard DB Save is working correctly.")
    else:
        print(f"⚠️  {failed} test(s) failed. Please review the issues above.")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)