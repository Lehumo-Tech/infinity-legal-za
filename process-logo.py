"""
Crop the official logo into different versions:
1. Icon only (scales + infinity symbol) - for nav bars
2. Icon + tagline text - for login/signup pages  
3. Full logo - for hero sections
"""
from PIL import Image
import os

SRC = '/app/public/logo-official.jpeg'
OUT_DIR = '/app/public'

img = Image.open(SRC).convert('RGBA')
W, H = img.size
print(f"Original: {W}x{H}")

# The image layout (1600x892):
# Top ~60% is the icon (scales + infinity)
# ~60-75% is the tagline text
# Bottom ~25% is the CTA buttons

# 1. Icon only (crop top portion with the scales)
# The icon is centered roughly in the top 55% of the image
icon_crop = img.crop((W*0.25, H*0.02, W*0.75, H*0.58))
# Save at multiple sizes
for size_name, max_dim in [('logo-icon-512', 512), ('logo-icon-256', 256), ('logo-icon-128', 128), ('logo-icon-64', 64)]:
    resized = icon_crop.copy()
    resized.thumbnail((max_dim, max_dim), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, f'{size_name}.png'), 'PNG', optimize=True)
    print(f"{size_name}.png: {resized.size}")

# 2. Icon + tagline (no buttons) - top 75%
icon_text_crop = img.crop((W*0.05, H*0.02, W*0.95, H*0.75))
for size_name, max_dim in [('logo-full-512', 512), ('logo-full-256', 256)]:
    resized = icon_text_crop.copy()
    resized.thumbnail((max_dim, max_dim), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, f'{size_name}.png'), 'PNG', optimize=True)
    print(f"{size_name}.png: {resized.size}")

# 3. Replace the main logo.png with icon-only version (best for nav)
main_logo = icon_crop.copy()
main_logo.thumbnail((512, 512), Image.LANCZOS)
main_logo.save(os.path.join(OUT_DIR, 'logo.png'), 'PNG', optimize=True)
print(f"logo.png (replaced with icon crop): {main_logo.size}")

# 4. Favicon from the icon
fav = icon_crop.copy()
fav.thumbnail((32, 32), Image.LANCZOS)
fav.save(os.path.join(OUT_DIR, 'favicon.ico'), format='ICO', sizes=[(32, 32)])
fav.save(os.path.join(OUT_DIR, 'favicon.png'), 'PNG', optimize=True)
print(f"favicon updated")

# 5. Apple touch icon
apple = icon_crop.copy()
apple.thumbnail((180, 180), Image.LANCZOS)
apple.save(os.path.join(OUT_DIR, 'apple-touch-icon.png'), 'PNG', optimize=True)
print(f"apple-touch-icon: {apple.size}")

print("\n✅ All logo versions created!")
for f in sorted(os.listdir(OUT_DIR)):
    if f.startswith('logo') or f.startswith('favicon') or f.startswith('apple'):
        path = os.path.join(OUT_DIR, f)
        size = os.path.getsize(path)
        print(f"  {f}: {size//1024}KB")
