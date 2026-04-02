"""Create professional email signature icons and optimized logo."""
from PIL import Image, ImageDraw, ImageFont
import os, math

ICONS_DIR = "/app/public/sig-icons"
os.makedirs(ICONS_DIR, exist_ok=True)

NAVY = (15, 43, 70)      # #0f2b46
GOLD = (201, 169, 97)    # #c9a961
WHITE = (255, 255, 255)

SIZE = 64  # 64px source for crisp 20-24px display

def draw_circle_icon(name, draw_fn):
    """Create a circular icon with navy background."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Circle background
    draw.ellipse([0, 0, SIZE-1, SIZE-1], fill=NAVY)
    # Draw the icon symbol
    draw_fn(draw, img)
    img.save(os.path.join(ICONS_DIR, f"{name}.png"), "PNG", optimize=True)
    print(f"Created {name}.png")

def draw_email(draw, img):
    """Envelope icon."""
    m = 16  # margin
    t = 20  # top
    b = SIZE - 20
    # Envelope body
    draw.rectangle([m, t, SIZE-m, b], outline=WHITE, width=2)
    # Envelope flap (V shape)
    draw.line([m, t, SIZE//2, (t+b)//2], fill=WHITE, width=2)
    draw.line([SIZE//2, (t+b)//2, SIZE-m, t], fill=WHITE, width=2)

def draw_phone(draw, img):
    """Phone handset icon."""
    cx, cy = SIZE//2, SIZE//2
    # Simple phone receiver shape using arcs/lines
    r = 12
    # Draw a phone receiver
    draw.arc([cx-14, cy-14, cx+14, cy+14], 210, 330, fill=WHITE, width=3)
    # Left earpiece
    draw.rounded_rectangle([cx-16, cy-6, cx-10, cy+8], radius=2, fill=WHITE)
    # Right earpiece  
    draw.rounded_rectangle([cx+10, cy-6, cx+16, cy+8], radius=2, fill=WHITE)
    # Curved handle connecting them
    draw.arc([cx-13, cy-16, cx+13, cy+6], 200, 340, fill=WHITE, width=3)

def draw_globe(draw, img):
    """Globe/website icon."""
    cx, cy = SIZE//2, SIZE//2
    r = 16
    # Outer circle
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=WHITE, width=2)
    # Vertical ellipse (meridian)
    draw.ellipse([cx-8, cy-r, cx+8, cy+r], outline=WHITE, width=2)
    # Horizontal line (equator)
    draw.line([cx-r, cy, cx+r, cy], fill=WHITE, width=2)
    # Top latitude line
    draw.arc([cx-r+2, cy-r+4, cx+r-2, cy+2], 0, 180, fill=WHITE, width=1)
    # Bottom latitude line
    draw.arc([cx-r+2, cy-2, cx+r-2, cy+r-4], 180, 360, fill=WHITE, width=1)

def draw_location(draw, img):
    """Map pin icon."""
    cx = SIZE // 2
    # Pin body (circle)
    draw.ellipse([cx-10, 14, cx+10, 34], outline=WHITE, width=2)
    # Inner dot
    draw.ellipse([cx-4, 20, cx+4, 28], fill=WHITE)
    # Pin point
    draw.polygon([cx-8, 32, cx, 48, cx+8, 32], fill=WHITE)

def draw_linkedin(draw, img):
    """LinkedIn icon."""
    m = 16
    draw.rounded_rectangle([m, m, SIZE-m, SIZE-m], radius=4, outline=WHITE, width=2)
    # "in" text - simplified
    # i dot
    draw.ellipse([m+6, m+6, m+10, m+10], fill=WHITE)
    # i body
    draw.rectangle([m+6, m+13, m+10, SIZE-m-4], fill=WHITE)
    # n shape
    draw.rectangle([m+14, m+13, m+18, SIZE-m-4], fill=WHITE)
    draw.arc([m+14, m+8, m+26, m+20], 180, 0, fill=WHITE, width=2)
    draw.rectangle([m+24, m+14, m+28, SIZE-m-4], fill=WHITE)

def draw_shield(draw, img):
    """Shield/lock icon for disclaimer."""
    cx = SIZE // 2
    # Shield shape
    points = [
        (cx, 12),
        (cx + 16, 20),
        (cx + 14, 38),
        (cx, 50),
        (cx - 14, 38),
        (cx - 16, 20),
    ]
    draw.polygon(points, outline=WHITE, fill=None)
    draw.polygon(points, outline=WHITE)
    # Draw outline thicker
    for i in range(len(points)):
        draw.line([points[i], points[(i+1) % len(points)]], fill=WHITE, width=2)
    # Lock body inside
    draw.rectangle([cx-6, 30, cx+6, 40], fill=WHITE)
    draw.arc([cx-5, 24, cx+5, 34], 180, 0, fill=WHITE, width=2)

# Create all icons
draw_circle_icon("email", draw_email)
draw_circle_icon("phone", draw_phone)
draw_circle_icon("globe", draw_globe)
draw_circle_icon("location", draw_location)
draw_circle_icon("linkedin", draw_linkedin)
draw_circle_icon("shield", draw_shield)

# Create optimized logo for email (high-res source, optimized output)
logo = Image.open("/app/public/logo-official.jpeg").convert("RGBA")
# Resize to 400px wide (displayed at ~140px = 2.8x for retina)
ratio = 400 / logo.width
logo_resized = logo.resize((400, int(logo.height * ratio)), Image.LANCZOS)
logo_resized.save(os.path.join(ICONS_DIR, "logo-email-hd.png"), "PNG", optimize=True, quality=95)
print(f"Created logo-email-hd.png: {logo_resized.size}")

# Also create a clean icon-only version
icon = Image.open("/app/public/logo-icon-512.png").convert("RGBA")
icon_resized = icon.resize((256, int(icon.height * 256 / icon.width)), Image.LANCZOS)
icon_resized.save(os.path.join(ICONS_DIR, "logo-icon-hd.png"), "PNG", optimize=True)
print(f"Created logo-icon-hd.png: {icon_resized.size}")

print("\nAll signature assets created successfully!")
