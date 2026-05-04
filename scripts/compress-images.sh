#!/bin/bash
# Image compression script (requires ImageMagick or similar)
# For now, we'll just log what needs to be compressed

echo "Images larger than 500KB that need compression:"
echo ""
echo "public/images/attorney-consultation.png - 1593KB"
echo "public/images/client-getting-help.png - 1587KB"
echo "public/images/hero-legal-team.png - 1651KB"
echo "public/family-attorney.png - 2234KB"
echo "public/happy-family.png - 2245KB"
echo "public/hero-consultation.png - 2174KB"
echo "public/infinity_logo_sig.png - 1642KB"
echo "public/virtual-consultation.png - 1980KB"
echo ""
echo "Recommendation: Use WebP format or compress to under 500KB"

# If ImageMagick is available:
# mogrify -resize 1200x -quality 85 -format webp public/images/*.png
# mogrify -resize 1200x -quality 85 public/**/*.png
