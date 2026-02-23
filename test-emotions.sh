#!/bin/bash

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎭 Emotion TTS - Test Suite${NC}\n"

BASE_URL="http://localhost:3000"

# Function to test API
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -e "${YELLOW}Testing:${NC} $description"
    echo -e "${BLUE}Request:${NC} $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint")
    else
        echo -e "${BLUE}Data:${NC} $data"
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    echo -e "${BLUE}Response:${NC}"
    echo $response | jq '.' 2>/dev/null || echo $response
    echo -e "\n---\n"
}

# Test 1: Get Emotions
test_endpoint "GET" "/emotions" "" "Get Available Emotions"

# Test 2: Get Test Examples
test_endpoint "GET" "/test-emotions" "" "Get Test Examples"

# Test 3: Auto Emotion Detection - Happy
test_endpoint "POST" "/generate-tts" \
    '{"text":"Saya sangat senang dan bahagia hari ini!"}' \
    "Auto Emotion: Happy"

# Test 4: Auto Emotion Detection - Sad
test_endpoint "POST" "/generate-tts" \
    '{"text":"Aku sedih mendengar kabar buruk ini"}' \
    "Auto Emotion: Sad"

# Test 5: Auto Emotion Detection - Angry
test_endpoint "POST" "/generate-tts" \
    '{"text":"Ini sangat membuat saya marah!"}' \
    "Auto Emotion: Angry"

# Test 6: Auto Emotion Detection - Serious
test_endpoint "POST" "/generate-tts" \
    '{"text":"Ini adalah penting dan urgen untuk diimplementasikan"}' \
    "Auto Emotion: Serious"

# Test 7: Auto Emotion Detection - Calm
test_endpoint "POST" "/generate-tts" \
    '{"text":"Dengarkan dengan santai dan tenang"}' \
    "Auto Emotion: Calm"

# Test 8: Force Emotion - Override Text
test_endpoint "POST" "/generate-tts" \
    '{"text":"Halo dunia","forceEmotion":"angry"}' \
    "Force Emotion: Angry (overriding neutral text)"

# Test 9: Custom Model + Auto Emotion
test_endpoint "POST" "/generate-tts" \
    '{"text":"Hello world","model":"en_US-arctic-medium.onnx"}' \
    "Custom Model: Arctic Medium"

# Test 10: Invalid Input (too long)
test_endpoint "POST" "/generate-tts" \
    '{"text":"'$(printf 'a%.0s' {1..501})'"}' \
    "Invalid Input: Text too long (>500 chars)"

echo -e "${GREEN}✅ All tests completed!${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Visit http://localhost:3000/emotion-demo.html for interactive demo"
echo "2. Check console logs for emotion detection details"
echo "3. Review generated audio files in ./tmp/ directory"
