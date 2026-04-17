#!/usr/bin/env python3
"""
Backend Testing Script for Infinity Legal Platform Phase 1-4 APIs
Tests the new advisor chat, flagged matters, matter assignment, and audit log endpoints
"""

import requests
import json
import time
from datetime import datetime

# Base URL from environment
BASE_URL = "https://waitlist-legal-sa.preview.emergentagent.com"

def test_advisor_chat_api():
    """Test POST /api/advisor-chat — Advisor Chat with AI (No auth required)"""
    print("\n=== TESTING ADVISOR CHAT API ===")
    
    # Test 1a: New chat from member
    print("\n1a. Testing new chat from member...")
    try:
        payload = {
            "message": "I was unfairly dismissed from my job last week without a hearing",
            "userId": "test_member_1",
            "userEmail": "test@example.com",
            "userName": "Test Member",
            "role": "member"
        }
        response = requests.post(f"{BASE_URL}/api/advisor-chat", json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ SUCCESS: Chat created with sessionId: {data.get('sessionId')}")
            print(f"User message saved: {data.get('userMessage', {}).get('message', '')[:50]}...")
            
            # Check AI response
            ai_response = data.get('aiResponse')
            if ai_response and ai_response.get('message'):
                ai_msg = ai_response.get('message', '')
                print(f"AI response received: {ai_msg[:100]}...")
                
                # Test 1b: Verify AI response contains disclaimer
                if "⚠️ This is AI-generated legal information" in ai_msg:
                    print("✅ SUCCESS: AI response contains required disclaimer")
                else:
                    print("❌ FAIL: AI response missing disclaimer")
                    
                session_id = data.get('sessionId')
                
                # Test 1c: Continue conversation
                print("\n1c. Testing continue conversation...")
                continue_payload = {
                    "sessionId": session_id,
                    "message": "What are my rights at the CCMA?",
                    "userId": "test_member_1",
                    "role": "member"
                }
                continue_response = requests.post(f"{BASE_URL}/api/advisor-chat", json=continue_payload, timeout=30)
                print(f"Continue conversation status: {continue_response.status_code}")
                
                if continue_response.status_code == 201:
                    continue_data = continue_response.json()
                    if continue_data.get('aiResponse'):
                        print("✅ SUCCESS: AI responded to follow-up question")
                    else:
                        print("❌ FAIL: No AI response to follow-up")
                else:
                    print(f"❌ FAIL: Continue conversation failed with {continue_response.status_code}")
                
                # Test 1d: Advisor reply (should NOT get AI response)
                print("\n1d. Testing advisor reply...")
                advisor_payload = {
                    "sessionId": session_id,
                    "message": "Thank you for reaching out. Let me review your case.",
                    "role": "advisor"
                }
                advisor_response = requests.post(f"{BASE_URL}/api/advisor-chat", json=advisor_payload, timeout=30)
                print(f"Advisor reply status: {advisor_response.status_code}")
                
                if advisor_response.status_code == 201:
                    advisor_data = advisor_response.json()
                    if not advisor_data.get('aiResponse'):
                        print("✅ SUCCESS: Advisor message did NOT trigger AI response")
                    else:
                        print("❌ FAIL: Advisor message incorrectly triggered AI response")
                else:
                    print(f"❌ FAIL: Advisor reply failed with {advisor_response.status_code}")
                
                # Test 1e: Get chat history
                print("\n1e. Testing get chat history...")
                history_response = requests.get(f"{BASE_URL}/api/advisor-chat?sessionId={session_id}", timeout=30)
                print(f"Chat history status: {history_response.status_code}")
                
                if history_response.status_code == 200:
                    history_data = history_response.json()
                    messages = history_data.get('messages', [])
                    print(f"✅ SUCCESS: Retrieved {len(messages)} messages in chat history")
                    
                    # Verify message order
                    if len(messages) >= 3:
                        print("✅ SUCCESS: Chat history contains expected messages")
                    else:
                        print(f"❌ FAIL: Expected at least 3 messages, got {len(messages)}")
                else:
                    print(f"❌ FAIL: Get chat history failed with {history_response.status_code}")
                
                # Test 1f: List all sessions
                print("\n1f. Testing list all sessions...")
                sessions_response = requests.get(f"{BASE_URL}/api/advisor-chat", timeout=30)
                print(f"List sessions status: {sessions_response.status_code}")
                
                if sessions_response.status_code == 200:
                    sessions_data = sessions_response.json()
                    stats = sessions_data.get('stats', {})
                    sessions = sessions_data.get('sessions', [])
                    print(f"✅ SUCCESS: Retrieved {stats.get('total', 0)} total sessions")
                    print(f"Active: {stats.get('active', 0)}, Unassigned: {stats.get('unassigned', 0)}")
                else:
                    print(f"❌ FAIL: List sessions failed with {sessions_response.status_code}")
                    
            else:
                print("❌ FAIL: No AI response received")
        else:
            print(f"❌ FAIL: Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 1g: Empty message validation
    print("\n1g. Testing empty message validation...")
    try:
        empty_payload = {"message": ""}
        empty_response = requests.post(f"{BASE_URL}/api/advisor-chat", json=empty_payload, timeout=30)
        print(f"Empty message status: {empty_response.status_code}")
        
        if empty_response.status_code == 400:
            print("✅ SUCCESS: Empty message correctly returns 400")
        else:
            print(f"❌ FAIL: Expected 400 for empty message, got {empty_response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

def test_flagged_matters_api():
    """Test POST /api/flagged-matters — High-Risk Matter Flagging"""
    print("\n=== TESTING FLAGGED MATTERS API ===")
    
    # Test 2a: Flag critical matter
    print("\n2a. Testing flag critical matter...")
    try:
        critical_payload = {
            "query": "I was accused of murder",
            "userId": "user1",
            "matchedKeywords": ["murder"]
        }
        response = requests.post(f"{BASE_URL}/api/flagged-matters", json=critical_payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            severity = data.get('severity')
            print(f"✅ SUCCESS: Matter flagged with severity: {severity}")
            
            if severity == "critical":
                print("✅ SUCCESS: Murder case correctly flagged as critical")
            else:
                print(f"❌ FAIL: Expected 'critical' severity, got '{severity}'")
        else:
            print(f"❌ FAIL: Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 2b: Flag high matter
    print("\n2b. Testing flag high matter...")
    try:
        high_payload = {
            "query": "I need help with high court case",
            "matchedKeywords": ["high court"]
        }
        response = requests.post(f"{BASE_URL}/api/flagged-matters", json=high_payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            severity = data.get('severity')
            print(f"✅ SUCCESS: Matter flagged with severity: {severity}")
            
            if severity == "high":
                print("✅ SUCCESS: High court case correctly flagged as high")
            else:
                print(f"❌ FAIL: Expected 'high' severity, got '{severity}'")
        else:
            print(f"❌ FAIL: Expected 201, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 2c: List flagged matters
    print("\n2c. Testing list flagged matters...")
    try:
        response = requests.get(f"{BASE_URL}/api/flagged-matters", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            stats = data.get('stats', {})
            matters = data.get('matters', [])
            print(f"✅ SUCCESS: Retrieved {stats.get('total', 0)} total flagged matters")
            print(f"Pending: {stats.get('pending', 0)}, In Progress: {stats.get('inProgress', 0)}, Resolved: {stats.get('resolved', 0)}")
            print(f"Matters list contains {len(matters)} items")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

def test_matter_assignment_api():
    """Test POST /api/matter-assignment — Auto-Assign Cases"""
    print("\n=== TESTING MATTER ASSIGNMENT API ===")
    
    # Test 3a: Auto-assign labour case
    print("\n3a. Testing auto-assign labour case...")
    try:
        labour_payload = {
            "caseId": "test-case-1",
            "category": "labour"
        }
        response = requests.post(f"{BASE_URL}/api/matter-assignment", json=labour_payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                assignment = data.get('assignment', {})
                print(f"✅ SUCCESS: Labour case assigned to {assignment.get('advisor')}")
                print(f"Advisor workload: {assignment.get('activeWorkload')} active cases")
                print(f"Assignment method: {assignment.get('method')}")
            else:
                print(f"⚠️ INFO: {data.get('message', 'No advisors available')}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 3b: Auto-assign criminal case
    print("\n3b. Testing auto-assign criminal case...")
    try:
        criminal_payload = {
            "caseId": "test-case-2",
            "category": "criminal"
        }
        response = requests.post(f"{BASE_URL}/api/matter-assignment", json=criminal_payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                assignment = data.get('assignment', {})
                print(f"✅ SUCCESS: Criminal case assigned to {assignment.get('advisor')}")
            else:
                print(f"⚠️ INFO: {data.get('message', 'No advisors available')}")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 3c: Missing caseId validation
    print("\n3c. Testing missing caseId validation...")
    try:
        empty_payload = {}
        response = requests.post(f"{BASE_URL}/api/matter-assignment", json=empty_payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ SUCCESS: Missing caseId correctly returns 400")
        else:
            print(f"❌ FAIL: Expected 400 for missing caseId, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 3d: Get workloads
    print("\n3d. Testing get advisor workloads...")
    try:
        response = requests.get(f"{BASE_URL}/api/matter-assignment", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            workloads = data.get('workloads', [])
            total_advisors = data.get('totalAdvisors', 0)
            print(f"✅ SUCCESS: Retrieved workloads for {total_advisors} advisors")
            
            for workload in workloads[:3]:  # Show first 3
                print(f"  - {workload.get('advisorName', 'Unknown')}: {workload.get('activeCases', 0)} active, {workload.get('resolvedCases', 0)} resolved")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

def test_audit_log_api():
    """Test POST /api/audit-log — POPIA Audit Trail"""
    print("\n=== TESTING AUDIT LOG API ===")
    
    # Test 4a: Log access event
    print("\n4a. Testing log access event...")
    try:
        access_payload = {
            "action": "data_export",
            "userId": "user1",
            "userEmail": "user@test.com",
            "resource": "cases",
            "details": "User exported their data"
        }
        response = requests.post(f"{BASE_URL}/api/audit-log", json=access_payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ SUCCESS: Audit log entry created with ID: {data.get('auditId')}")
        else:
            print(f"❌ FAIL: Expected 201, got {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 4b: Log view event
    print("\n4b. Testing log view event...")
    try:
        view_payload = {
            "action": "document_view",
            "userId": "user1",
            "resource": "documents",
            "resourceId": "doc_123"
        }
        response = requests.post(f"{BASE_URL}/api/audit-log", json=view_payload, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ SUCCESS: Document view logged with ID: {data.get('auditId')}")
        else:
            print(f"❌ FAIL: Expected 201, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 4c: Get audit trail
    print("\n4c. Testing get audit trail...")
    try:
        response = requests.get(f"{BASE_URL}/api/audit-log", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logs = data.get('logs', [])
            total = data.get('total', 0)
            action_summary = data.get('actionSummary', [])
            
            print(f"✅ SUCCESS: Retrieved {len(logs)} audit logs (total: {total})")
            print("Action summary:")
            for action in action_summary[:5]:  # Show top 5 actions
                print(f"  - {action.get('action')}: {action.get('count')} times")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 4d: Filter by action
    print("\n4d. Testing filter by action...")
    try:
        response = requests.get(f"{BASE_URL}/api/audit-log?action=data_export", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logs = data.get('logs', [])
            print(f"✅ SUCCESS: Retrieved {len(logs)} data_export audit logs")
            
            # Verify filtering worked
            if logs:
                for log in logs[:3]:  # Check first 3
                    if log.get('action') == 'data_export':
                        print(f"  ✅ Filtered log: {log.get('action')} by {log.get('userEmail', 'unknown')}")
                    else:
                        print(f"  ❌ Filter failed: found {log.get('action')} instead of data_export")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

def main():
    """Run all Phase 1-4 API tests"""
    print("🚀 STARTING INFINITY LEGAL PLATFORM PHASE 1-4 API TESTING")
    print(f"Base URL: {BASE_URL}")
    print(f"Test started at: {datetime.now().isoformat()}")
    
    # Test all 4 Phase 1-4 APIs
    test_advisor_chat_api()
    test_flagged_matters_api()
    test_matter_assignment_api()
    test_audit_log_api()
    
    print(f"\n🏁 TESTING COMPLETED at {datetime.now().isoformat()}")
    print("\n=== SUMMARY ===")
    print("✅ = Test passed")
    print("❌ = Test failed")
    print("⚠️ = Test passed with warnings/info")

if __name__ == "__main__":
    main()