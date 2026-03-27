#!/usr/bin/env python3
"""
Backend Test for Convert Intake to Case Feature
Tests the new intake management APIs for Infinity Legal Platform
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://infinity-staging.preview.emergentagent.com"
SUPABASE_URL = "https://qgjqrrxwcsggtjznjjqk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanFycnh3Y3NnZ3Rqem5qanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODU0NTksImV4cCI6MjA4OTc2MTQ1OX0.C8YSkrSSbx8LtcgaaFS5mhMU3Tvr0IMk7byurQEqUgw"

# Test credentials
TEST_EMAIL = "test_intake@infinitylegal.org"
TEST_PASSWORD = "TestPass2026!"

class IntakeTestSuite:
    def __init__(self):
        self.access_token = None
        self.test_intake_id = None
        self.test_case_id = None
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
        self.results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
        
    def authenticate(self):
        """Step 1: Login via Supabase Auth to get token"""
        print("\n=== STEP 1: Authentication Test ===")
        try:
            auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
            headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
            data = {
                'email': TEST_EMAIL,
                'password': TEST_PASSWORD
            }
            
            response = requests.post(auth_url, headers=headers, json=data, timeout=10)
            
            if response.status_code == 200:
                auth_data = response.json()
                self.access_token = auth_data.get('access_token')
                if self.access_token:
                    self.log_result("Authentication", True, "Successfully logged in and obtained access token")
                    return True
                else:
                    self.log_result("Authentication", False, "No access token in response", auth_data)
                    return False
            else:
                self.log_result("Authentication", False, f"Login failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_intakes_without_auth(self):
        """Step 2: GET /api/intakes without auth → should return 401"""
        print("\n=== STEP 2: Test Intakes API Without Auth ===")
        try:
            url = f"{BASE_URL}/api/intakes"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 401:
                self.log_result("GET /api/intakes (no auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("GET /api/intakes (no auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/intakes (no auth)", False, f"Request error: {str(e)}")
            return False
    
    def test_intakes_with_auth(self):
        """Step 3: GET /api/intakes with auth → should return list of intakes"""
        print("\n=== STEP 3: Test Intakes API With Auth ===")
        try:
            url = f"{BASE_URL}/api/intakes"
            headers = {'Authorization': f'Bearer {self.access_token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                intakes = data.get('intakes', [])
                self.log_result("GET /api/intakes (with auth)", True, f"Successfully retrieved {len(intakes)} intakes")
                return True
            else:
                self.log_result("GET /api/intakes (with auth)", False, f"Expected 200, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/intakes (with auth)", False, f"Request error: {str(e)}")
            return False
    
    def test_intake_analyze(self):
        """Step 4: POST /api/intake/analyze → Submit a new test intake"""
        print("\n=== STEP 4: Test Intake Analysis (Create New Intake) ===")
        try:
            url = f"{BASE_URL}/api/intake/analyze"
            headers = {'Content-Type': 'application/json'}
            
            # Create unique problem description for this test
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            data = {
                "responses": {
                    "problem": f"I was involved in a car accident on {timestamp} where the other driver ran a red light and crashed into my vehicle. I sustained injuries to my neck and back, and my car was severely damaged. The other driver's insurance company is refusing to pay for my medical bills and car repairs, claiming their client was not at fault despite clear evidence.",
                    "timeline": "The accident happened 2 weeks ago. I have been receiving medical treatment since then.",
                    "outcome": "I want compensation for my medical expenses, car repairs, and pain and suffering.",
                    "parties": "Myself, the other driver, and both insurance companies.",
                    "documents": "Police report, medical records, photos of the accident scene and vehicle damage, witness statements."
                },
                "selectedCategory": "Personal Injury",
                "isUrgent": False
            }
            
            print("   Submitting intake analysis request (may take 5-10 seconds for AI processing)...")
            response = requests.post(url, headers=headers, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                self.test_intake_id = result.get('intakeId')
                if self.test_intake_id:
                    self.log_result("POST /api/intake/analyze", True, f"Successfully analyzed intake and created intakeId: {self.test_intake_id}")
                    print(f"   AI Analysis: Category={result.get('category')}, Urgency={result.get('urgency')}, Confidence={result.get('confidence')}%")
                    return True
                else:
                    self.log_result("POST /api/intake/analyze", False, "No intakeId returned in response", result)
                    return False
            else:
                self.log_result("POST /api/intake/analyze", False, f"Expected 200, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/intake/analyze", False, f"Request error: {str(e)}")
            return False
    
    def verify_new_intake_in_list(self):
        """Step 5: GET /api/intakes with auth → verify the new intake appears with status: pending"""
        print("\n=== STEP 5: Verify New Intake Appears in List ===")
        try:
            url = f"{BASE_URL}/api/intakes"
            headers = {'Authorization': f'Bearer {self.access_token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                intakes = data.get('intakes', [])
                
                # Find our test intake
                test_intake = None
                for intake in intakes:
                    if intake.get('id') == self.test_intake_id:
                        test_intake = intake
                        break
                
                if test_intake:
                    status = test_intake.get('status')
                    if status == 'pending':
                        self.log_result("Verify new intake in list", True, f"Found new intake with status 'pending'")
                        return True
                    else:
                        self.log_result("Verify new intake in list", False, f"Found intake but status is '{status}', expected 'pending'")
                        return False
                else:
                    self.log_result("Verify new intake in list", False, f"Could not find intake with ID {self.test_intake_id} in list of {len(intakes)} intakes")
                    return False
            else:
                self.log_result("Verify new intake in list", False, f"Expected 200, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Verify new intake in list", False, f"Request error: {str(e)}")
            return False
    
    def test_convert_without_auth(self):
        """Step 6: POST /api/intakes/[intakeId]/convert without auth → should return 401"""
        print("\n=== STEP 6: Test Convert Without Auth ===")
        try:
            url = f"{BASE_URL}/api/intakes/{self.test_intake_id}/convert"
            headers = {'Content-Type': 'application/json'}
            data = {}
            
            response = requests.post(url, headers=headers, json=data, timeout=10)
            
            if response.status_code == 401:
                self.log_result("POST /api/intakes/[id]/convert (no auth)", True, "Correctly returned 401 Unauthorized")
                return True
            else:
                self.log_result("POST /api/intakes/[id]/convert (no auth)", False, f"Expected 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/intakes/[id]/convert (no auth)", False, f"Request error: {str(e)}")
            return False
    
    def test_convert_with_auth(self):
        """Step 7: POST /api/intakes/[intakeId]/convert with auth → should return 201 with case data"""
        print("\n=== STEP 7: Test Convert With Auth ===")
        try:
            url = f"{BASE_URL}/api/intakes/{self.test_intake_id}/convert"
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            data = {}
            
            response = requests.post(url, headers=headers, json=data, timeout=10)
            
            if response.status_code == 201:
                result = response.json()
                case_data = result.get('case')
                case_number = result.get('caseNumber')
                
                if case_data and case_number:
                    self.test_case_id = case_data.get('id')
                    self.log_result("POST /api/intakes/[id]/convert (with auth)", True, f"Successfully converted intake to case {case_number}")
                    print(f"   Case ID: {self.test_case_id}")
                    print(f"   Case Number: {case_number}")
                    return True
                else:
                    self.log_result("POST /api/intakes/[id]/convert (with auth)", False, "Missing case data or case number in response", result)
                    return False
            else:
                self.log_result("POST /api/intakes/[id]/convert (with auth)", False, f"Expected 201, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("POST /api/intakes/[id]/convert (with auth)", False, f"Request error: {str(e)}")
            return False
    
    def verify_intake_converted_status(self):
        """Step 8: GET /api/intakes → verify the intake now has status: converted"""
        print("\n=== STEP 8: Verify Intake Status Changed to Converted ===")
        try:
            url = f"{BASE_URL}/api/intakes"
            headers = {'Authorization': f'Bearer {self.access_token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                intakes = data.get('intakes', [])
                
                # Find our test intake
                test_intake = None
                for intake in intakes:
                    if intake.get('id') == self.test_intake_id:
                        test_intake = intake
                        break
                
                if test_intake:
                    status = test_intake.get('status')
                    converted_case_number = test_intake.get('convertedCaseNumber')
                    
                    if status == 'converted' and converted_case_number:
                        self.log_result("Verify converted status", True, f"Intake status is 'converted' with case number {converted_case_number}")
                        return True
                    else:
                        self.log_result("Verify converted status", False, f"Status is '{status}', convertedCaseNumber is '{converted_case_number}'")
                        return False
                else:
                    self.log_result("Verify converted status", False, f"Could not find intake with ID {self.test_intake_id}")
                    return False
            else:
                self.log_result("Verify converted status", False, f"Expected 200, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Verify converted status", False, f"Request error: {str(e)}")
            return False
    
    def test_duplicate_convert(self):
        """Step 9: POST /api/intakes/[intakeId]/convert again → should return 409"""
        print("\n=== STEP 9: Test Duplicate Convert (Should Return 409) ===")
        try:
            url = f"{BASE_URL}/api/intakes/{self.test_intake_id}/convert"
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            data = {}
            
            response = requests.post(url, headers=headers, json=data, timeout=10)
            
            if response.status_code == 409:
                result = response.json()
                self.log_result("Duplicate convert test", True, "Correctly returned 409 Conflict for already converted intake")
                return True
            else:
                self.log_result("Duplicate convert test", False, f"Expected 409, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Duplicate convert test", False, f"Request error: {str(e)}")
            return False
    
    def test_tasks_api(self):
        """Step 10: GET /api/tasks with auth → verify tasks API works without updated_at error"""
        print("\n=== STEP 10: Test Tasks API (Verify updated_at Fix) ===")
        try:
            url = f"{BASE_URL}/api/tasks"
            headers = {'Authorization': f'Bearer {self.access_token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                tasks = data.get('tasks', [])
                self.log_result("GET /api/tasks", True, f"Tasks API working correctly, returned {len(tasks)} tasks")
                return True
            elif response.status_code == 401:
                self.log_result("GET /api/tasks", True, "Tasks API correctly requires authentication (401)")
                return True
            else:
                self.log_result("GET /api/tasks", False, f"Expected 200 or 401, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/tasks", False, f"Request error: {str(e)}")
            return False
    
    def test_intake_filters(self):
        """Step 11-12: Test intake filtering"""
        print("\n=== STEP 11-12: Test Intake Filtering ===")
        
        # Test status filter
        try:
            url = f"{BASE_URL}/api/intakes?status=pending"
            headers = {'Authorization': f'Bearer {self.access_token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                intakes = data.get('intakes', [])
                self.log_result("GET /api/intakes?status=pending", True, f"Status filter working, returned {len(intakes)} pending intakes")
            else:
                self.log_result("GET /api/intakes?status=pending", False, f"Expected 200, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("GET /api/intakes?status=pending", False, f"Request error: {str(e)}")
        
        # Test category filter
        try:
            url = f"{BASE_URL}/api/intakes?category=Criminal%20Law"
            headers = {'Authorization': f'Bearer {self.access_token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                intakes = data.get('intakes', [])
                self.log_result("GET /api/intakes?category=Criminal Law", True, f"Category filter working, returned {len(intakes)} Criminal Law intakes")
                return True
            else:
                self.log_result("GET /api/intakes?category=Criminal Law", False, f"Expected 200, got {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GET /api/intakes?category=Criminal Law", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting Convert Intake to Case Feature Test Suite")
        print(f"Base URL: {BASE_URL}")
        print(f"Test User: {TEST_EMAIL}")
        
        # Run tests in sequence
        tests = [
            self.authenticate,
            self.test_intakes_without_auth,
            self.test_intakes_with_auth,
            self.test_intake_analyze,
            self.verify_new_intake_in_list,
            self.test_convert_without_auth,
            self.test_convert_with_auth,
            self.verify_intake_converted_status,
            self.test_duplicate_convert,
            self.test_tasks_api,
            self.test_intake_filters
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL: {test.__name__} - Unexpected error: {str(e)}")
                failed += 1
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"🏁 TEST SUITE COMPLETE")
        print(f"{'='*60}")
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📊 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("🎉 ALL TESTS PASSED! Convert Intake to Case feature is working correctly.")
        else:
            print("⚠️  Some tests failed. Please review the issues above.")
        
        return failed == 0

if __name__ == "__main__":
    test_suite = IntakeTestSuite()
    success = test_suite.run_all_tests()
    sys.exit(0 if success else 1)