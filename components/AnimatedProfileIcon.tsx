import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';

// ─────────────────────────────────────────────
// KIDS: Animated smiling sun with spinning rays
// ─────────────────────────────────────────────
function KidsSunAnimation() {
  const rayRotation = useSharedValue(0);
  const blinkScale = useSharedValue(1);
  const mouthWobble = useSharedValue(0);
  const bodyScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Continuous ray spin
    rayRotation.value = withRepeat(
      withTiming(360, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );
    // Blink every 3 seconds
    blinkScale.value = withRepeat(
      withSequence(
        withDelay(2500, withTiming(0.05, { duration: 80 })),
        withTiming(1, { duration: 80 }),
      ),
      -1,
      false
    );
    // Mouth wobble (smile to grin)
    mouthWobble.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.sin) }),
        withTiming(0, { duration: 600, easing: Easing.in(Easing.sin) }),
      ),
      -1,
      false
    );
    // Subtle body pulse
    bodyScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false
    );
    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(rayRotation);
      cancelAnimation(blinkScale);
      cancelAnimation(mouthWobble);
      cancelAnimation(bodyScale);
      cancelAnimation(glowOpacity);
    };
  }, []);

  const rayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rayRotation.value}deg` }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bodyScale.value }],
  }));
  const leftEyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blinkScale.value }],
  }));
  const rightEyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blinkScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  const shortRays = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

  return (
    <View style={styles.iconContainer}>
      {/* Glow halo */}
      <Animated.View style={[styles.kidsGlow, glowStyle]} />

      {/* Spinning rays container */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.centered, rayStyle]}>
        {rays.map((angle, i) => (
          <View
            key={`ray-${i}`}
            style={[
              styles.kidsRay,
              {
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: -28 },
                ],
              },
            ]}
          />
        ))}
        {shortRays.map((angle, i) => (
          <View
            key={`sray-${i}`}
            style={[
              styles.kidsRayShort,
              {
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: -22 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Sun body */}
      <Animated.View style={[styles.kidsSunBody, bodyStyle]}>
        {/* Eyes */}
        <View style={styles.kidsEyeRow}>
          <Animated.View style={[styles.kidsEye, leftEyeStyle]} />
          <Animated.View style={[styles.kidsEye, rightEyeStyle]} />
        </View>
        {/* Mouth - simple arc via border radius */}
        <View style={styles.kidsMouth} />
        {/* Cheeks */}
        <View style={[styles.kidsCheeek, { left: 5 }]} />
        <View style={[styles.kidsCheeek, { right: 5 }]} />
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────
// TEENS: Neon gamepad with pulsing button lights
// ─────────────────────────────────────────────
function TeensGamepadAnimation() {
  const glow = useSharedValue(0);
  const btnA = useSharedValue(0);
  const btnB = useSharedValue(0);
  const btnX = useSharedValue(0);
  const btnY = useSharedValue(0);
  const shake = useSharedValue(0);
  const scanline = useSharedValue(-20);

  useEffect(() => {
    // Neon glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 700 }),
      ),
      -1, false
    );
    // Staggered button presses
    const fireBtn = (btn: Animated.SharedValue<number>, delay: number) => {
      btn.value = withRepeat(
        withDelay(delay, withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 200 }),
          withDelay(800, withTiming(0, { duration: 10 })),
        )),
        -1, false
      );
    };
    fireBtn(btnA, 0);
    fireBtn(btnB, 300);
    fireBtn(btnX, 600);
    fireBtn(btnY, 900);

    // Subtle shake on button press
    shake.value = withRepeat(
      withSequence(
        withDelay(100, withTiming(1, { duration: 60 })),
        withTiming(-1, { duration: 60 }),
        withTiming(0, { duration: 60 }),
        withDelay(1100, withTiming(0, { duration: 10 })),
      ),
      -1, false
    );

    // Scanline sweep
    scanline.value = withRepeat(
      withSequence(
        withTiming(60, { duration: 1500, easing: Easing.linear }),
        withTiming(-20, { duration: 0 }),
      ),
      -1, false
    );

    return () => {
      cancelAnimation(glow);
      cancelAnimation(btnA);
      cancelAnimation(btnB);
      cancelAnimation(btnX);
      cancelAnimation(btnY);
      cancelAnimation(shake);
      cancelAnimation(scanline);
    };
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value * 1.5 }],
  }));
  const btnStyleFor = (btn: Animated.SharedValue<number>, color: string) =>
    useAnimatedStyle(() => ({
      backgroundColor: color,
      opacity: interpolate(btn.value, [0, 1], [0.45, 1]),
      transform: [{ scale: interpolate(btn.value, [0, 1], [1, 1.25]) }],
      shadowOpacity: interpolate(btn.value, [0, 1], [0, 0.9]),
    }));

  const btnAStyle = btnStyleFor(btnA, '#FF4A5A');
  const btnBStyle = btnStyleFor(btnB, '#FFD700');
  const btnXStyle = btnStyleFor(btnX, '#7C3AED');
  const btnYStyle = btnStyleFor(btnY, '#22D3EE');
  const scanlineStyle = useAnimatedStyle(() => ({
    top: scanline.value,
    opacity: 0.08,
  }));

  return (
    <View style={styles.iconContainer}>
      {/* Neon glow halo */}
      <Animated.View style={[styles.teensGlow, glowStyle]} />

      <Animated.View style={[styles.teensGamepad, shakeStyle]}>
        {/* Scanline effect */}
        <Animated.View style={[styles.teensScanline, scanlineStyle]} />

        {/* D-Pad left */}
        <View style={styles.teensDpad}>
          <View style={styles.teensDpadH} />
          <View style={styles.teensDpadV} />
        </View>

        {/* Center orb */}
        <View style={styles.teensCenterOrb} />

        {/* ABXY buttons */}
        <View style={styles.teensBtnGroup}>
          <View style={styles.teensBtnRow}>
            <Animated.View style={[styles.teensBtn, btnYStyle, { shadowColor: '#22D3EE' }]} />
          </View>
          <View style={styles.teensBtnMidRow}>
            <Animated.View style={[styles.teensBtn, btnXStyle, { shadowColor: '#7C3AED' }]} />
            <Animated.View style={[styles.teensBtn, btnBStyle, { shadowColor: '#FFD700' }]} />
          </View>
          <View style={styles.teensBtnRow}>
            <Animated.View style={[styles.teensBtn, btnAStyle, { shadowColor: '#FF4A5A' }]} />
          </View>
        </View>

        {/* Grips */}
        <View style={[styles.teensGrip, { left: 2 }]} />
        <View style={[styles.teensGrip, { right: 2 }]} />
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────
// ADULTS: Brain with pulsing neural sparks
// ─────────────────────────────────────────────
function AdultsBrainAnimation() {
  const pulseScale = useSharedValue(1);
  const spark1 = useSharedValue(0);
  const spark2 = useSharedValue(0);
  const spark3 = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const wave = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900 }),
      ),
      -1, false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 900 }),
        withTiming(0.2, { duration: 900 }),
      ),
      -1, false
    );
    const fireSpark = (s: Animated.SharedValue<number>, delay: number) => {
      s.value = withRepeat(
        withDelay(delay, withSequence(
          withTiming(1, { duration: 200, easing: Easing.out(Easing.exp) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.exp) }),
          withDelay(600, withTiming(0, { duration: 10 })),
        )),
        -1, false
      );
    };
    fireSpark(spark1, 0);
    fireSpark(spark2, 400);
    fireSpark(spark3, 800);

    wave.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1, false
    );

    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(spark1);
      cancelAnimation(spark2);
      cancelAnimation(spark3);
      cancelAnimation(glowOpacity);
      cancelAnimation(wave);
    };
  }, []);

  const brainStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const spark1Style = useAnimatedStyle(() => ({
    opacity: spark1.value,
    transform: [{ scale: interpolate(spark1.value, [0, 1], [0.3, 1.4]) }],
  }));
  const spark2Style = useAnimatedStyle(() => ({
    opacity: spark2.value,
    transform: [{ scale: interpolate(spark2.value, [0, 1], [0.3, 1.2]) }],
  }));
  const spark3Style = useAnimatedStyle(() => ({
    opacity: spark3.value,
    transform: [{ scale: interpolate(spark3.value, [0, 1], [0.3, 1.3]) }],
  }));
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(wave.value, [0, 1], [0.6, 1.8]) }],
    opacity: interpolate(wave.value, [0, 0.5, 1], [0.5, 0.2, 0]),
  }));

  return (
    <View style={styles.iconContainer}>
      {/* Expanding wave ring */}
      <Animated.View style={[styles.adultsWaveRing, waveStyle]} />
      {/* Glow */}
      <Animated.View style={[styles.adultsGlow, glowStyle]} />

      <Animated.View style={[styles.centered, brainStyle]}>
        {/* Brain silhouette using rounded views */}
        <View style={styles.adultsBrain}>
          {/* Left hemisphere */}
          <View style={styles.adultsBrainLeft}>
            <View style={styles.adultsFold1} />
            <View style={styles.adultsFold2} />
          </View>
          {/* Right hemisphere */}
          <View style={styles.adultsBrainRight}>
            <View style={styles.adultsFold3} />
            <View style={styles.adultsFold4} />
          </View>
          {/* Center groove */}
          <View style={styles.adultsBrainGroove} />
        </View>
      </Animated.View>

      {/* Neural sparks */}
      <Animated.View style={[styles.adultsSpark, { top: 8, left: 14 }, spark1Style]} />
      <Animated.View style={[styles.adultsSpark, { top: 18, right: 12 }, spark2Style]} />
      <Animated.View style={[styles.adultsSpark, { bottom: 14, left: 20 }, spark3Style]} />
    </View>
  );
}

// ─────────────────────────────────────────────
// SENIORS: Floating book with sparkle twinkles
// ─────────────────────────────────────────────
function SeniorsBookAnimation() {
  const float = useSharedValue(0);
  const pageWave = useSharedValue(0);
  const star1 = useSharedValue(0);
  const star2 = useSharedValue(0);
  const star3 = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Gentle float
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false
    );
    // Page flutter
    pageWave.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }),
        withDelay(1200, withTiming(0, { duration: 10 })),
      ),
      -1, false
    );
    // Twinkling stars
    const twinkle = (s: Animated.SharedValue<number>, delay: number) => {
      s.value = withRepeat(
        withDelay(delay, withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.2, { duration: 300 }),
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 }),
          withDelay(800, withTiming(0, { duration: 10 })),
        )),
        -1, false
      );
    };
    twinkle(star1, 0);
    twinkle(star2, 500);
    twinkle(star3, 1000);

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1400 }),
        withTiming(0.2, { duration: 1400 }),
      ),
      -1, false
    );

    return () => {
      cancelAnimation(float);
      cancelAnimation(pageWave);
      cancelAnimation(star1);
      cancelAnimation(star2);
      cancelAnimation(star3);
      cancelAnimation(glowOpacity);
    };
  }, []);

  const bookStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -6]) }],
  }));
  const pageStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(pageWave.value, [0, 1], [1, 0.3]) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const star1Style = useAnimatedStyle(() => ({ opacity: star1.value, transform: [{ scale: interpolate(star1.value, [0, 1], [0.5, 1.2]) }] }));
  const star2Style = useAnimatedStyle(() => ({ opacity: star2.value, transform: [{ scale: interpolate(star2.value, [0, 1], [0.5, 1]) }] }));
  const star3Style = useAnimatedStyle(() => ({ opacity: star3.value, transform: [{ scale: interpolate(star3.value, [0, 1], [0.5, 1.1]) }] }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.seniorsGlow, glowStyle]} />

      {/* Sparkle stars */}
      <Animated.View style={[styles.seniorsStar, { top: 4, right: 10 }, star1Style]}>
        <View style={styles.seniorStarH} />
        <View style={styles.seniorStarV} />
      </Animated.View>
      <Animated.View style={[styles.seniorsStar, { top: 14, left: 6 }, star2Style]}>
        <View style={styles.seniorStarH} />
        <View style={styles.seniorStarV} />
      </Animated.View>
      <Animated.View style={[styles.seniorsStar, { bottom: 8, right: 8 }, star3Style]}>
        <View style={styles.seniorStarH} />
        <View style={styles.seniorStarV} />
      </Animated.View>

      <Animated.View style={[styles.seniorsBook, bookStyle]}>
        {/* Book cover */}
        <View style={styles.seniorsBookCover}>
          {/* Spine */}
          <View style={styles.seniorsSpine} />
          {/* Pages */}
          <View style={styles.seniorsPages}>
            <View style={styles.seniorsPageLine} />
            <View style={styles.seniorsPageLine} />
            <View style={styles.seniorsPageLine} />
            <Animated.View style={[styles.seniorsPageLine, { width: '60%' }, pageStyle]} />
          </View>
        </View>
        {/* Book shadow */}
        <View style={styles.seniorsBookShadow} />
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
interface Props {
  profile: string;
  size?: number;
}

export default function AnimatedProfileIcon({ profile, size = 90 }: Props) {
  const renderAnimation = () => {
    switch (profile) {
      case 'kids':    return <KidsSunAnimation />;
      case 'teens':   return <TeensGamepadAnimation />;
      case 'adults':  return <AdultsBrainAnimation />;
      case 'seniors': return <SeniorsBookAnimation />;
      default:        return <AdultsBrainAnimation />;
    }
  };

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {renderAnimation()}
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── KIDS ──
  kidsGlow: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFD700',
  },
  kidsSunBody: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9F43',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  kidsEyeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
    marginTop: 1,
  },
  kidsEye: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3D1A00',
  },
  kidsMouth: {
    width: 12,
    height: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 2,
    borderColor: '#3D1A00',
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  kidsCheeek: {
    position: 'absolute',
    bottom: 7,
    width: 7,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#FF6B9D',
    opacity: 0.7,
  },
  kidsRay: {
    position: 'absolute',
    width: 4,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFE066',
  },
  kidsRayShort: {
    position: 'absolute',
    width: 3,
    height: 7,
    borderRadius: 2,
    backgroundColor: '#FFD700',
    opacity: 0.7,
  },

  // ── TEENS ──
  teensGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7C3AED',
  },
  teensGamepad: {
    width: 58,
    height: 38,
    backgroundColor: '#1A0533',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  teensScanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#22D3EE',
    zIndex: 10,
  },
  teensDpad: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teensDpadH: {
    position: 'absolute',
    width: 20,
    height: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  teensDpadV: {
    position: 'absolute',
    width: 6,
    height: 20,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  teensCenterOrb: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22D3EE',
    shadowColor: '#22D3EE',
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  teensBtnGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  teensBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  teensBtnMidRow: {
    flexDirection: 'row',
    gap: 4,
  },
  teensBtn: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    elevation: 3,
  },
  teensGrip: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1A0533',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },

  // ── ADULTS ──
  adultsGlow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0D9488',
  },
  adultsWaveRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#0D9488',
  },
  adultsBrain: {
    width: 44,
    height: 36,
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-start',
  },
  adultsBrainLeft: {
    flex: 1,
    height: 34,
    backgroundColor: '#0D9488',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
    shadowColor: '#0D9488',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  adultsBrainRight: {
    flex: 1,
    height: 34,
    backgroundColor: '#14B8A6',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
  },
  adultsFold1: {
    position: 'absolute',
    top: 8,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
  },
  adultsFold2: {
    position: 'absolute',
    top: 16,
    left: 4,
    right: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  adultsFold3: {
    position: 'absolute',
    top: 8,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  adultsFold4: {
    position: 'absolute',
    top: 16,
    left: 1,
    right: 4,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
  },
  adultsBrainGroove: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
  },
  adultsSpark: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A7F3D0',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },

  // ── SENIORS ──
  seniorsGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E40AF',
  },
  seniorsBook: {
    alignItems: 'center',
  },
  seniorsBookCover: {
    width: 44,
    height: 36,
    backgroundColor: '#1E40AF',
    borderRadius: 4,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  seniorsSpine: {
    width: 8,
    backgroundColor: '#1534A0',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  seniorsPages: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    padding: 5,
    gap: 3,
    justifyContent: 'center',
  },
  seniorsPageLine: {
    height: 2.5,
    backgroundColor: '#BFDBFE',
    borderRadius: 1,
    width: '90%',
  },
  seniorsBookShadow: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(30, 64, 175, 0.25)',
    borderRadius: 4,
    marginTop: 2,
  },
  seniorsStar: {
    position: 'absolute',
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seniorStarH: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#FFD700',
    borderRadius: 1,
  },
  seniorStarV: {
    position: 'absolute',
    width: 2,
    height: 10,
    backgroundColor: '#FFD700',
    borderRadius: 1,
  },
});
