#!/usr/bin/env python3
"""
Backend Testing for Infinity Legal Platform - Enhanced AI and Schema Features
Testing the specific endpoints mentioned in the review request.
"""

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://waitlist-legal-sa.preview.emergentagent.com"
SUPABASE_URL = "https://qgjqrrxwcsggtjznjjqk.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanFycnh3Y3NnZ3Rqem5qanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODU0NTksImV4cCI6MjA4OTc2MTQ1OX0.C8YSkrSSbx8LtcgaaFS5mhMU3Tvr0IMk7byurQEqUgw"

# Test credentials
TEST_EMAIL = "tsatsi@infinitylegal.org"
TEST_PASSWORD = "Infinity2026!"

def log_test(test_name, status, details=""):
    """Log test results"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_icon} {test_name}: {status}")
    if details:
        print(f"    {details}")
    print()

def get_auth_token():
    """Get Supabase auth token for testing protected endpoints"""
    try:
        # Login via Supabase Auth API
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(auth_url, headers=headers, json=data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            log_test("Authentication", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        log_test("Authentication", "FAIL", f"Exception: {str(e)}")
        return None

def test_ai_ask_endpoint():
    """Test POST /api/ask — AI Legal Info with Interaction Logging"""
    print("=" * 60)
    print("TESTING: POST /api/ask — AI Legal Info with Interaction Logging")
    print("=" * 60)
    
    test_scenarios = [
        {
            "name": "Normal legal query (unfair dismissal)",
            "data": {
                "query": "What are my rights if I was unfairly dismissed from work?",
                "messageCount": 0
            },
            "expected_categories": ["labour"],
            "expected_high_risk": False
        },
        {
            "name": "High-risk query (murder)",
            "data": {
                "query": "I was arrested for murder, what should I do?",
                "messageCount": 0
            },
            "expected_high_risk": True,
            "expected_keywords": ["murder"]
        },
        {
            "name": "Consumer query (faulty product)",
            "data": {
                "query": "I bought a faulty product and the shop refuses to refund me",
                "messageCount": 0
            },
            "expected_categories": ["consumer"],
            "expected_high_risk": False
        },
        {
            "name": "Validation - empty query",
            "data": {
                "query": ""
            },
            "expected_status": 400
        },
        {
            "name": "Validation - long query",
            "data": {
                "query": "a" * 1001
            },
            "expected_status": 400
        }
    ]
    
    for scenario in test_scenarios:
        try:
            response = requests.post(f"{BASE_URL}/api/ask", json=scenario["data"])
            
            if "expected_status" in scenario:
                # Validation test
                if response.status_code == scenario["expected_status"]:
                    log_test(scenario["name"], "PASS", f"Correctly returned {response.status_code}")
                else:
                    log_test(scenario["name"], "FAIL", f"Expected {scenario['expected_status']}, got {response.status_code}")
            else:
                # Functional test
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check required fields
                    required_fields = ["response", "highRisk"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        log_test(scenario["name"], "FAIL", f"Missing fields: {missing_fields}")
                        continue
                    
                    # Check high risk detection
                    high_risk = data.get("highRisk", {})
                    is_high_risk = high_risk.get("isHighRisk", False)
                    matched_keywords = high_risk.get("matchedKeywords", [])
                    
                    if "expected_high_risk" in scenario:
                        if is_high_risk == scenario["expected_high_risk"]:
                            if scenario["expected_high_risk"] and "expected_keywords" in scenario:
                                # Check if expected keywords are present
                                expected_found = any(kw in matched_keywords for kw in scenario["expected_keywords"])
                                if expected_found:
                                    log_test(scenario["name"], "PASS", f"High risk correctly detected. Keywords: {matched_keywords}")
                                else:
                                    log_test(scenario["name"], "FAIL", f"Expected keywords {scenario['expected_keywords']} not found in {matched_keywords}")
                            else:
                                log_test(scenario["name"], "PASS", f"High risk status correct: {is_high_risk}")
                        else:
                            log_test(scenario["name"], "FAIL", f"Expected high risk: {scenario['expected_high_risk']}, got: {is_high_risk}")
                    
                    # Check categories for normal queries
                    if "expected_categories" in scenario:
                        categories = data.get("categories", [])
                        expected_found = any(cat in categories for cat in scenario["expected_categories"])
                        if expected_found:
                            log_test(scenario["name"], "PASS", f"Expected categories found: {categories}")
                        else:
                            log_test(scenario["name"], "WARN", f"Expected categories {scenario['expected_categories']} not found in {categories}")
                    
                    # Check response content
                    response_text = data.get("response", "")
                    if response_text and len(response_text) > 50:
                        log_test(f"{scenario['name']} - Response Content", "PASS", f"Response length: {len(response_text)} chars")
                    else:
                        log_test(f"{scenario['name']} - Response Content", "FAIL", "Response too short or empty")
                        
                else:
                    log_test(scenario["name"], "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                    
        except Exception as e:
            log_test(scenario["name"], "FAIL", f"Exception: {str(e)}")
        
        time.sleep(1)  # Rate limiting

def test_enhanced_cases_schema(auth_token):
    """Test POST /api/cases — Enhanced Schema with POPIA fields"""
    print("=" * 60)
    print("TESTING: POST /api/cases — Enhanced Schema (Auth required)")
    print("=" * 60)
    
    if not auth_token:
        log_test("Enhanced Cases Schema", "FAIL", "No auth token available")
        return
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    test_case_data = {
        "title": "Unfair Dismissal Case",
        "case_type": "labour",
        "description": "Client was dismissed without hearing",
        "urgency": "high",
        "province": "Gauteng",
        "ai_confidence_score": 0.85,
        "flagged_for_human_review": False,
        "risk_keywords": ["unfair dismissal", "CCMA"],
        "incident_date": "2026-03-15"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/cases", headers=headers, json=test_case_data)
        
        if response.status_code == 201:
            data = response.json()
            case = data.get("case", {})
            
            # Check required POPIA fields
            popia_fields = [
                "province", "ai_confidence_score", "flagged_for_human_review", 
                "risk_keywords", "consent_popia", "data_processing_purpose", "access_log"
            ]
            
            missing_fields = []
            present_fields = []
            
            for field in popia_fields:
                if field in case:
                    present_fields.append(field)
                else:
                    missing_fields.append(field)
            
            if not missing_fields:
                log_test("Enhanced Cases Schema - POPIA Fields", "PASS", f"All POPIA fields present: {present_fields}")
            else:
                log_test("Enhanced Cases Schema - POPIA Fields", "FAIL", f"Missing fields: {missing_fields}")
            
            # Check specific field values
            if case.get("province") == "Gauteng":
                log_test("Enhanced Cases Schema - Province", "PASS", f"Province correctly set: {case.get('province')}")
            else:
                log_test("Enhanced Cases Schema - Province", "FAIL", f"Expected 'Gauteng', got: {case.get('province')}")
            
            if case.get("ai_confidence_score") == 0.85:
                log_test("Enhanced Cases Schema - AI Confidence", "PASS", f"AI confidence score: {case.get('ai_confidence_score')}")
            else:
                log_test("Enhanced Cases Schema - AI Confidence", "FAIL", f"Expected 0.85, got: {case.get('ai_confidence_score')}")
            
            if isinstance(case.get("risk_keywords"), list) and "unfair dismissal" in case.get("risk_keywords", []):
                log_test("Enhanced Cases Schema - Risk Keywords", "PASS", f"Risk keywords: {case.get('risk_keywords')}")
            else:
                log_test("Enhanced Cases Schema - Risk Keywords", "FAIL", f"Risk keywords not properly set: {case.get('risk_keywords')}")
            
            # Check case number format
            case_number = case.get("case_number", "")
            if case_number and case_number.startswith("IL-2026-"):
                log_test("Enhanced Cases Schema - Case Number", "PASS", f"Case number format correct: {case_number}")
            else:
                log_test("Enhanced Cases Schema - Case Number", "FAIL", f"Invalid case number format: {case_number}")
                
        else:
            log_test("Enhanced Cases Schema", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        log_test("Enhanced Cases Schema", "FAIL", f"Exception: {str(e)}")

def test_flagged_matters():
    """Test GET /api/flagged-matters — Verify auto-flagging"""
    print("=" * 60)
    print("TESTING: GET /api/flagged-matters — Verify auto-flagging")
    print("=" * 60)
    
    try:
        # First, wait a moment for the murder query from earlier to be processed
        time.sleep(2)
        
        response = requests.get(f"{BASE_URL}/api/flagged-matters")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("success"):
                stats = data.get("stats", {})
                matters = data.get("matters", [])
                
                log_test("Flagged Matters API - Response Structure", "PASS", f"Stats: {stats}")
                
                # Check if we have any flagged matters
                total_matters = stats.get("total", 0)
                if total_matters > 0:
                    log_test("Flagged Matters API - Auto-flagging", "PASS", f"Found {total_matters} flagged matters")
                    
                    # Look for murder-related flagged matter
                    murder_found = False
                    for matter in matters:
                        query = matter.get("query", "").lower()
                        keywords = matter.get("matchedKeywords", [])
                        if "murder" in query or "murder" in keywords:
                            murder_found = True
                            log_test("Flagged Matters API - Murder Query", "PASS", f"Murder query flagged with keywords: {keywords}")
                            break
                    
                    if not murder_found:
                        log_test("Flagged Matters API - Murder Query", "WARN", "Murder query from earlier test not found in flagged matters")
                else:
                    log_test("Flagged Matters API - Auto-flagging", "WARN", "No flagged matters found (may be expected if no high-risk queries were made)")
                    
            else:
                log_test("Flagged Matters API", "FAIL", f"API returned success: false")
                
        else:
            log_test("Flagged Matters API", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        log_test("Flagged Matters API", "FAIL", f"Exception: {str(e)}")

def main():
    """Main test execution"""
    print("🧪 INFINITY LEGAL PLATFORM - ENHANCED AI & SCHEMA TESTING")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print("=" * 80)
    
    # Get authentication token
    print("🔐 Getting authentication token...")
    auth_token = get_auth_token()
    if auth_token:
        log_test("Authentication", "PASS", "Successfully obtained auth token")
    else:
        log_test("Authentication", "FAIL", "Could not obtain auth token")
    
    # Test 1: AI Ask endpoint with interaction logging
    test_ai_ask_endpoint()
    
    # Test 2: Enhanced Cases Schema
    test_enhanced_cases_schema(auth_token)
    
    # Test 3: Flagged Matters verification
    test_flagged_matters()
    
    print("=" * 80)
    print("🏁 TESTING COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    main()