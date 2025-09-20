// ShaderToy: Hero Glitch Title
// SDF/MSDF text with gradient, per-glyph glitch (jitter/skew/rot/scale),
// RGB fringes, horizontal slices, soft shadow, edge refraction, and scanlines.
//
// Channels
//  iChannel0 (required): Font atlas SDF (R) or MSDF (RGB). Grid or packed.
//                        Filter: linear, Wrap: clamp. VFlip: match atlas-map orientation (see iChannel3).
//  iChannel1 (required): 1xN text buffer. R in [0..1] = code/255. Width=N (glyph count), Height=1.
//  iChannel2 (optional): 1xN accent map. R in [0..1] mapped to ids {1..4}. If missing, uses A1..A4 ranges.
//  iChannel3 (optional): Atlas-map. Per-glyph UVs (u0,v0,u1,v1) in RGBA.
//                        A: 1x256 indexed by ASCII code (preferred). B: 1xN indexed by glyph position.
//                        When present, overrides grid. Generate UVs in GL convention (v grows upward).
//
// Quick setup
//  - SDF vs MSDF: set USE_MSDF (0=SDF, 1=MSDF) to match iChannel0.
//  - iChannel0 VFlip: OFF if atlas-map is in GL UVs; if text appears flipped, enable VFlip.
//  - Filter/Wrap: linear+clamp on iChannel0. 1xN textures (iCh1..3) use clamp; VFlip irrelevant.
//  - Layout: monospaced via CELL_W/CELL_H/GLYPH_SCALE. For proportional spacing use advances from JSON (not included here).
//
// Quality flags (see section below): ENABLE_* toggles slices, fringes, shadow, refraction, scanlines.
//  SHADOW_TAPS (0/4/6), SHADOW_CHEAP (uses rim), FAST_REFRACT (dFdx/dFdy, no extra samples).
//
// Notes
//  - Grid fallback: if iChannel3 is missing, uses ATLAS_COLS/ROWS and (code-32) tile index.
//  - Accents: if iChannel2 is missing, uses A1..A4 ranges below (adjust for your text).
//  - Helper scripts (in repo):
//      shadertoy/make-text-buffer.mjs  → generates 1xN with codes (R=code/255)
//      shadertoy/make-atlas-map.mjs    → generates 1x256/1xN UVs from atlas JSON
//  - Performance: shadow multi-tap, refraction and fringes add cost; use flags for medium/low presets.

#define USE_MSDF 0        // 0=SDF (R), 1=MSDF (RGB)
#define ATLAS_COLS 16.0   // columns in the font atlas grid
#define ATLAS_ROWS 6.0    // rows in the font atlas grid (enough for ASCII 32..126 -> 95 glyphs)
#define FIRST_CODE 32.0   // ASCII space
#define LAST_CODE 126.0

// Text layout
#define CELL_H 192.0      // glyph cell height in pixels (screen space) – 3x larger
#define CELL_W 108.0      // glyph cell width in pixels (screen space, mono) – 3x larger
#define GLYPH_SCALE 0.95  // scale inside the cell to leave margins
#define BASELINE 0.55     // baseline position (0..1 of screen height)

// Glitch config (approx. of site behavior)
#define GLITCH_RATE 0.75  // global rate for bursts (faster)
#define GLITCH_MIN 0.9    // min seconds between glyph bursts
#define GLITCH_MAX 3.2    // max seconds between glyph bursts
#define JITTER_MAX 12.0   // px jitter amplitude
#define ROT_MAX   2.6     // degrees
#define SKEW_MAX  4.0     // degrees
#define SCALE_MAX 0.28    // extra scale

// Flash highlight
#define FLASH_DUR 0.18    // seconds (longer)

// Chromatic aberration (very subtle)
#define CHROMA 0.35       // px offset per channel (legacy subtle)
#define CHROMA_IDLE 1.2   // px fringe at rest (stronger)
#define CHROMA_BURST 8.0  // px fringe during glitch burst (stronger)

// Shadow/glow config
#define SHADOW_IDLE 3.0   // px radius at rest (stronger)
#define SHADOW_BURST 9.0  // px radius during burst (stronger)
#define SHADOW_STRENGTH 0.60

// Refraction amount in screen UV units
#define REFRACT_IDLE 0.003
#define REFRACT_BURST 0.012

// Background noise/scanlines
#define NOISE_AMT 0.02   // noise intensity
#define SCAN_AMT  0.06   // scanline intensity
#define SCAN_SPEED 0.8   // vertical scanline speed

// Feature toggles / quality flags
#define ENABLE_SCANLINES 1
#define ENABLE_SLICES    1
#define ENABLE_FRINGE    1
#define ENABLE_SHADOW    1
#define SHADOW_TAPS      6   // 0, 4, 6
#define SHADOW_CHEAP     0   // 1 = uses rim as cheap shadow
#define ENABLE_REFRACTION 1
#define FAST_REFRACT      0   // 1 = use dFdx/dFdy(a) (0 extra samples)

// Accent ranges (fallback if iChannel2 absent). Indices inclusive.
// Tune these to match your words spans.
const int A1_START = 0;    const int A1_END = 8;   // "Shadertoy" (9 letters)
const int A2_START = 9;    const int A2_END = 8;   // empty range
const int A4_START = 9;    const int A4_END = 8;   // empty range
const int A3_START = 9;    const int A3_END = 8;   // empty range

// Palettes for accents (approximate; tweak to match site)
vec3 pal1_a = vec3(0.88, 0.35, 1.00); // accent 1 start (magenta-purple)
vec3 pal1_b = vec3(0.45, 0.80, 1.00); // accent 1 end   (cyan)
vec3 pal2_a = vec3(1.00, 0.70, 0.35); // accent 2 start (warm)
vec3 pal2_b = vec3(1.00, 0.40, 0.75); // accent 2 end   (pink)
vec3 pal3_a = vec3(0.55, 0.95, 0.60); // accent 3 start (green)
vec3 pal3_b = vec3(0.35, 0.75, 1.00); // accent 3 end   (blue)
vec3 pal4_a = vec3(1.00, 0.45, 0.45); // accent 4 start (red)
vec3 pal4_b = vec3(1.00, 0.85, 0.45); // accent 4 end   (amber)

// Background gradient (subtle) to mimic site feel
vec3 bgLeft0 = vec3(0.06, 0.14, 0.19);
vec3 bgLeft1 = vec3(0.04, 0.10, 0.14);
vec3 bgRight0 = vec3(0.16, 0.06, 0.22);
vec3 bgRight1 = vec3(0.06, 0.07, 0.09);

// Hash helpers
float hash11(float p){ return fract(sin(p*127.1)*43758.5453); }
vec2  hash21(float p){ float a = hash11(p); return vec2(a, hash11(a+13.1)); }

// Accent id from glyph index or iChannel2
int getAccentId(int gid, int N){
    // Try iChannel2 if width matches
    if(iChannelResolution[2].x > 0.5 && int(iChannelResolution[2].x+0.5) == N){
        float u = (float(gid)+0.5)/float(N);
        float acc = texture(iChannel2, vec2(u, 0.5)).r; // 0..1
        int id = int(floor(acc*4.0+0.5));
        return clamp(id, 1, 4);
    }
    // Fallback: ranges
    if(gid>=A1_START && gid<=A1_END) return 1;
    if(gid>=A2_START && gid<=A2_END) return 2;
    if(gid>=A3_START && gid<=A3_END) return 3;
    if(gid>=A4_START && gid<=A4_END) return 4;
    return 1;
}

// Gradient color based on accent and vertical position inside glyph (t)
vec3 accentColor(int accent, float t){
    t = clamp(t,0.0,1.0);
    if(accent==1) return mix(pal1_a, pal1_b, t);
    if(accent==2) return mix(pal2_a, pal2_b, t);
    if(accent==3) return mix(pal3_a, pal3_b, t);
    return mix(pal4_a, pal4_b, t);
}

// Sample SDF/MSDF alpha and return signed distance proxy via out param
float sampleAlphaSD(vec2 uv, out float sd){
#if USE_MSDF
    vec3 s = texture(iChannel0, uv).rgb;
    sd = (max(min(s.r, s.g), min(max(s.r, s.g), s.b)) - 0.5); // median approach
    float w = fwidth(sd) * 1.25; // spread
    return clamp(sd / w + 0.5, 0.0, 1.0);
#else
    sd = texture(iChannel0, uv).r - 0.5; // SDF assumed centered at 0.5
    float w = fwidth(sd) * 0.9;
    return clamp(sd / w + 0.5, 0.0, 1.0);
#endif
}

float sampleAlpha(vec2 uv){ float sd; return sampleAlphaSD(uv, sd); }

// Fetch rect (u0,v0,u1,v1) from iChannel3 if available, else compute grid rect for code
vec4 atlasRectFor(int gid, int N, float code){
    // If a 1x256 code-indexed map is provided, prefer it
    if(iChannelResolution[3].x > 200.0){
        float u = (floor(code)+0.5)/256.0;
        return texture(iChannel3, vec2(u, 0.5));
    }
    // Else, support a 1xN gid-indexed map matching the text length
    if(iChannelResolution[3].x > 0.5 && int(iChannelResolution[3].x+0.5) == N){
        float u = (float(gid)+0.5)/float(N);
        return texture(iChannel3, vec2(u, 0.5));
    }
    // Grid fallback from code
    float idx = clamp(code - FIRST_CODE, 0.0, (ATLAS_COLS*ATLAS_ROWS)-1.0);
    float cx = mod(idx, ATLAS_COLS);
    float cy = floor(idx / ATLAS_COLS);
    vec2 tileCenter = (vec2(cx, cy) + 0.5) / vec2(ATLAS_COLS, ATLAS_ROWS);
    vec2 tileHalf = (0.92/vec2(ATLAS_COLS, ATLAS_ROWS))*0.5; // margin
    vec2 uv0 = tileCenter - tileHalf;
    vec2 uv1 = tileCenter + tileHalf;
    return vec4(uv0, uv1);
}

// Compute per-glyph glitch transform
void glyphGlitch(int gid, in float time, inout vec2 p, out float flash, out float kOut){
    vec2 h = hash21(float(gid)*13.17);
    float rate = GLITCH_RATE * mix(0.8, 1.4, h.x);
    float phase = time*rate + h.y*10.0;
    float cyc = fract(phase);
    // Burst windows pseudo-random between GLITCH_MIN..MAX
    float sched = smoothstep(0.98, 1.0, cyc);
    // Create a longer rest by gating with sine wobble
    float gate = step(0.85, fract(phase*mix(1.0, 1.7, h.x)));
    float k = sched * gate; // 0..1 during burst

    // Jitter / skew / rotate / scale
    float jitter = (hash11(float(gid)*1.7+time*3.3)-0.5) * 2.0 * JITTER_MAX;
    float jitterY= (hash11(float(gid)*2.3+time*2.1)-0.5) * 2.0 * (JITTER_MAX*0.6);
    float rot = radians((hash11(float(gid)*5.7)-0.5)*2.0*ROT_MAX);
    float sk  = radians((hash11(float(gid)*7.9)-0.5)*2.0*SKEW_MAX);
    float sc  = 1.0 + (hash11(float(gid)*11.3))*SCALE_MAX;

    // Ease burst
    float ease = 1.0 - pow(1.0 - k, 2.0);

    // Apply transforms around glyph center
    // skew in X by Y component
    p.x += tan(sk) * p.y * ease;
    mat2 R = mat2(cos(rot*ease), -sin(rot*ease), sin(rot*ease), cos(rot*ease));
    p = R * (p * mix(1.0, sc, ease));
    p += vec2(jitter, jitterY) * ease / CELL_H; // normalize by height to keep consistent

    // Flash window
    flash = step(1.0 - FLASH_DUR*rate, cyc) * k;
    kOut = k;
}

// Compose background
vec3 background(vec2 uv){
    // uv in [0,1]
    float edge = smoothstep(0.45, 0.55, uv.x);
    vec3 leftCol  = mix(bgLeft0,  bgLeft1,  smoothstep(0.0,1.0,uv.y));
    vec3 rightCol = mix(bgRight0, bgRight1, smoothstep(0.0,1.0,uv.y));
    return mix(leftCol, rightCol, edge);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 R = iResolution.xy;
    vec2 uvScreen = fragCoord / R;

    // Background
    vec3 col = background(uvScreen);
    // TV static (subtle noise) + scanlines
    float t = iTime;
    float sx = floor(fragCoord.x);
    float sy = floor(fragCoord.y);
    float noiseV = hash11(sx + sy*8192.0 + floor(t*60.0)*13.0) - 0.5;
    col += noiseV * NOISE_AMT;
    #if ENABLE_SCANLINES
    float stripe = 0.5 + 0.5*sin((uvScreen.y * iResolution.y)*6.28318*0.5 + t*6.28318*SCAN_SPEED);
    col *= 1.0 + SCAN_AMT * (stripe - 0.5);
    #endif

    // Obtain text length from iChannel1 width
    int N = int(iChannelResolution[1].x + 0.5);
    if(N <= 0){ fragColor = vec4(col,1.0); return; }

    // Layout: center horizontally
    float textW = float(N) * CELL_W;
    float originX = 0.5*R.x - 0.5*textW;
    float originY = BASELINE * R.y; // baseline

    // Determine glyph index for this pixel
    float xRel = fragCoord.x - originX;
    int gid = int(floor(xRel / CELL_W));
    if(gid < 0 || gid >= N){ fragColor = vec4(col,1.0); return; }

    // Local coords inside the glyph cell: [-0.5..0.5] in X and Y (scaled by GLYPH_SCALE)
    float xIn = (xRel - float(gid)*CELL_W) / CELL_W;       // 0..1
    float yIn = (fragCoord.y - originY) / CELL_H + 0.5;    // map baseline to ~0.5
    vec2 p = (vec2(xIn, yIn) - 0.5) * 2.0;                 // -1..1
    p *= GLYPH_SCALE * 0.5;                                // shrink to fit SDF area ~ [-0.5..0.5]

    // Read char code from iChannel1 (R channel [0..1] -> 0..255)
    float u = (float(gid) + 0.5) / float(N);
    float code = floor(texture(iChannel1, vec2(u, 0.5)).r * 255.0 + 0.5);
    if(code < FIRST_CODE || code > LAST_CODE){ fragColor = vec4(col,1.0); return; }

    // Glitch transform
    float flash, burst;
    glyphGlitch(gid, iTime, p, flash, burst);

    // Atlas UV (packed-aware)
    vec2 local01 = p*0.95 + 0.5; // -1..1 -> 0..1
    // Band slicing (horizontal) during burst to mimic CSS glitch fractures
    #if ENABLE_SLICES
    if(burst > 0.0){
    float bands = 6.0; // 5-7 bands
        float idy = floor(clamp(local01.y,0.0,0.999) * bands);
        float bseed = float(gid)*31.0 + idy*7.0 + floor(iTime*30.0);
    float jitter = (hash11(bseed) - 0.5) * 2.0; // -1..1
    float ampPx = mix(0.0, 10.0, clamp(burst,0.0,1.0)); // up to 10px
        local01.x += (ampPx / CELL_W) * jitter;
    }
    #endif
    // Orientation is controlled by atlas-map (iChannel3); no extra flips here
    vec4 rect = atlasRectFor(gid, N, code); // (u0,v0,u1,v1)
    vec2 atuv = mix(rect.xy, rect.zw, clamp(local01, 0.0, 1.0));

    // Sample alpha + sd (for refraction/rim)
    float sd; float a = sampleAlphaSD(atuv, sd);
    if(a <= 0.001){ fragColor = vec4(col,1.0); return; }

    // Accent color (vertical gradient uses yIn)
    int accent = getAccentId(gid, N);
    vec3 txt = accentColor(accent, clamp(yIn, 0.0, 1.0));

    // Chromatic fringes: stronger during burst, oriented by per-glyph dir
    #if ENABLE_SHADOW
    #if SHADOW_CHEAP
    // cheap shadow based on rim
    vec3 shadowCol = vec3(0.05,0.07,0.10);
    col = mix(col, shadowCol, clamp(rim * SHADOW_STRENGTH, 0.0, 1.0));
    #else
    #if SHADOW_TAPS>0
    float shadowPx = mix(SHADOW_IDLE, SHADOW_BURST, clamp(burst, 0.0, 1.0));
    vec2 s01 = vec2(shadowPx / CELL_W, shadowPx / CELL_H);
    vec2 ring[6];
    ring[0] = vec2( 1.0,  0.0);
    ring[1] = vec2(-1.0,  0.0);
    ring[2] = vec2( 0.0,  1.0);
    ring[3] = vec2( 0.0, -1.0);
    ring[4] = normalize(vec2( 0.8,  0.6));
    ring[5] = normalize(vec2(-0.7,  0.8));
    float aShadow = 0.0;
    for(int i=0;i<SHADOW_TAPS;i++){
        vec2 l01 = clamp(local01 + ring[i]*s01, 0.0, 1.0);
        vec2 uvS = mix(rect.xy, rect.zw, l01);
        aShadow = max(aShadow, sampleAlpha(uvS));
    }
    vec3 shadowCol = vec3(0.05,0.07,0.10);
    col = mix(col, shadowCol, aShadow * SHADOW_STRENGTH);
    #endif
    #endif
    #endif

    #if ENABLE_FRINGE
    float angle = hash11(float(gid)*19.31 + floor(iTime*2.0))*6.28318; // changes discretely
    vec2 dir = normalize(vec2(cos(angle), sin(angle)*0.35)); // favor X
    float fringePx = mix(CHROMA_IDLE, CHROMA_BURST, clamp(burst,0.0,1.0));
    vec2 f01 = dir * vec2(fringePx / CELL_W, fringePx / CELL_H);
    vec2 uvR = mix(rect.xy, rect.zw, clamp(local01 + f01, 0.0, 1.0));
    vec2 uvB = mix(rect.xy, rect.zw, clamp(local01 - f01, 0.0, 1.0));
    float aR = sampleAlpha(uvR);
    float aG = a;
    float aB = sampleAlpha(uvB);
    vec3 glyphCol = txt * vec3(aR, aG, aB);
    #else
    vec3 glyphCol = txt * vec3(a);
    #endif

    // Refraction under the glyph edge to mimic CSS filter refraction
    // Approximate normal via sd gradient in atlas space
    vec2 dUV = vec2(1.0)/vec2(iResolution.xy); // small step in screen terms
    // Use small steps in local atlas rect space
    vec2 dA = vec2(1.0/1024.0, 1.0/1024.0);
    float sdX1, sdX2, sdY1, sdY2;
    sampleAlphaSD(mix(rect.xy, rect.zw, clamp(local01 + vec2(dA.x,0.0),0.0,1.0)), sdX1);
    sampleAlphaSD(mix(rect.xy, rect.zw, clamp(local01 - vec2(dA.x,0.0),0.0,1.0)), sdX2);
    sampleAlphaSD(mix(rect.xy, rect.zw, clamp(local01 + vec2(0.0,dA.y),0.0,1.0)), sdY1);
    sampleAlphaSD(mix(rect.xy, rect.zw, clamp(local01 - vec2(0.0,dA.y),0.0,1.0)), sdY2);
    #if ENABLE_REFRACTION
    #if FAST_REFRACT
    vec2 n = normalize(vec2(dFdx(a), dFdy(a)) + 1e-5);
    #else
    vec2 n = normalize(vec2(sdX1 - sdX2, sdY1 - sdY2) + 1e-5);
    #endif
    float refrAmt = mix(REFRACT_IDLE, REFRACT_BURST, clamp(burst,0.0,1.0));
    float rim = clamp(exp(-abs(sd)*18.0), 0.0, 1.0); // slightly wider edge
    vec3 colRefr = background(uvScreen + n * refrAmt);
    col = mix(col, colRefr, rim * 0.65);
    #endif

    // Flash brighten + rim highlight
    glyphCol = mix(glyphCol, vec3(1.0), clamp(flash*0.85, 0.0, 1.0));
    glyphCol += rim * 0.26 * vec3(1.0);

    // Composite
    col = mix(col, glyphCol, a);

    fragColor = vec4(col, 1.0);
}
