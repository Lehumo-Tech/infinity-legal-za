#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Infinity Legal Platform
Testing all core API routes that have been rebuilt to use MongoDB instead of Supabase for data storage.
All APIs require Bearer token authentication except public endpoints.
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://infinity-legal-sa-1.preview.emergentagent.com"
SUPABASE_URL = "https://qgjqrrxwcsggtjznjjqk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanFycnh3Y3NnZ3Rqem5qanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODU0NTksImV4cCI6MjA4OTc2MTQ1OX0.C8YSkrSSbx8LtcgaaFS5mhMU3Tvr0IMk7byurQEqUgw"

# Test credentials
TEST_EMAIL = "tsatsi@infinitylegal.org"
TEST_PASSWORD = "Infinity2026!"

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

def test_without_auth(results, endpoint, method="GET"):
    """Test that endpoints require authentication"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json={})
        elif method == "PUT":
            response = requests.put(url, json={})
        
        if response.status_code == 401:
            results.add_result(f"Auth Required - {method} {endpoint}", True, "Correctly returns 401 without auth")
        else:
            results.add_result(f"Auth Required - {method} {endpoint}", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        results.add_result(f"Auth Required - {method} {endpoint}", False, f"Exception: {str(e)}")

def test_cases_crud(token, results):
    """Test Cases CRUD operations"""
    if not token:
        results.add_result("Cases CRUD", False, "No auth token available")
        return None
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    case_id = None
    
    try:
        # Test GET /api/cases (List all cases)
        response = requests.get(f"{BASE_URL}/api/cases", headers=headers)
        if response.status_code == 200:
            data = response.json()
            cases = data.get("cases", [])
            results.add_result("Cases GET", True, f"Retrieved {len(cases)} cases")
        else:
            results.add_result("Cases GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/cases (Create case)
        case_data = {
            "title": "Test Legal Matter - Contract Dispute",
            "case_type": "commercial",
            "description": "Testing case creation with MongoDB backend",
            "urgency": "high",
            "client_name": "Test Client Corp"
        }
        response = requests.post(f"{BASE_URL}/api/cases", headers=headers, json=case_data)
        if response.status_code == 201:
            data = response.json()
            case = data.get("case", {})
            case_id = case.get("id")
            case_number = case.get("case_number", "")
            if case_id and case_number.startswith("IL-"):
                results.add_result("Cases POST", True, f"Created case {case_number} with ID {case_id}")
            else:
                results.add_result("Cases POST", False, f"Missing case ID or invalid case number format")
        else:
            results.add_result("Cases POST", False, f"Status {response.status_code}: {response.text}")
        
        # Test PUT /api/cases (Update case)
        if case_id:
            update_data = {
                "id": case_id,
                "status": "active",
                "description": "Updated description for testing"
            }
            response = requests.put(f"{BASE_URL}/api/cases", headers=headers, json=update_data)
            if response.status_code == 200:
                data = response.json()
                updated_case = data.get("case", {})
                if updated_case.get("status") == "active":
                    results.add_result("Cases PUT", True, f"Updated case status to active")
                else:
                    results.add_result("Cases PUT", False, f"Status not updated correctly")
            else:
                results.add_result("Cases PUT", False, f"Status {response.status_code}: {response.text}")
        
    except Exception as e:
        results.add_result("Cases CRUD", False, f"Exception: {str(e)}")
    
    return case_id

def test_case_timeline(token, case_id, results):
    """Test Case Timeline API"""
    if not token or not case_id:
        results.add_result("Case Timeline", False, "No auth token or case ID available")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/cases/{case_id}/timeline", headers=headers)
        if response.status_code == 200:
            data = response.json()
            entries = data.get("entries", [])
            results.add_result("Case Timeline GET", True, f"Retrieved {len(entries)} timeline entries")
        else:
            results.add_result("Case Timeline GET", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Case Timeline GET", False, f"Exception: {str(e)}")

def test_case_notes(token, case_id, results):
    """Test Case Notes API"""
    if not token or not case_id:
        results.add_result("Case Notes", False, "No auth token or case ID available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/cases/{caseId}/notes
        response = requests.get(f"{BASE_URL}/api/cases/{case_id}/notes", headers=headers)
        if response.status_code == 200:
            data = response.json()
            notes = data.get("notes", [])
            results.add_result("Case Notes GET", True, f"Retrieved {len(notes)} notes")
        else:
            results.add_result("Case Notes GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/cases/{caseId}/notes
        note_data = {
            "content": "This is a test note for the case",
            "category": "general"
        }
        response = requests.post(f"{BASE_URL}/api/cases/{case_id}/notes", headers=headers, json=note_data)
        if response.status_code == 201:
            data = response.json()
            note = data.get("note", {})
            if note.get("content") == note_data["content"]:
                results.add_result("Case Notes POST", True, f"Created note with ID {note.get('id')}")
            else:
                results.add_result("Case Notes POST", False, f"Note content mismatch")
        else:
            results.add_result("Case Notes POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Case Notes", False, f"Exception: {str(e)}")

def test_case_tasks(token, case_id, results):
    """Test Case Tasks API"""
    if not token or not case_id:
        results.add_result("Case Tasks", False, "No auth token or case ID available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    task_id = None
    
    try:
        # Test GET /api/cases/{caseId}/tasks
        response = requests.get(f"{BASE_URL}/api/cases/{case_id}/tasks", headers=headers)
        if response.status_code == 200:
            data = response.json()
            tasks = data.get("tasks", [])
            results.add_result("Case Tasks GET", True, f"Retrieved {len(tasks)} tasks")
        else:
            results.add_result("Case Tasks GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/cases/{caseId}/tasks
        task_data = {
            "title": "Review contract documents",
            "priority": "high",
            "dueDate": (datetime.now() + timedelta(days=7)).isoformat()
        }
        response = requests.post(f"{BASE_URL}/api/cases/{case_id}/tasks", headers=headers, json=task_data)
        if response.status_code == 201:
            data = response.json()
            task = data.get("task", {})
            task_id = task.get("id")
            if task.get("title") == task_data["title"]:
                results.add_result("Case Tasks POST", True, f"Created task with ID {task_id}")
            else:
                results.add_result("Case Tasks POST", False, f"Task title mismatch")
        else:
            results.add_result("Case Tasks POST", False, f"Status {response.status_code}: {response.text}")
        
        # Test PUT /api/cases/{caseId}/tasks (Update task)
        if task_id:
            update_data = {
                "taskId": task_id,
                "status": "completed"
            }
            response = requests.put(f"{BASE_URL}/api/cases/{case_id}/tasks", headers=headers, json=update_data)
            if response.status_code == 200:
                results.add_result("Case Tasks PUT", True, f"Updated task status to completed")
            else:
                results.add_result("Case Tasks PUT", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Case Tasks", False, f"Exception: {str(e)}")

def test_case_messages(token, case_id, results):
    """Test Case Messages API"""
    if not token or not case_id:
        results.add_result("Case Messages", False, "No auth token or case ID available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/cases/{caseId}/messages
        response = requests.get(f"{BASE_URL}/api/cases/{case_id}/messages", headers=headers)
        if response.status_code == 200:
            data = response.json()
            messages = data.get("messages", [])
            results.add_result("Case Messages GET", True, f"Retrieved {len(messages)} messages")
        else:
            results.add_result("Case Messages GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/cases/{caseId}/messages
        message_data = {
            "content": "This is a test message for the case",
            "isInternal": True
        }
        response = requests.post(f"{BASE_URL}/api/cases/{case_id}/messages", headers=headers, json=message_data)
        if response.status_code == 201:
            data = response.json()
            message = data.get("message", {})
            if message.get("content") == message_data["content"]:
                results.add_result("Case Messages POST", True, f"Created message with ID {message.get('id')}")
            else:
                results.add_result("Case Messages POST", False, f"Message content mismatch")
        else:
            results.add_result("Case Messages POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Case Messages", False, f"Exception: {str(e)}")

def test_case_metadata(token, case_id, results):
    """Test Case Metadata API"""
    if not token or not case_id:
        results.add_result("Case Metadata", False, "No auth token or case ID available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/cases/{caseId}/metadata
        response = requests.get(f"{BASE_URL}/api/cases/{case_id}/metadata", headers=headers)
        if response.status_code == 200:
            data = response.json()
            metadata = data.get("metadata", {})
            results.add_result("Case Metadata GET", True, f"Retrieved metadata")
        else:
            results.add_result("Case Metadata GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/cases/{caseId}/metadata
        metadata_data = {
            "jurisdiction": "Gauteng High Court",
            "opposing_counsel": "Smith & Associates",
            "case_value": 500000
        }
        response = requests.post(f"{BASE_URL}/api/cases/{case_id}/metadata", headers=headers, json=metadata_data)
        if response.status_code == 200:
            results.add_result("Case Metadata POST", True, f"Saved metadata successfully")
        else:
            results.add_result("Case Metadata POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Case Metadata", False, f"Exception: {str(e)}")

def test_dashboard_stats(token, results):
    """Test Dashboard Stats API"""
    if not token:
        results.add_result("Dashboard Stats", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        if response.status_code == 200:
            data = response.json()
            stats = data.get("stats", {})
            recent_cases = data.get("recentCases", [])
            required_fields = ["totalCases", "activeCases", "pendingTasks"]
            
            if all(field in stats for field in required_fields):
                results.add_result("Dashboard Stats", True, f"Retrieved stats: {stats['totalCases']} total cases, {stats['activeCases']} active, {len(recent_cases)} recent")
            else:
                results.add_result("Dashboard Stats", False, f"Missing required fields in stats")
        else:
            results.add_result("Dashboard Stats", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Dashboard Stats", False, f"Exception: {str(e)}")

def test_clients_crud(token, results):
    """Test Clients CRUD operations"""
    if not token:
        results.add_result("Clients CRUD", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/clients
        response = requests.get(f"{BASE_URL}/api/clients", headers=headers)
        if response.status_code == 200:
            data = response.json()
            clients = data.get("clients", [])
            results.add_result("Clients GET", True, f"Retrieved {len(clients)} clients")
        else:
            results.add_result("Clients GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/clients
        client_data = {
            "name": "Test Client Corporation",
            "email": "testclient@example.co.za",
            "phone": "+27821234567"
        }
        response = requests.post(f"{BASE_URL}/api/clients", headers=headers, json=client_data)
        if response.status_code == 201:
            data = response.json()
            client = data.get("client", {})
            if client.get("name") == client_data["name"]:
                results.add_result("Clients POST", True, f"Created client with ID {client.get('id')}")
            else:
                results.add_result("Clients POST", False, f"Client name mismatch")
        else:
            results.add_result("Clients POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Clients CRUD", False, f"Exception: {str(e)}")

def test_leads_crud(token, results):
    """Test Leads CRUD operations"""
    if not token:
        results.add_result("Leads CRUD", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/leads
        response = requests.get(f"{BASE_URL}/api/leads", headers=headers)
        if response.status_code == 200:
            data = response.json()
            leads = data.get("leads", [])
            results.add_result("Leads GET", True, f"Retrieved {len(leads)} leads")
        else:
            results.add_result("Leads GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/leads
        lead_data = {
            "name": "Test Lead Person",
            "email": "testlead@example.co.za",
            "phone": "+27821234567",
            "source": "website",
            "category": "commercial"
        }
        response = requests.post(f"{BASE_URL}/api/leads", headers=headers, json=lead_data)
        if response.status_code == 201:
            data = response.json()
            lead = data.get("lead", {})
            if lead.get("name") == lead_data["name"]:
                results.add_result("Leads POST", True, f"Created lead with ID {lead.get('id')}")
            else:
                results.add_result("Leads POST", False, f"Lead name mismatch")
        else:
            results.add_result("Leads POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Leads CRUD", False, f"Exception: {str(e)}")

def test_documents_crud(token, results):
    """Test Documents CRUD operations"""
    if not token:
        results.add_result("Documents CRUD", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/documents
        response = requests.get(f"{BASE_URL}/api/documents", headers=headers)
        if response.status_code == 200:
            data = response.json()
            documents = data.get("documents", [])
            results.add_result("Documents GET", True, f"Retrieved {len(documents)} documents")
        else:
            results.add_result("Documents GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/documents
        doc_data = {
            "title": "Test Contract Document",
            "type": "contract",
            "content": "This is a test document content for testing purposes"
        }
        response = requests.post(f"{BASE_URL}/api/documents", headers=headers, json=doc_data)
        if response.status_code == 201:
            data = response.json()
            document = data.get("document", {})
            if document.get("title") == doc_data["title"]:
                results.add_result("Documents POST", True, f"Created document with ID {document.get('id')}")
            else:
                results.add_result("Documents POST", False, f"Document title mismatch")
        else:
            results.add_result("Documents POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Documents CRUD", False, f"Exception: {str(e)}")

def test_tasks_crud(token, results):
    """Test Tasks CRUD operations"""
    if not token:
        results.add_result("Tasks CRUD", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/tasks
        response = requests.get(f"{BASE_URL}/api/tasks", headers=headers)
        if response.status_code == 200:
            data = response.json()
            tasks = data.get("tasks", [])
            results.add_result("Tasks GET", True, f"Retrieved {len(tasks)} tasks")
        else:
            results.add_result("Tasks GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/tasks
        task_data = {
            "title": "Review legal documents",
            "priority": "high"
        }
        response = requests.post(f"{BASE_URL}/api/tasks", headers=headers, json=task_data)
        if response.status_code == 201:
            data = response.json()
            task = data.get("task", {})
            if task.get("title") == task_data["title"]:
                results.add_result("Tasks POST", True, f"Created task with ID {task.get('id')}")
            else:
                results.add_result("Tasks POST", False, f"Task title mismatch")
        else:
            results.add_result("Tasks POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Tasks CRUD", False, f"Exception: {str(e)}")

def test_intakes_api(token, results):
    """Test Intakes API"""
    if not token:
        results.add_result("Intakes API", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/intakes", headers=headers)
        if response.status_code == 200:
            data = response.json()
            intakes = data.get("intakes", [])
            results.add_result("Intakes GET", True, f"Retrieved {len(intakes)} intakes")
        else:
            results.add_result("Intakes GET", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Intakes API", False, f"Exception: {str(e)}")

def test_notifications_api(token, results):
    """Test Notifications API"""
    if not token:
        results.add_result("Notifications API", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/notifications
        response = requests.get(f"{BASE_URL}/api/notifications", headers=headers)
        if response.status_code == 200:
            data = response.json()
            notifications = data.get("notifications", [])
            unread_count = data.get("unreadCount", 0)
            results.add_result("Notifications GET", True, f"Retrieved {len(notifications)} notifications, {unread_count} unread")
        else:
            results.add_result("Notifications GET", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.add_result("Notifications API", False, f"Exception: {str(e)}")

def test_calendar_api(token, results):
    """Test Calendar API"""
    if not token:
        results.add_result("Calendar API", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/calendar
        response = requests.get(f"{BASE_URL}/api/calendar", headers=headers)
        if response.status_code == 200:
            data = response.json()
            events = data.get("events", [])
            results.add_result("Calendar GET", True, f"Retrieved {len(events)} calendar events")
        else:
            results.add_result("Calendar GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/calendar
        event_data = {
            "title": "Test Meeting",
            "date": (datetime.now() + timedelta(days=1)).isoformat().split('T')[0],
            "type": "meeting"
        }
        response = requests.post(f"{BASE_URL}/api/calendar", headers=headers, json=event_data)
        if response.status_code == 201:
            data = response.json()
            event = data.get("event", {})
            if event.get("title") == event_data["title"]:
                results.add_result("Calendar POST", True, f"Created event with ID {event.get('id')}")
            else:
                results.add_result("Calendar POST", False, f"Event title mismatch")
        else:
            results.add_result("Calendar POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Calendar API", False, f"Exception: {str(e)}")

def test_messages_api(token, results):
    """Test Messages API"""
    if not token:
        results.add_result("Messages API", False, "No auth token available")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        # Test GET /api/messages
        response = requests.get(f"{BASE_URL}/api/messages", headers=headers)
        if response.status_code == 200:
            data = response.json()
            messages = data.get("messages", [])
            results.add_result("Messages GET", True, f"Retrieved {len(messages)} messages")
        else:
            results.add_result("Messages GET", False, f"Status {response.status_code}: {response.text}")
        
        # Test POST /api/messages
        message_data = {
            "content": "This is a test message",
            "recipientId": "test_recipient"
        }
        response = requests.post(f"{BASE_URL}/api/messages", headers=headers, json=message_data)
        if response.status_code == 201:
            data = response.json()
            message = data.get("message", {})
            if message.get("content") == message_data["content"]:
                results.add_result("Messages POST", True, f"Created message with ID {message.get('id')}")
            else:
                results.add_result("Messages POST", False, f"Message content mismatch")
        else:
            results.add_result("Messages POST", False, f"Status {response.status_code}: {response.text}")
            
    except Exception as e:
        results.add_result("Messages API", False, f"Exception: {str(e)}")

def main():
    """Main test execution"""
    print("🚀 Starting Comprehensive Backend Testing for Infinity Legal Platform")
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print(f"Testing all core API routes that have been rebuilt to use MongoDB")
    
    results = TestResults()
    
    # Step 1: Test authentication endpoints without auth (should return 401)
    print(f"\n{'='*60}")
    print("TESTING AUTHENTICATION REQUIREMENTS")
    print(f"{'='*60}")
    
    auth_required_endpoints = [
        "/api/cases", "/api/tasks", "/api/clients", "/api/leads", "/api/documents",
        "/api/dashboard/stats", "/api/intakes", "/api/notifications", "/api/calendar", "/api/messages"
    ]
    
    for endpoint in auth_required_endpoints:
        test_without_auth(results, endpoint, "GET")
        test_without_auth(results, endpoint, "POST")
    
    # Step 2: Login and get token
    print(f"\n{'='*60}")
    print("AUTHENTICATION")
    print(f"{'='*60}")
    
    token = login_to_supabase()
    if not token:
        results.add_result("Authentication", False, "Could not obtain auth token")
        print("❌ Cannot proceed with authenticated tests without token")
        results.summary()
        return False
    
    # Step 3: Test all core API endpoints with authentication
    print(f"\n{'='*60}")
    print("TESTING CORE API ENDPOINTS WITH AUTHENTICATION")
    print(f"{'='*60}")
    
    # Test Cases CRUD (most important)
    case_id = test_cases_crud(token, results)
    
    # Test case-related endpoints if we have a case ID
    if case_id:
        test_case_timeline(token, case_id, results)
        test_case_notes(token, case_id, results)
        test_case_tasks(token, case_id, results)
        test_case_messages(token, case_id, results)
        test_case_metadata(token, case_id, results)
    
    # Test other core endpoints
    test_dashboard_stats(token, results)
    test_clients_crud(token, results)
    test_leads_crud(token, results)
    test_documents_crud(token, results)
    test_tasks_crud(token, results)
    test_intakes_api(token, results)
    test_notifications_api(token, results)
    test_calendar_api(token, results)
    test_messages_api(token, results)
    
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
        print("🎉 ALL TESTS PASSED! All core API routes are working correctly with MongoDB backend.")
    else:
        print(f"⚠️  {failed} test(s) failed. Please review the issues above.")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)