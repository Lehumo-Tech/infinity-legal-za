#!/usr/bin/env python3
"""
Backend API Testing Script for Infinity Legal Platform
Tests production readiness endpoints and existing APIs
"""

import requests
import json
import time
import sys
from urllib.parse import urljoin

# Base URL from environment
BASE_URL = "https://infinity-staging.preview.emergentagent.com"

def test_health_check():
    """Test GET /api/health endpoint"""
    print("\n=== Testing Health Check API ===")
    
    try:
        url = urljoin(BASE_URL, "/api/health")
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check successful")
            print(f"Status: {data.get('status')}")
            print(f"Version: {data.get('version')}")
            print(f"Uptime: {data.get('uptime')} seconds")
            print(f"Response Time: {data.get('responseTimeMs')} ms")
            
            # Check services
            services = data.get('services', {})
            mongodb_status = services.get('mongodb', {}).get('status')
            supabase_status = services.get('supabase', {}).get('status')
            
            print(f"MongoDB: {mongodb_status}")
            print(f"Supabase: {supabase_status}")
            
            # Check environment
            env = data.get('environment', {})
            print(f"Environment Valid: {env.get('valid')}")
            print(f"Environment Errors: {env.get('errors')}")
            print(f"Environment Warnings: {env.get('warnings')}")
            
            # Check memory
            memory = data.get('memory', {})
            print(f"Memory - Heap Used: {memory.get('heapUsedMB')} MB")
            print(f"Memory - RSS: {memory.get('rssMB')} MB")
            
            # Verify required fields
            required_fields = ['status', 'timestamp', 'version', 'uptime', 'services', 'environment', 'memory', 'responseTimeMs']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ Missing required fields: {missing_fields}")
                return False
            
            if mongodb_status != "connected":
                print(f"❌ MongoDB not connected: {mongodb_status}")
                return False
                
            if env.get('valid') != True:
                print(f"❌ Environment validation failed")
                return False
                
            print("✅ All health check requirements met")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_analytics_api():
    """Test POST /api/analytics and GET /api/analytics endpoints"""
    print("\n=== Testing Analytics API ===")
    
    # Test POST /api/analytics (public endpoint)
    try:
        url = urljoin(BASE_URL, "/api/analytics")
        print(f"Testing POST: {url}")
        
        # Test valid request
        payload = {
            "event": "page_view",
            "page": "/test",
            "referrer": "https://google.com",
            "metadata": {"test": True}
        }
        
        response = requests.post(url, json=payload, timeout=10)
        print(f"POST Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('ok') == True:
                print("✅ Analytics POST successful")
            else:
                print(f"❌ Analytics POST failed: {data}")
                return False
        else:
            print(f"❌ Analytics POST failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        # Test invalid request (missing fields)
        print("\nTesting POST with missing fields...")
        invalid_payload = {"event": "page_view"}  # Missing 'page'
        
        response = requests.post(url, json=invalid_payload, timeout=10)
        print(f"Invalid POST Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Analytics POST validation working correctly")
        else:
            print(f"❌ Analytics POST validation failed - expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Analytics POST error: {str(e)}")
        return False
    
    # Test GET /api/analytics (requires auth)
    try:
        print("\nTesting GET /api/analytics without auth...")
        response = requests.get(url, timeout=10)
        print(f"GET Status Code (no auth): {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Analytics GET auth protection working correctly")
            return True
        else:
            print(f"❌ Analytics GET auth protection failed - expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Analytics GET error: {str(e)}")
        return False

def test_sitemap():
    """Test GET /sitemap.xml endpoint"""
    print("\n=== Testing Sitemap ===")
    
    try:
        url = urljoin(BASE_URL, "/sitemap.xml")
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            print(f"Content Type: {response.headers.get('content-type')}")
            
            # Check if it's valid XML with URL entries
            if '<?xml' in content and '<urlset' in content and '<url>' in content:
                print("✅ Sitemap is valid XML")
                
                # Check for priority pages
                priority_pages = ['/', '/intake', '/pricing']
                found_pages = []
                
                for page in priority_pages:
                    if f"<loc>{BASE_URL}{page}</loc>" in content:
                        found_pages.append(page)
                
                print(f"Priority pages found: {found_pages}")
                
                # Check that protected URLs are NOT included
                protected_urls = ['/portal/', '/api/', '/dashboard/']
                found_protected = []
                
                for protected in protected_urls:
                    if protected in content:
                        found_protected.append(protected)
                
                if found_protected:
                    print(f"❌ Protected URLs found in sitemap: {found_protected}")
                    return False
                else:
                    print("✅ No protected URLs in sitemap")
                
                # Count total URLs
                url_count = content.count('<url>')
                print(f"Total URLs in sitemap: {url_count}")
                
                if url_count > 0:
                    print("✅ Sitemap contains URL entries")
                    return True
                else:
                    print("❌ Sitemap contains no URLs")
                    return False
            else:
                print("❌ Sitemap is not valid XML")
                print(f"Content preview: {content[:200]}...")
                return False
        else:
            print(f"❌ Sitemap failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Sitemap error: {str(e)}")
        return False

def test_robots_txt():
    """Test GET /robots.txt endpoint"""
    print("\n=== Testing Robots.txt ===")
    
    try:
        url = urljoin(BASE_URL, "/robots.txt")
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            print(f"Content Type: {response.headers.get('content-type')}")
            print(f"Content preview: {content[:200]}...")
            
            # Check for sitemap reference
            if 'sitemap.xml' in content.lower():
                print("✅ Robots.txt references sitemap.xml")
                return True
            else:
                print("❌ Robots.txt does not reference sitemap.xml")
                return False
        else:
            print(f"❌ Robots.txt failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Robots.txt error: {str(e)}")
        return False

def test_404_page():
    """Test custom 404 page"""
    print("\n=== Testing 404 Page ===")
    
    try:
        url = urljoin(BASE_URL, "/this-page-does-not-exist")
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            content = response.text
            print(f"Content Type: {response.headers.get('content-type')}")
            
            # Check if it's HTML content (custom 404 page)
            if 'html' in content.lower() and ('404' in content or 'not found' in content.lower()):
                print("✅ Custom 404 page returned")
                return True
            else:
                print("❌ 404 response is not HTML or doesn't contain 404 content")
                print(f"Content preview: {content[:200]}...")
                return False
        else:
            print(f"❌ Expected 404 status, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 404 page error: {str(e)}")
        return False

def test_existing_apis():
    """Test existing APIs to ensure nothing broke"""
    print("\n=== Testing Existing APIs ===")
    
    # Test GET /api/plans
    try:
        url = urljoin(BASE_URL, "/api/plans")
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Plans API Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'plans' in data:
                print(f"✅ Plans API working - found {len(data['plans'])} plans")
            else:
                print(f"❌ Plans API response missing 'plans' field")
                return False
        else:
            print(f"❌ Plans API failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Plans API error: {str(e)}")
        return False
    
    # Test GET /api/attorneys
    try:
        url = urljoin(BASE_URL, "/api/attorneys")
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Attorneys API Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'attorneys' in data:
                print(f"✅ Attorneys API working - found {len(data['attorneys'])} attorneys")
                return True
            else:
                print(f"❌ Attorneys API response missing 'attorneys' field")
                return False
        else:
            print(f"❌ Attorneys API failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Attorneys API error: {str(e)}")
        return False

def main():
    """Run all production readiness tests"""
    print("🚀 Starting Production Readiness Testing for Infinity Legal Platform")
    print(f"Base URL: {BASE_URL}")
    print("=" * 80)
    
    tests = [
        ("Health Check API", test_health_check),
        ("Analytics API", test_analytics_api),
        ("Sitemap", test_sitemap),
        ("Robots.txt", test_robots_txt),
        ("404 Page", test_404_page),
        ("Existing APIs", test_existing_apis),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            print(f"\n{'='*20} {test_name} {'='*20}")
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            results[test_name] = False
    
    # Summary
    print("\n" + "="*80)
    print("🏁 PRODUCTION READINESS TEST SUMMARY")
    print("="*80)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\nOverall Result: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL PRODUCTION READINESS TESTS PASSED!")
        return True
    else:
        print("⚠️  Some tests failed - review issues above")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)