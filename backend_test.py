#!/usr/bin/env python3
"""
Backend API Testing for Infinity Legal Platform
Testing Lead Capture and Reddit Social Listening APIs
"""

import requests
import json
import time
from datetime import datetime

# Base URL from environment
BASE_URL = "https://waitlist-legal-sa.preview.emergentagent.com"

def test_lead_capture_api():
    """Test POST /api/waitlist - Enhanced Lead Capture with Scoring"""
    print("\n=== TESTING LEAD CAPTURE API ===")
    
    # Test Case 1: CCMA lead with .co.za email + phone (should be hot priority, score >= 4)
    print("\n1. Testing CCMA lead with .co.za email + phone...")
    try:
        payload = {
            "email": "thabo@company.co.za",
            "name": "Thabo Mokoena", 
            "phone": "+27821234567",
            "legal_need": "CCMA",
            "plan": "Labour Legal Plan",
            "source": "homepage"
        }
        response = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ CCMA lead created successfully")
        else:
            print(f"❌ Expected 201, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing CCMA lead: {e}")
    
    # Test Case 2: Divorce lead with regular email (should be warm priority, score ~2)
    print("\n2. Testing Divorce lead with regular email...")
    try:
        payload = {
            "email": "test_divorce@gmail.com",
            "name": "Nomsa D",
            "legal_need": "Divorce", 
            "plan": "Civil Legal Plan",
            "source": "pricing"
        }
        response = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Divorce lead created successfully")
        else:
            print(f"❌ Expected 201, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing Divorce lead: {e}")
    
    # Test Case 3: General enquiry (low score, cold priority)
    print("\n3. Testing General enquiry (low score)...")
    try:
        payload = {
            "email": "test_general@yahoo.com",
            "legal_need": "General"
        }
        response = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ General enquiry created successfully")
        else:
            print(f"❌ Expected 201, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing General enquiry: {e}")
    
    # Test Case 4: Eviction lead with phone (score ~3, warm priority)
    print("\n4. Testing Eviction lead with phone...")
    try:
        payload = {
            "email": "test_evict@gmail.com",
            "name": "Peter",
            "phone": "+27831234567",
            "legal_need": "Eviction"
        }
        response = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Eviction lead created successfully")
        else:
            print(f"❌ Expected 201, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing Eviction lead: {e}")
    
    # Test Case 5: Duplicate email handling (should return 200 with "Welcome back" message)
    print("\n5. Testing duplicate email handling...")
    try:
        payload = {
            "email": "thabo@company.co.za",
            "name": "Thabo Mokoena", 
            "phone": "+27821234567",
            "legal_need": "CCMA",
            "plan": "Labour Legal Plan",
            "source": "homepage"
        }
        response = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and "Welcome back" in response.json().get("message", ""):
            print("✅ Duplicate email handling working correctly")
        else:
            print(f"❌ Expected 200 with 'Welcome back' message, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing duplicate email: {e}")
    
    # Test Case 6: Missing email AND phone (should return 400)
    print("\n6. Testing missing email AND phone...")
    try:
        payload = {}
        response = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 400:
            print("✅ Validation working correctly for missing email/phone")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing validation: {e}")
    
    # Test Case 7: Phone only (should return 201)
    print("\n7. Testing phone only...")
    try:
        payload = {
            "phone": "+27841234567",
            "name": "Phone User",
            "legal_need": "Criminal"
        }
        response = requests.post(f"{BASE_URL}/api/waitlist", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Phone-only lead created successfully")
        else:
            print(f"❌ Expected 201, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing phone-only lead: {e}")

def test_lead_list_api():
    """Test GET /api/waitlist - Lead List with Stats"""
    print("\n=== TESTING LEAD LIST API ===")
    
    # Test Case 1: Get all leads
    print("\n1. Testing GET all leads...")
    try:
        response = requests.get(f"{BASE_URL}/api/waitlist")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response keys: {list(data.keys())}")
        
        if response.status_code == 200:
            # Check required fields
            required_fields = ['count', 'stats', 'leads']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ All required fields present")
                print(f"Count: {data['count']}")
                print(f"Stats: {data['stats']}")
                print(f"Number of leads: {len(data['leads'])}")
                
                # Check stats structure
                stats = data['stats']
                stats_fields = ['total', 'hot', 'warm', 'cool', 'cold']
                missing_stats = [field for field in stats_fields if field not in stats]
                
                if not missing_stats:
                    print("✅ Stats structure correct")
                    print(f"Stats breakdown: {stats}")
                else:
                    print(f"❌ Missing stats fields: {missing_stats}")
                
                # Check if leads are sorted by score descending
                if data['leads']:
                    scores = [lead.get('score', 0) for lead in data['leads']]
                    if scores == sorted(scores, reverse=True):
                        print("✅ Leads sorted by score descending")
                    else:
                        print("❌ Leads not properly sorted by score")
                        
                    # Check lead structure
                    first_lead = data['leads'][0]
                    lead_fields = ['id', 'email', 'name', 'legal_need', 'score', 'priority', 'status', 'joinedAt']
                    missing_lead_fields = [field for field in lead_fields if field not in first_lead]
                    
                    if not missing_lead_fields:
                        print("✅ Lead structure correct")
                        print(f"Sample lead: {first_lead}")
                    else:
                        print(f"❌ Missing lead fields: {missing_lead_fields}")
                        
            else:
                print(f"❌ Missing required fields: {missing_fields}")
        else:
            print(f"❌ Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing lead list: {e}")
    
    # Test Case 2: Filter by priority (hot)
    print("\n2. Testing filter by priority=hot...")
    try:
        response = requests.get(f"{BASE_URL}/api/waitlist?priority=hot")
        print(f"Status: {response.status_code}")
        data = response.json()
        
        if response.status_code == 200:
            hot_leads = data['leads']
            if all(lead.get('priority') == 'hot' for lead in hot_leads):
                print(f"✅ Hot filter working correctly, found {len(hot_leads)} hot leads")
            else:
                print("❌ Hot filter not working correctly")
        else:
            print(f"❌ Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing hot filter: {e}")
    
    # Test Case 3: Check that stats.total matches count
    print("\n3. Verifying stats.total matches count...")
    try:
        response = requests.get(f"{BASE_URL}/api/waitlist")
        data = response.json()
        
        if response.status_code == 200:
            count = data['count']
            stats_total = data['stats']['total']
            
            if count == stats_total:
                print(f"✅ Count ({count}) matches stats.total ({stats_total})")
            else:
                print(f"❌ Count ({count}) does not match stats.total ({stats_total})")
        else:
            print(f"❌ Expected 200, got {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error verifying count/stats: {e}")

def test_reddit_leads_api():
    """Test GET /api/reddit-leads - Reddit RSS Social Listening"""
    print("\n=== TESTING REDDIT SOCIAL LISTENING API ===")
    
    # Test Case 1: Basic fetch
    print("\n1. Testing basic Reddit leads fetch...")
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/api/reddit-leads", timeout=30)
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Response time: {response_time:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            # Check required fields
            required_fields = ['success', 'total', 'subreddits', 'lastFetched', 'disclaimer', 'posts']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ All required fields present")
                print(f"Success: {data['success']}")
                print(f"Total posts: {data['total']}")
                print(f"Subreddits: {data['subreddits']}")
                print(f"Last fetched: {data['lastFetched']}")
                print(f"Disclaimer: {data['disclaimer'][:100]}...")
                
                # Check disclaimer mentions POPIA and consent form
                disclaimer = data['disclaimer'].lower()
                if 'popia' in disclaimer and 'consent' in disclaimer:
                    print("✅ Disclaimer mentions POPIA and consent form")
                else:
                    print("❌ Disclaimer missing POPIA or consent form reference")
                
                # Check response time is reasonable (< 30s)
                if response_time < 30:
                    print(f"✅ Response time reasonable ({response_time:.2f}s < 30s)")
                else:
                    print(f"❌ Response time too slow ({response_time:.2f}s >= 30s)")
                
                # Check posts structure if any posts exist
                posts = data['posts']
                if posts:
                    print(f"Found {len(posts)} posts")
                    first_post = posts[0]
                    post_fields = ['title', 'link', 'subreddit', 'matchedKeywords', 'score', 'priority']
                    missing_post_fields = [field for field in post_fields if field not in first_post]
                    
                    if not missing_post_fields:
                        print("✅ Post structure correct")
                        print(f"Sample post: {first_post}")
                    else:
                        print(f"❌ Missing post fields: {missing_post_fields}")
                else:
                    print("ℹ️ No posts found (this is normal if no recent legal posts on Reddit)")
                    
            else:
                print(f"❌ Missing required fields: {missing_fields}")
        else:
            print(f"❌ Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out (>30s)")
    except Exception as e:
        print(f"❌ Error testing Reddit leads: {e}")

def run_all_tests():
    """Run all backend API tests"""
    print("🚀 STARTING BACKEND API TESTING FOR INFINITY LEGAL PLATFORM")
    print(f"Base URL: {BASE_URL}")
    print(f"Test started at: {datetime.now().isoformat()}")
    
    # Test Lead Capture API
    test_lead_capture_api()
    
    # Test Lead List API  
    test_lead_list_api()
    
    # Test Reddit Social Listening API
    test_reddit_leads_api()
    
    print(f"\n🏁 TESTING COMPLETED at {datetime.now().isoformat()}")

if __name__ == "__main__":
    run_all_tests()