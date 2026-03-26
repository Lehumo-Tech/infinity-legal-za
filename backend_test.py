#!/usr/bin/env python3
"""
Infinity OS Role-Aware API Testing Suite
Tests all new RBAC-enforced endpoints for proper authentication and authorization
"""

import requests
import json
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = "https://infinity-legal-sa.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class InfinityOSAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'InfinityOS-API-Tester/1.0'
        })
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
        
    def test_setup_migrate_api(self):
        """Test GET /api/setup/migrate - should return migration info (no auth needed)"""
        try:
            response = self.session.get(f"{API_BASE}/setup/migrate")
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and 'instructions' in data:
                    self.log_test("GET /api/setup/migrate", True, f"Status: {data.get('status')}")
                else:
                    self.log_test("GET /api/setup/migrate", False, "Missing expected fields in response")
            else:
                self.log_test("GET /api/setup/migrate", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/setup/migrate", False, f"Exception: {str(e)}")
            
    def test_audit_api_no_auth(self):
        """Test GET /api/audit without auth - should return 401"""
        try:
            response = self.session.get(f"{API_BASE}/audit")
            
            if response.status_code == 401:
                self.log_test("GET /api/audit (no auth)", True, "Correctly returned 401 Unauthorized")
            else:
                self.log_test("GET /api/audit (no auth)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("GET /api/audit (no auth)", False, f"Exception: {str(e)}")
            
    def test_leads_api_no_auth(self):
        """Test GET /api/leads without auth - should return 401"""
        try:
            response = self.session.get(f"{API_BASE}/leads")
            
            if response.status_code == 401:
                self.log_test("GET /api/leads (no auth)", True, "Correctly returned 401 Unauthorized")
            else:
                self.log_test("GET /api/leads (no auth)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("GET /api/leads (no auth)", False, f"Exception: {str(e)}")
            
    def test_leads_post_no_auth(self):
        """Test POST /api/leads without auth - should return 401"""
        try:
            test_lead = {
                "fullName": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+27123456789",
                "source": "web",
                "caseType": "civil",
                "urgency": "medium",
                "description": "Need legal assistance with contract dispute"
            }
            
            response = self.session.post(f"{API_BASE}/leads", json=test_lead)
            
            if response.status_code == 401:
                self.log_test("POST /api/leads (no auth)", True, "Correctly returned 401 Unauthorized")
            else:
                self.log_test("POST /api/leads (no auth)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("POST /api/leads (no auth)", False, f"Exception: {str(e)}")
            
    def test_leads_put_no_auth(self):
        """Test PUT /api/leads without auth - should return 401"""
        try:
            update_data = {
                "leadId": "test-lead-id",
                "action": "qualify"
            }
            
            response = self.session.put(f"{API_BASE}/leads", json=update_data)
            
            if response.status_code == 401:
                self.log_test("PUT /api/leads (no auth)", True, "Correctly returned 401 Unauthorized")
            else:
                self.log_test("PUT /api/leads (no auth)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("PUT /api/leads (no auth)", False, f"Exception: {str(e)}")
            
    def test_staff_signup_no_auth(self):
        """Test POST /api/auth/staff-signup without auth - should return 401"""
        try:
            staff_data = {
                "email": "newstaff@example.com",
                "password": "SecurePass123!",
                "fullName": "Jane Smith",
                "role": "paralegal",
                "barNumber": None
            }
            
            response = self.session.post(f"{API_BASE}/auth/staff-signup", json=staff_data)
            
            if response.status_code == 401:
                self.log_test("POST /api/auth/staff-signup (no auth)", True, "Correctly returned 401 Unauthorized")
            else:
                self.log_test("POST /api/auth/staff-signup (no auth)", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("POST /api/auth/staff-signup (no auth)", False, f"Exception: {str(e)}")
            
    def test_emails_api(self):
        """Test GET /api/emails - should return status and configured info (no auth needed)"""
        try:
            response = self.session.get(f"{API_BASE}/emails")
            
            if response.status_code == 200:
                data = response.json()
                if 'status' in data and 'configured' in data and 'types' in data:
                    configured = data.get('configured')
                    types = data.get('types', [])
                    expected_types = ['welcome', 'booking_confirmation', 'case_status_update', 'task_reminder', 'custom']
                    
                    if all(t in types for t in expected_types):
                        self.log_test("GET /api/emails", True, f"Status: {data.get('status')}, Configured: {configured}, Types: {len(types)}")
                    else:
                        self.log_test("GET /api/emails", False, f"Missing expected email types. Got: {types}")
                else:
                    self.log_test("GET /api/emails", False, "Missing expected fields in response")
            else:
                self.log_test("GET /api/emails", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("GET /api/emails", False, f"Exception: {str(e)}")
            
    def test_emails_post_validation(self):
        """Test POST /api/emails with missing fields - should return 400"""
        try:
            # Test with missing 'type' field
            response = self.session.post(f"{API_BASE}/emails", json={"to": "test@example.com"})
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'type' in data['error']:
                    self.log_test("POST /api/emails (missing type)", True, "Correctly returned 400 for missing type")
                else:
                    self.log_test("POST /api/emails (missing type)", False, f"Wrong error message: {data}")
            else:
                self.log_test("POST /api/emails (missing type)", False, f"Expected 400, got {response.status_code}")
                
            # Test with missing 'to' field
            response = self.session.post(f"{API_BASE}/emails", json={"type": "welcome"})
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'to' in data['error']:
                    self.log_test("POST /api/emails (missing to)", True, "Correctly returned 400 for missing to")
                else:
                    self.log_test("POST /api/emails (missing to)", False, f"Wrong error message: {data}")
            else:
                self.log_test("POST /api/emails (missing to)", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("POST /api/emails validation", False, f"Exception: {str(e)}")
            
    def test_existing_apis(self):
        """Test that existing APIs still work"""
        try:
            # Test GET /api/plans
            response = self.session.get(f"{API_BASE}/plans")
            if response.status_code == 200:
                data = response.json()
                if 'plans' in data:
                    self.log_test("GET /api/plans", True, f"Found {len(data['plans'])} plans")
                else:
                    self.log_test("GET /api/plans", False, "Missing 'plans' field in response")
            else:
                self.log_test("GET /api/plans", False, f"Status: {response.status_code}")
                
            # Test GET /api/attorneys
            response = self.session.get(f"{API_BASE}/attorneys")
            if response.status_code == 200:
                data = response.json()
                if 'attorneys' in data:
                    self.log_test("GET /api/attorneys", True, f"Found {len(data['attorneys'])} attorneys")
                else:
                    self.log_test("GET /api/attorneys", False, "Missing 'attorneys' field in response")
            else:
                self.log_test("GET /api/attorneys", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Existing APIs test", False, f"Exception: {str(e)}")
            
    def test_emails_post_specific_validation(self):
        """Test POST /api/emails with specific email type validation"""
        try:
            # Test booking_confirmation without required fields
            response = self.session.post(f"{API_BASE}/emails", json={
                "type": "booking_confirmation",
                "to": "test@example.com",
                "data": {"fullName": "Test User"}  # Missing date and time
            })
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and ('date' in data['error'] or 'time' in data['error']):
                    self.log_test("POST /api/emails (booking validation)", True, "Correctly validated booking fields")
                else:
                    self.log_test("POST /api/emails (booking validation)", False, f"Wrong validation error: {data}")
            else:
                self.log_test("POST /api/emails (booking validation)", False, f"Expected 400, got {response.status_code}")
                
            # Test case_status_update without required fields
            response = self.session.post(f"{API_BASE}/emails", json={
                "type": "case_status_update",
                "to": "test@example.com",
                "data": {"fullName": "Test User"}  # Missing caseId and newStatus
            })
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and ('caseId' in data['error'] or 'newStatus' in data['error']):
                    self.log_test("POST /api/emails (case validation)", True, "Correctly validated case fields")
                else:
                    self.log_test("POST /api/emails (case validation)", False, f"Wrong validation error: {data}")
            else:
                self.log_test("POST /api/emails (case validation)", False, f"Expected 400, got {response.status_code}")
                
            # Test task_reminder without required fields
            response = self.session.post(f"{API_BASE}/emails", json={
                "type": "task_reminder",
                "to": "test@example.com",
                "data": {"fullName": "Test User"}  # Missing taskTitle and dueDate
            })
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and ('taskTitle' in data['error'] or 'dueDate' in data['error']):
                    self.log_test("POST /api/emails (task validation)", True, "Correctly validated task fields")
                else:
                    self.log_test("POST /api/emails (task validation)", False, f"Wrong validation error: {data}")
            else:
                self.log_test("POST /api/emails (task validation)", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("POST /api/emails specific validation", False, f"Exception: {str(e)}")
            
    def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting Infinity OS Role-Aware API Tests")
        print(f"📍 Testing against: {BASE_URL}")
        print("=" * 60)
        
        # Test migration endpoint (no auth needed)
        self.test_setup_migrate_api()
        
        # Test authentication enforcement (should all return 401)
        self.test_audit_api_no_auth()
        self.test_leads_api_no_auth()
        self.test_leads_post_no_auth()
        self.test_leads_put_no_auth()
        self.test_staff_signup_no_auth()
        
        # Test emails API (no auth needed)
        self.test_emails_api()
        self.test_emails_post_validation()
        self.test_emails_post_specific_validation()
        
        # Test existing APIs still work
        self.test_existing_apis()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r['success'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n🎯 Overall Success Rate: {(passed/total)*100:.1f}%")
        
        return passed == total

if __name__ == "__main__":
    tester = InfinityOSAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! RBAC authentication layer is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the details above.")
        
    exit(0 if success else 1)