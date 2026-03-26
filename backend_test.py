#!/usr/bin/env python3
"""
Infinity Legal Platform - Module 2 Case Management API Testing
Tests the 7 case management endpoints that need retesting
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://case-workspace-1.preview.emergentagent.com"
SUPABASE_URL = "https://qgjqrrxwcsggtjznjjqk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanFycnh3Y3NnZ3Rqem5qanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODU0NTksImV4cCI6MjA4OTc2MTQ1OX0.C8YSkrSSbx8LtcgaaFS5mhMU3Tvr0IMk7byurQEqUgw"

class CaseManagementTester:
    def __init__(self):
        self.auth_token = None
        self.test_user_id = None
        self.test_case_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def create_test_user(self):
        """Step 1: Create a test user via POST /api/auth/signup"""
        print("\n=== STEP 1: Creating Test User ===")
        
        # Generate unique email
        timestamp = int(time.time())
        test_email = f"casetest_{timestamp}@example.com"
        
        signup_data = {
            "email": test_email,
            "password": "TestPass123!",
            "fullName": "Case Tester",
            "role": "attorney"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_user_id = data.get("user", {}).get("id")
                self.log_result("User Signup", True, f"Created user: {test_email}")
                return test_email, "TestPass123!"
            else:
                self.log_result("User Signup", False, f"Status: {response.status_code}, Response: {response.text}")
                return None, None
                
        except Exception as e:
            self.log_result("User Signup", False, f"Exception: {str(e)}")
            return None, None
    
    def get_auth_token(self, email, password):
        """Step 2: Get auth token from Supabase"""
        print("\n=== STEP 2: Getting Auth Token ===")
        
        auth_data = {
            "email": email,
            "password": password
        }
        
        try:
            response = requests.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                json=auth_data,
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.log_result("Auth Token", True, "Successfully obtained auth token")
                return True
            else:
                self.log_result("Auth Token", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Auth Token", False, f"Exception: {str(e)}")
            return False
    
    def create_test_case(self):
        """Step 3: Create a case via POST /api/cases"""
        print("\n=== STEP 3: Creating Test Case ===")
        
        case_data = {
            "title": "Employment Dismissal Case",
            "case_type": "civil",
            "case_subtype": "Unfair Dismissal",
            "description": "Client was unfairly dismissed from their position without proper procedure",
            "urgency": "high",
            "status": "active",
            "court_date": "2024-03-15",
            "court_location": "Labour Court, Johannesburg"
        }
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/cases", json=case_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                case = data.get("case", {})
                self.test_case_id = case.get("id")
                case_number = case.get("case_number", "")
                
                # Verify Matter Number format IL-YYYY-NNNN
                if case_number and case_number.startswith("IL-") and len(case_number.split("-")) == 3:
                    year = case_number.split("-")[1]
                    seq = case_number.split("-")[2]
                    if len(year) == 4 and len(seq) == 4 and seq.isdigit():
                        self.log_result("Case Creation & Matter Number", True, f"Case created with Matter Number: {case_number}")
                        return True
                    else:
                        self.log_result("Case Creation & Matter Number", False, f"Invalid Matter Number format: {case_number}")
                        return False
                else:
                    self.log_result("Case Creation & Matter Number", False, f"Missing or invalid Matter Number: {case_number}")
                    return False
            else:
                self.log_result("Case Creation & Matter Number", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Case Creation & Matter Number", False, f"Exception: {str(e)}")
            return False
    
    def test_timeline_api(self):
        """Test Case Timeline API"""
        print("\n=== STEP 4a: Testing Timeline API ===")
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        # Test GET /api/cases/{id}/timeline
        try:
            response = requests.get(f"{BASE_URL}/api/cases/{self.test_case_id}/timeline", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                entries = data.get("entries", [])
                self.log_result("Timeline GET", True, f"Retrieved {len(entries)} timeline entries")
            else:
                self.log_result("Timeline GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Timeline GET", False, f"Exception: {str(e)}")
        
        # Test POST /api/cases/{id}/timeline
        timeline_data = {
            "type": "activity",
            "action": "case_review",
            "description": "Initial case review completed by legal officer",
            "metadata": {"reviewer": "Case Tester", "priority": "high"}
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/cases/{self.test_case_id}/timeline", json=timeline_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                entry = data.get("entry", {})
                self.log_result("Timeline POST", True, f"Created timeline entry: {entry.get('id')}")
            else:
                self.log_result("Timeline POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Timeline POST", False, f"Exception: {str(e)}")
    
    def test_notes_api(self):
        """Test Case Notes API (staff only)"""
        print("\n=== STEP 4b: Testing Notes API ===")
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        # Test GET /api/cases/{id}/notes
        try:
            response = requests.get(f"{BASE_URL}/api/cases/{self.test_case_id}/notes", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                notes = data.get("notes", [])
                self.log_result("Notes GET", True, f"Retrieved {len(notes)} notes (attorney role should work)")
            elif response.status_code == 403:
                self.log_result("Notes GET", False, "Got 403 - attorney role should have access to notes")
            else:
                self.log_result("Notes GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Notes GET", False, f"Exception: {str(e)}")
        
        # Test POST /api/cases/{id}/notes
        note_data = {
            "content": "Client provided additional documentation regarding dismissal procedure. Need to review company policy manual.",
            "category": "strategy"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/cases/{self.test_case_id}/notes", json=note_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                note = data.get("note", {})
                self.log_result("Notes POST", True, f"Created note: {note.get('id')}")
            elif response.status_code == 403:
                self.log_result("Notes POST", False, "Got 403 - attorney role should have access to create notes")
            else:
                self.log_result("Notes POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Notes POST", False, f"Exception: {str(e)}")
    
    def test_tasks_api(self):
        """Test Case Tasks API"""
        print("\n=== STEP 4c: Testing Tasks API ===")
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        # Test GET /api/cases/{id}/tasks
        try:
            response = requests.get(f"{BASE_URL}/api/cases/{self.test_case_id}/tasks", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                tasks = data.get("tasks", [])
                self.log_result("Tasks GET", True, f"Retrieved {len(tasks)} tasks")
            else:
                self.log_result("Tasks GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Tasks GET", False, f"Exception: {str(e)}")
        
        # Test POST /api/cases/{id}/tasks
        task_data = {
            "title": "Review Employment Contract",
            "description": "Analyze the employment contract for unfair dismissal clauses",
            "priority": "high",
            "dueDate": "2024-02-20",
            "assigneeName": "Case Tester"
        }
        
        task_id = None
        try:
            response = requests.post(f"{BASE_URL}/api/cases/{self.test_case_id}/tasks", json=task_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                task = data.get("task", {})
                task_id = task.get("id")
                self.log_result("Tasks POST", True, f"Created task: {task_id}")
            else:
                self.log_result("Tasks POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Tasks POST", False, f"Exception: {str(e)}")
        
        # Test PUT /api/cases/{id}/tasks (toggle to completed)
        if task_id:
            update_data = {
                "taskId": task_id,
                "status": "completed"
            }
            
            try:
                response = requests.put(f"{BASE_URL}/api/cases/{self.test_case_id}/tasks", json=update_data, headers=headers)
                
                if response.status_code == 200:
                    self.log_result("Tasks PUT (Complete)", True, f"Marked task {task_id} as completed")
                else:
                    self.log_result("Tasks PUT (Complete)", False, f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.log_result("Tasks PUT (Complete)", False, f"Exception: {str(e)}")
    
    def test_messages_api(self):
        """Test Case Messages API"""
        print("\n=== STEP 4d: Testing Messages API ===")
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        # Test GET /api/cases/{id}/messages
        try:
            response = requests.get(f"{BASE_URL}/api/cases/{self.test_case_id}/messages", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                messages = data.get("messages", [])
                self.log_result("Messages GET", True, f"Retrieved {len(messages)} messages")
            else:
                self.log_result("Messages GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Messages GET", False, f"Exception: {str(e)}")
        
        # Test POST /api/cases/{id}/messages (normal message)
        message_data = {
            "content": "Client has provided all requested documentation. Ready to proceed with case preparation.",
            "isInternal": False
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/cases/{self.test_case_id}/messages", json=message_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                message = data.get("message", {})
                self.log_result("Messages POST (Normal)", True, f"Created message: {message.get('id')}")
            else:
                self.log_result("Messages POST (Normal)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Messages POST (Normal)", False, f"Exception: {str(e)}")
        
        # Test POST /api/cases/{id}/messages (internal message)
        internal_message_data = {
            "content": "Internal note: Client seems very cooperative. High chance of successful settlement.",
            "isInternal": True
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/cases/{self.test_case_id}/messages", json=internal_message_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                message = data.get("message", {})
                self.log_result("Messages POST (Internal)", True, f"Created internal message: {message.get('id')}")
            else:
                self.log_result("Messages POST (Internal)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Messages POST (Internal)", False, f"Exception: {str(e)}")
    
    def test_assign_api(self):
        """Test Case Assignment API (requires MANAGE_CASES permission)"""
        print("\n=== STEP 4e: Testing Assignment API ===")
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        # Test PUT /api/cases/{id}/assign
        assign_data = {
            "leadAttorneyId": self.test_user_id,
            "supportTeam": ["paralegal_1", "legal_assistant_1"],
            "billingRate": 1500.00
        }
        
        try:
            response = requests.put(f"{BASE_URL}/api/cases/{self.test_case_id}/assign", json=assign_data, headers=headers)
            
            if response.status_code == 200:
                self.log_result("Assignment PUT", True, "Successfully assigned case (attorney has MANAGE_CASES permission)")
            elif response.status_code == 403:
                self.log_result("Assignment PUT", False, "Got 403 - attorney role should have MANAGE_CASES permission")
            else:
                self.log_result("Assignment PUT", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Assignment PUT", False, f"Exception: {str(e)}")
    
    def test_metadata_api(self):
        """Test Case Metadata API (prescription period and resource tracking)"""
        print("\n=== STEP 4f: Testing Metadata API ===")
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        # Test GET /api/cases/{id}/metadata
        try:
            response = requests.get(f"{BASE_URL}/api/cases/{self.test_case_id}/metadata", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                metadata = data.get("metadata", {})
                self.log_result("Metadata GET", True, f"Retrieved metadata for case {self.test_case_id}")
            else:
                self.log_result("Metadata GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Metadata GET", False, f"Exception: {str(e)}")
        
        # Test POST /api/cases/{id}/metadata (prescription period)
        prescription_data = {
            "prescription": {
                "type": "labour_unfair_dismissal",
                "startDate": "2024-01-15",
                "notes": "Dismissal occurred on 15 January 2024. 12-month prescription period applies."
            }
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/cases/{self.test_case_id}/metadata", json=prescription_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                metadata = data.get("metadata", {})
                prescription = metadata.get("prescription", {})
                expiry_date = prescription.get("expiryDate")
                self.log_result("Metadata POST (Prescription)", True, f"Set prescription period, expires: {expiry_date}")
            else:
                self.log_result("Metadata POST (Prescription)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Metadata POST (Prescription)", False, f"Exception: {str(e)}")
        
        # Test POST /api/cases/{id}/metadata (resource tracking)
        resource_data = {
            "resources": {
                "estimatedHours": 40,
                "budgetAllocated": 60000.00,
                "hourlyRate": 1500.00,
                "teamMembers": ["Case Tester", "Support Paralegal"],
                "notes": "Labour law case requiring extensive document review and court preparation"
            }
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/cases/{self.test_case_id}/metadata", json=resource_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                metadata = data.get("metadata", {})
                resources = metadata.get("resources", {})
                self.log_result("Metadata POST (Resources)", True, f"Set resource tracking: {resources.get('estimatedHours')} hours, R{resources.get('budgetAllocated')}")
            else:
                self.log_result("Metadata POST (Resources)", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_result("Metadata POST (Resources)", False, f"Exception: {str(e)}")
    
    def test_auth_required(self):
        """Test that all endpoints return 401 without auth token"""
        print("\n=== STEP 5: Testing Auth Required ===")
        
        endpoints = [
            ("GET", f"/api/cases/{self.test_case_id}/timeline"),
            ("POST", f"/api/cases/{self.test_case_id}/timeline"),
            ("GET", f"/api/cases/{self.test_case_id}/notes"),
            ("POST", f"/api/cases/{self.test_case_id}/notes"),
            ("GET", f"/api/cases/{self.test_case_id}/tasks"),
            ("POST", f"/api/cases/{self.test_case_id}/tasks"),
            ("PUT", f"/api/cases/{self.test_case_id}/tasks"),
            ("GET", f"/api/cases/{self.test_case_id}/messages"),
            ("POST", f"/api/cases/{self.test_case_id}/messages"),
            ("PUT", f"/api/cases/{self.test_case_id}/assign"),
            ("GET", f"/api/cases/{self.test_case_id}/metadata"),
            ("POST", f"/api/cases/{self.test_case_id}/metadata"),
        ]
        
        auth_failures = 0
        for method, endpoint in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{BASE_URL}{endpoint}")
                elif method == "POST":
                    response = requests.post(f"{BASE_URL}{endpoint}", json={})
                elif method == "PUT":
                    response = requests.put(f"{BASE_URL}{endpoint}", json={})
                
                if response.status_code == 401:
                    auth_failures += 1
                else:
                    print(f"   ⚠️  {method} {endpoint} returned {response.status_code} (expected 401)")
                    
            except Exception as e:
                print(f"   ❌ {method} {endpoint} failed: {str(e)}")
        
        self.log_result("Auth Required Check", auth_failures == len(endpoints), f"{auth_failures}/{len(endpoints)} endpoints correctly returned 401")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Infinity Legal Platform - Module 2 Case Management API Testing")
        print("=" * 80)
        
        # Step 1: Create test user
        email, password = self.create_test_user()
        if not email:
            print("❌ Cannot proceed without test user")
            return
        
        # Step 2: Get auth token
        if not self.get_auth_token(email, password):
            print("❌ Cannot proceed without auth token")
            return
        
        # Step 3: Create test case
        if not self.create_test_case():
            print("❌ Cannot proceed without test case")
            return
        
        # Step 4: Test all case sub-APIs
        self.test_timeline_api()
        self.test_notes_api()
        self.test_tasks_api()
        self.test_messages_api()
        self.test_assign_api()
        self.test_metadata_api()
        
        # Step 5: Test auth requirements
        self.test_auth_required()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["details"] and not result["success"]:
                print(f"   {result['details']}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    tester = CaseManagementTester()
    tester.run_all_tests()