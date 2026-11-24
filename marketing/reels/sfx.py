"""장독대 릴스 효과음 합성 (저작권 걱정 없는 직접 만든 소리).
python3 sfx.py OUT.wav  → 24초 44.1kHz 모노 WAV
시간은 reel.html 의 render(t) 타이밍과 맞춰요. (6~9초 새 장면 뒤로는 +3초)
"""
import sys, wave
import numpy as np

SR = 44100
DUR = 24.0
rng = np.random.default_rng(7)
out = np.zeros(int(SR * DUR))


def t_(d):
    return np.arange(int(SR * d)) / SR


def lowpass(x, k):
    k = max(1, int(k))
    return np.convolve(x, np.ones(k) / k, mode="same")


def add(at, x, gain=1.0):
    i = int(at * SR)
    j = min(len(out), i + len(x))
    if i < len(out):
        out[i:j] += x[: j - i] * gain


def env(n, attack=0.004, decay=0.1):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def thud(pitch=1.0):  # 책이 툭 떨어지는 소리
    t = t_(0.22)
    f = 95 * pitch * (1 - 0.35 * t / 0.22)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 0.07)
    click = lowpass(rng.standard_normal(len(t)), 6) * env(len(t), 0.001, 0.015)
    return body * 0.9 + click * 0.5


def glide(f0, f1, d, vib=0.0):  # 미끄러지는 음 (갸우뚱 "뾰잉?")
    t = t_(d)
    f = f0 + (f1 - f0) * (t / d) ** 1.6 + vib * np.sin(2 * np.pi * 14 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.01, d * 0.6)


def bell(f, d=1.2):  # 종소리 "띵"
    t = t_(d)
    x = (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.25)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.12))
    return x * env(len(t), 0.002, d * 0.35)


def whoosh(d=0.32):  # 휙
    t = t_(d)
    n = rng.standard_normal(len(t))
    k = np.linspace(22, 4, len(t)).astype(int)
    shaped = np.array([0.0] * len(t))
    for s in range(0, len(t), 512):  # 구간별로 점점 밝아지는 노이즈
        seg = n[s:s + 512]
        shaped[s:s + len(seg)] = lowpass(seg, k[s])
    return shaped * np.sin(np.pi * t / d) ** 2 * 0.8


def pop(f0=900, f1=280, d=0.08):  # 뽁
    return glide(f0, f1, d) * 1.2


def tap():  # 화면을 콕
    t = t_(0.06)
    return (np.sin(2 * np.pi * 1900 * t) * env(len(t), 0.001, 0.012)
            + lowpass(rng.standard_normal(len(t)), 3) * env(len(t), 0.0005, 0.004) * 0.6)


def tick(f=1500):
    t = t_(0.03)
    return np.sin(2 * np.pi * f * t) * env(len(t), 0.001, 0.008)


def rattle(d=0.7):  # 장독 덜덜
    x = np.zeros(int(SR * d))
    for s in np.arange(0, d - 0.03, 0.045):
        t = t_(0.03)
        hit = lowpass(rng.standard_normal(len(t)), 2) * env(len(t), 0.0005, 0.006)
        hit += np.sin(2 * np.pi * (2400 + rng.uniform(-300, 300)) * t) * env(len(t), 0.001, 0.01) * 0.6
        i = int(s * SR)
        x[i:i + len(hit)] += hit * rng.uniform(0.5, 1.0)
    return x


def shatter():  # 쨍그랑!
    d = 1.3
    x = np.zeros(int(SR * d))
    t = t_(d)
    crack = rng.standard_normal(len(t))
    crack = crack - lowpass(crack, 8)  # 높은 소리만
    x += crack * env(len(t), 0.001, 0.05) * 1.4
    x += np.sin(2 * np.pi * 70 * t) * env(len(t), 0.002, 0.09) * 0.9  # 쿵
    for _ in range(46):  # 파편 조각들
        at = rng.uniform(0.02, 0.9) ** 1.6
        f = rng.uniform(2600, 7200)
        tt = t_(0.12)
        g = np.sin(2 * np.pi * f * tt) * env(len(tt), 0.0005, rng.uniform(0.015, 0.05)) * rng.uniform(0.15, 0.5)
        i = int(at * SR)
        x[i:i + len(g)] += g[: len(x) - i]
    return x


def tada():  # 마무리 딩딩딩
    x = np.zeros(int(SR * 1.8))
    for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        b = bell(f, 1.3)
        i = int(k * 0.11 * SR)
        x[i:i + len(b)] += b[: len(x) - i] * (0.6 if k < 3 else 0.8)
    return x


# ── 배치 ──────────────────────────────────────────
# 1) 책이 우르르 쌓임 (0.35 + i*0.16 에 떨어지고 ~0.3초 뒤 착지)
for i in range(14):
    add(0.35 + i * 0.16 + 0.27, thud(rng.uniform(0.85, 1.2)), 0.55)
# 2) "이 책 샀었나?" 갸우뚱, 똑같은 책 정체 공개
add(3.85, glide(420, 760, 0.42, vib=18), 0.35)
add(4.9, bell(1318.5, 1.0), 0.22)
# 2-b) 사고 싶은 책이 휙휙 날아오고 장바구니 띵띵
for i in range(5):
    at = 7.4 + i * 0.24
    add(at - 0.05, whoosh(0.3), 0.32)
    add(at + 0.3, pop(700, 260, 0.07), 0.35)
    add(at + 0.12, bell(1568 + i * 90, 0.5), 0.12)
add(8.7, bell(2093, 0.9), 0.16)
# 3) 로고 등장 (u 6.8 → 9.8)
add(9.82, pop(500, 1100, 0.1), 0.35)
add(9.9, bell(1046.5, 1.2), 0.2)
# 4) 흑백 → 컬러 콕 (u 9.9,10.7,11.5,12.3 → +3)
for k, tt in enumerate([12.9, 13.7, 14.5, 15.3]):
    add(tt - 0.02, tap(), 0.5)
    add(tt + 0.02, bell(880 * (1.122 ** k), 0.7), 0.16)
# 5) 묵혀둔 권수 올라가기 (u 14.2~15.3 → 17.2~18.3)
for s in np.linspace(17.2, 18.3, 16) ** 1.0:
    add(float(s), tick(1300 + (s - 17.2) * 500), 0.25)
# 장독 덜덜 (u 15.6~16.3 → 18.6~19.3), 쨍그랑 (u 16.35 → 19.35)
add(18.6, rattle(0.72), 0.45)
add(19.33, shatter(), 0.45)
# 6) 같이 깨실 분? (u 17.3 → 20.3)
add(20.35, tada(), 0.3)

# 정리: 클리핑 방지, 끝 살짝 페이드
out = out / np.max(np.abs(out))
out = np.tanh(out * 2.6) / np.tanh(2.6)  # 작은 소리를 살리는 부드러운 압축
out = out / np.max(np.abs(out)) * 0.85
fade = int(SR * 0.6)
out[-fade:] *= np.linspace(1, 0, fade)

pcm = (out * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else "sfx.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", len(pcm) / SR, "s")
