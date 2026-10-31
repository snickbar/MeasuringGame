# Builds sfx/particle-pop.wav: a tight cork "pop" (short falling thock plus a bright click), driven with tanh so it stays loud on phone speakers.
import numpy as np, wave
R = 44100
rng = np.random.default_rng(5)
t = np.arange(int(R * .12)) / R
f = 380 + (600 - 380) * np.exp(-t * 90)
body = np.sin(2 * np.pi * np.cumsum(f) / R) * np.exp(-t * 45)
click = np.convolve(rng.standard_normal(len(t)), [1, -.85], 'same') * np.exp(-t * 300)
sig = np.tanh(2.4 * (body + .5 * click))
sig = sig / np.abs(sig).max() * .95
n = int(R * .015); sig[-n:] *= np.linspace(1, 0, n)
w = wave.open('sfx/particle-pop.wav', 'wb')
w.setnchannels(1); w.setsampwidth(2); w.setframerate(R)
w.writeframes((sig * 32767).astype('<i2').tobytes()); w.close()
