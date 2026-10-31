# Builds sfx/particle-pop.wav: a bubble "bloop" (fast rising sine) with a bright noise "pop" at the start.
# Mid/high frequencies only, driven hard with tanh so it stays loud on phone speakers.
import numpy as np, wave
rate = 44100
n = int(rate * 0.28)
t = np.arange(n) / rate
rng = np.random.default_rng(7)
f = 380 + 1500 * (1 - np.exp(-t * 38))            # rising chirp, 380 -> ~1900 Hz
phase = 2 * np.pi * np.cumsum(f) / rate
env = np.minimum(1, t / 0.004) * np.exp(-t * 16)
bloop = (np.sin(phase) + 0.35 * np.sin(2 * phase)) * env
noise = rng.standard_normal(n)
k = np.exp(-t * 330)                               # ~12 ms burst
pop = np.convolve(noise, [1, -1], mode='same') * k # high-passed
pop /= np.abs(pop).max()
sig = np.tanh(2.6 * (bloop + 0.55 * pop))
sig = sig / np.abs(sig).max() * 0.96
sig[-int(rate * 0.02):] *= np.linspace(1, 0, int(rate * 0.02))
w = wave.open('sfx/particle-pop.wav', 'wb')
w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
w.writeframes((sig * 32767).astype('<i2').tobytes()); w.close()
