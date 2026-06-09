import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "./store";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

const audioCtx = new (
  window.AudioContext || (window as any).webkitAudioContext
)();

export const playJumpscareSound = () => {
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const osc3 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "square";
    osc3.type = "sawtooth";

    osc1.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(
      1200,
      audioCtx.currentTime + 0.1,
    );

    osc2.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(
      1400,
      audioCtx.currentTime + 0.1,
    );

    osc3.frequency.setValueAtTime(50, audioCtx.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(
      300,
      audioCtx.currentTime + 0.2,
    );

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(1.0, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);

    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc3.start();
    osc1.stop(audioCtx.currentTime + 2.0);
    osc2.stop(audioCtx.currentTime + 2.0);
    osc3.stop(audioCtx.currentTime + 2.0);
  } catch (e) {}
};

export const startAmbientDrone = () => {
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.value = 45;

    gain.gain.value = 0.3;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();

    return () => {
      gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
      setTimeout(() => {
        osc.stop();
      }, 1000);
    };
  } catch (e) {
    return () => {};
  }
};

const playQuietSound = () => {
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 5);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 5);
  } catch (e) {
    console.error("Audio play failed");
  }
};

const playBirdSpawnSound = () => {
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 2);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2);
  } catch (e) {}
};

const playBirdLeaveSound = () => {
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) {}
};

// Holds game timer logic without rendering anything
function GameLogic() {
  const logicState = useRef({
    spawnTimer: Math.random() * 6 + 4, // initial spawn 4-10s
    activeTimer: 0,
    lookTimer: 0,
    wasPeeking: false,
    totalTime: 0,
    currentHour: 0,
    currentMinute: 0,
    graceTimer: 0,
    clickSpawnTimer: Math.random() * 10 + 10,
    clickActiveTimer: 0,
  });

  useFrame((state, delta) => {
    const store = useStore.getState();
    if (store.gameState !== "playing") return;

    const ls = logicState.current;

    // Time logic - 1 in-game hour = 60 seconds real time (total 360s for 6 hours)
    ls.totalTime += delta;
    const hour = Math.floor(ls.totalTime / 60);
    const minute = Math.floor(((ls.totalTime % 60) / 60) * 60);

    if (hour !== ls.currentHour || minute !== ls.currentMinute) {
      ls.currentHour = hour;
      ls.currentMinute = minute;
      store.setTime(hour, minute);
      if (hour >= 6) {
        store.setGameState("win");
        return;
      }
    }

    const isPeeking = store.isPeeking || store.isLocked;
    const monsterType = store.activeMonster;

    if (store.flashlightOn) {
      store.drainBattery(delta * 2.5);
    }

    if (monsterType === "none") {
      ls.spawnTimer -= delta;
      if (ls.spawnTimer <= 0) {
        const pool: any[] = ["peek", "stare", "trap"];
        if (
          store.night >= 3 &&
          !store.clickMonsterActive &&
          (hour > 1 || (hour === 1 && minute >= 30))
        ) {
          pool.push("bird");
        }
        if (
          store.night >= 4 &&
          !store.clickMonsterActive &&
          (hour > 2 || (hour === 2 && minute >= 15))
        ) {
          pool.push("twin_left", "twin_right");
        }
        const type = pool[Math.floor(Math.random() * pool.length)];

        if (type === "bird") {
          playBirdSpawnSound();
        }

        store.setActiveMonster(type);
        ls.activeTimer = 0;
        ls.lookTimer = 0;
        ls.graceTimer = 0;
        ls.wasPeeking = isPeeking;
      }
    } else {
      ls.activeTimer += delta;

      const night5Mod = store.night === 5 ? 1.0 : 0.0;
      const getSpawnTimer = () =>
        Math.random() * (store.night >= 5 ? 4 : store.night >= 3 ? 6 : 8) +
        (store.night >= 5 ? 2 : store.night >= 3 ? 3 : 5);

      if (monsterType === "peek") {
        if (isPeeking) {
          ls.lookTimer += delta;
          if (ls.lookTimer > 1.5 - night5Mod * 0.5) {
            store.setGameState("jumpscare", "peek");
          }
        } else {
          if (ls.wasPeeking && ls.lookTimer > 0 && ls.lookTimer <= 1.5) {
            store.setActiveMonster("none");
            store.incrementScore();
            ls.spawnTimer = getSpawnTimer();
          }
        }

        if (
          ls.activeTimer >= 7.0 - night5Mod * 2 &&
          store.activeMonster === "peek"
        ) {
          store.setGameState("jumpscare", "peek");
        }
      } else if (monsterType === "stare") {
        if (isPeeking) {
          ls.graceTimer = 0;
          ls.lookTimer += delta;
          if (ls.lookTimer >= 3.0 - night5Mod) {
            store.setActiveMonster("none");
            store.incrementScore();
            ls.spawnTimer = getSpawnTimer();
            ls.lookTimer = 0;
          }
        } else {
          if (ls.lookTimer > 0 && ls.lookTimer < 3.0) {
            ls.graceTimer += delta;
            if (ls.graceTimer >= 1.25 - night5Mod * 0.5) {
              store.setGameState("jumpscare", "stare");
            }
          }
        }

        if (
          ls.activeTimer >= 7.0 - night5Mod * 2 &&
          store.activeMonster === "stare"
        ) {
          store.setGameState("jumpscare", "stare");
        }
      } else if (monsterType === "trap") {
        if (!store.isLocked) {
          if (store.isPeeking) {
            // user peeked
            store.setIsLocked(true);
            store.setIsRedEffect(true);
            ls.lookTimer = 0;
          } else {
            if (ls.activeTimer >= 5.0 - night5Mod * 1.5) {
              store.setActiveMonster("none");
              ls.spawnTimer = getSpawnTimer();
            }
          }
        } else {
          ls.lookTimer += delta;
          if (ls.lookTimer >= 3.0 - night5Mod) {
            store.setIsLocked(false);
            store.setIsRedEffect(false);
            store.setActiveMonster("none");
            store.incrementScore();
            ls.spawnTimer = getSpawnTimer();
            ls.lookTimer = 0;
          }
        }
      } else if (monsterType === "bird") {
        if (isPeeking) {
          ls.lookTimer += delta;
          ls.graceTimer = 0;
          if (ls.lookTimer > 2.5 - night5Mod * 0.5) {
            store.setGameState("jumpscare", "bird");
          }
        } else {
          if (store.lookDirection === "left") {
            ls.graceTimer += delta;
            if (ls.graceTimer >= 1.5 - night5Mod * 0.5) {
              playBirdLeaveSound();
              store.setActiveMonster("none");
              store.incrementScore();
              ls.spawnTimer = getSpawnTimer();
              ls.graceTimer = 0;
              ls.lookTimer = 0;
            }
          } else {
            ls.graceTimer = 0;
          }
        }

        if (
          ls.activeTimer >=
          (store.night >= 5 ? 5.0 : store.night === 3 ? 6.0 : 7.0)
        ) {
          store.setGameState("jumpscare", "bird");
        }
      } else if (monsterType === "twin_left") {
        // Needs flashlight for 1.5s while looking at it (peeking)
        if (isPeeking && store.flashlightOn) {
          ls.lookTimer += delta;
          if (ls.lookTimer >= 1.5) {
            store.setActiveMonster("none");
            store.incrementScore();
            ls.spawnTimer = getSpawnTimer();
            ls.lookTimer = 0;
          }
        }
        if (ls.activeTimer >= 5.0) {
          store.setGameState("jumpscare", "twin_left");
        }
      } else if (monsterType === "twin_right") {
        // Hates Flashlight. Dies if you use it on them. Goes away after 5s.
        if (isPeeking && store.flashlightOn) {
          store.setGameState("jumpscare", "twin_right");
        } else {
          if (ls.activeTimer >= 5.0) {
            store.setActiveMonster("none");
            ls.spawnTimer = getSpawnTimer();
          }
        }
      }
    }

    // Click Monster flashlight logic (Night 2+)
    if (store.night >= 2) {
      const night5Mod = store.night === 5 ? 1.0 : 0.0;
      const getClickSpawnTimer = () =>
        Math.random() * (store.night >= 5 ? 8 : store.night === 3 ? 10 : 15) +
        (store.night >= 5 ? 6 : store.night === 3 ? 8 : 10);

      if (!store.clickMonsterActive) {
        if (
          store.activeMonster !== "bird" &&
          store.activeMonster !== "twin_left" &&
          store.activeMonster !== "twin_right"
        ) {
          ls.clickSpawnTimer -= delta;
          if (ls.clickSpawnTimer <= 0) {
            store.setClickMonsterActive(true);
            store.setClicksRemaining(1.5); // 1.5 seconds of flashlight required
            ls.clickActiveTimer = 0;
          }
        }
      } else {
        ls.clickActiveTimer += delta;
        if (store.lookDirection === "left" && store.flashlightOn) {
          store.setClicksRemaining(Math.max(0, store.clicksRemaining - delta));
        }

        if (store.clicksRemaining <= 0) {
          store.setClickMonsterActive(false);
          store.incrementScore();
          ls.clickSpawnTimer = getClickSpawnTimer();
        } else {
          if (ls.clickActiveTimer >= 7.0 - night5Mod * 2) {
            store.setGameState("jumpscare", "click");
          }
        }
      }
    }

    ls.wasPeeking = isPeeking;
  });

  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      if (
        state.gameState === "jumpscare" &&
        prevState.gameState !== "jumpscare"
      ) {
        playJumpscareSound();
      }
      if (
        state.activeMonster === "trap" &&
        prevState.activeMonster !== "trap"
      ) {
        playQuietSound();
      }
      if (state.gameState === "playing" && prevState.gameState !== "playing") {
        logicState.current.spawnTimer = Math.random() * 6 + 4;
        logicState.current.activeTimer = 0;
        logicState.current.lookTimer = 0;
        logicState.current.wasPeeking = false;
        logicState.current.totalTime = 0;
        logicState.current.currentHour = 0;
        logicState.current.currentMinute = 0;
        logicState.current.graceTimer = 0;
        logicState.current.clickSpawnTimer = Math.random() * 10 + 10;
        logicState.current.clickActiveTimer = 0;
        useStore.getState().setIsLocked(false);
        useStore.getState().setIsRedEffect(false);
      }
    });
    return unsub;
  }, []);

  return null;
}

function CameraRig() {
  const cameraGroup = useRef<THREE.Group>(null);
  const isPeeking = useStore((state) => state.isPeeking || state.isLocked);
  const lookDirection = useStore((state) => state.lookDirection);
  const jumpscare = useStore((state) => state.gameState === "jumpscare");
  const flashlightOn = useStore((state) => state.flashlightOn);

  // Target positions
  const hidePos = new THREE.Vector3(0, 1.6, 5);
  const peekPos = new THREE.Vector3(1.5, 1.6, 4.5);
  const leftPos = new THREE.Vector3(-1.0, 1.6, 4.5);

  const hideRot = new THREE.Euler(0, 0, 0);
  const peekRot = new THREE.Euler(0, 0.3, 0);
  const leftRot = new THREE.Euler(0, Math.PI / 4, 0);

  // Focus directly on monster during jumpscare
  const killerMonster = useStore((state) => state.killerMonster);

  const jumpPos =
    killerMonster === "click"
      ? new THREE.Vector3(-1.0, 1.6, 4.5)
      : new THREE.Vector3(1.5, 1.6, 2.0);
  const jumpRot =
    killerMonster === "click"
      ? new THREE.Euler(0, Math.PI / 4, 0)
      : new THREE.Euler(0, 0, 0);

  const spotLightRef = useRef<THREE.SpotLight>(null);

  useFrame((state, delta) => {
    if (!cameraGroup.current) return;

    if (spotLightRef.current) {
      spotLightRef.current.intensity = THREE.MathUtils.lerp(
        spotLightRef.current.intensity,
        flashlightOn ? 8 : 0,
        10 * delta,
      );
    }

    if (jumpscare) {
      cameraGroup.current.position.lerp(jumpPos, 15 * delta);
      state.camera.rotation.setFromVector3(
        new THREE.Vector3()
          .setFromEuler(state.camera.rotation)
          .lerp(new THREE.Vector3().setFromEuler(jumpRot), 15 * delta),
        "XYZ",
      );
    } else {
      let targetPos = hidePos;
      let targetRot = hideRot;

      const storeState = useStore.getState();
      if (storeState.gameState === "menu") {
        const t = state.clock.elapsedTime;
        targetRot = new THREE.Euler(0, Math.sin(t * 0.4) * 0.15, 0);
      } else if (isPeeking) {
        targetPos = peekPos;
        targetRot = peekRot;
      } else if (lookDirection === "left") {
        targetPos = leftPos;
        targetRot = leftRot;
      }

      cameraGroup.current.position.lerp(targetPos, 8 * delta);

      const currentRotVec = new THREE.Vector3().setFromEuler(
        state.camera.rotation,
      );
      const targetRotVec = new THREE.Vector3().setFromEuler(targetRot);
      currentRotVec.lerp(targetRotVec, 8 * delta);
      state.camera.rotation.setFromVector3(currentRotVec, "XYZ");
    }
  });

  return (
    <group ref={cameraGroup}>
      <PerspectiveCamera makeDefault fov={75} near={0.1} far={100}>
        <spotLight
          ref={spotLightRef}
          position={[0, -0.2, 0]}
          angle={0.4}
          penumbra={0.5}
          distance={20}
          color="#ffe6b3"
          decay={2}
        />
      </PerspectiveCamera>
    </group>
  );
}

function PeekMonster() {
  const group = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  const spines = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.position.y = Math.sin(t * 4) * 0.08;
      group.current.position.x = Math.sin(t * 15) * 0.02;
      group.current.rotation.z = Math.sin(t * 10) * 0.05;
    }
    if (jaw.current) {
      jaw.current.rotation.x = 0.4 + Math.abs(Math.sin(t * 8)) * 0.5;
    }
    if (spines.current) {
      spines.current.children.forEach((child, i) => {
        child.rotation.x = 1.2 + Math.sin(t * 20 + i) * 0.2;
      });
    }
  });

  return (
    <group ref={group}>
      {/* Jagged, hunched body with multiple twisted segments */}
      <mesh position={[0, -0.6, 0]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.4, 1.5, 5]} />
        <meshStandardMaterial color="#1a0505" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0, -1.2, -0.2]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 1.5, 5]} />
        <meshStandardMaterial color="#0a0202" roughness={0.9} />
      </mesh>

      {/* Spikes on back */}
      <group ref={spines}>
        {[...Array(8)].map((_, i) => (
          <mesh
            key={`spike-${i}`}
            position={[0, 0.2 - i * 0.25, -0.4 + i * 0.05]}
            rotation={[1.2, 0, 0]}
          >
            <coneGeometry args={[0.06, 1.4, 3]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
        ))}
      </group>

      {/* Long spindly double-jointed arms */}
      <group position={[-0.4, -0.2, 0.1]} rotation={[0.2, 0, -0.5]}>
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.06, 0.03, 1.5]} />
          <meshStandardMaterial color="#110202" />
        </mesh>
        <mesh position={[0.2, -1.8, 0.2]} rotation={[-0.4, 0, 0.4]}>
          <cylinderGeometry args={[0.03, 0.01, 1.5]} />
          <meshStandardMaterial color="#110202" />
        </mesh>
        {/* Claws */}
        <group position={[0.2, -2.6, 0.3]}>
          {[...Array(4)].map((_, i) => (
            <mesh
              key={`lclaw-${i}`}
              position={[-0.1 + i * 0.06, -0.4, 0]}
              rotation={[0.8 - i * 0.1, 0, -0.2 + i * 0.1]}
            >
              <coneGeometry args={[0.02, 0.8, 3]} />
              <meshStandardMaterial color="#222" metalness={0.8} />
            </mesh>
          ))}
        </group>
      </group>

      <group position={[0.4, -0.2, 0.1]} rotation={[0.2, 0, 0.5]}>
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.06, 0.03, 1.5]} />
          <meshStandardMaterial color="#110202" />
        </mesh>
        <mesh position={[-0.2, -1.8, 0.2]} rotation={[-0.4, 0, -0.4]}>
          <cylinderGeometry args={[0.03, 0.01, 1.5]} />
          <meshStandardMaterial color="#110202" />
        </mesh>
        {/* Claws */}
        <group position={[-0.2, -2.6, 0.3]}>
          {[...Array(4)].map((_, i) => (
            <mesh
              key={`rclaw-${i}`}
              position={[-0.1 + i * 0.06, -0.4, 0]}
              rotation={[0.8 - i * 0.1, 0, 0.2 - i * 0.1]}
            >
              <coneGeometry args={[0.02, 0.8, 3]} />
              <meshStandardMaterial color="#222" metalness={0.8} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Skewed Elongated Head */}
      <group position={[0, 0.5, 0.4]} rotation={[0.4, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 0.4, 0.9]} />
          <meshStandardMaterial color="#0a0101" roughness={0.9} />
        </mesh>
        {/* Extra geometry for a more distorted skull */}
        <mesh position={[0, 0.1, -0.3]} rotation={[-0.2, 0, 0]}>
          <coneGeometry args={[0.2, 0.6, 4]} />
          <meshStandardMaterial color="#050000" />
        </mesh>

        {/* Jaw */}
        <group ref={jaw} position={[0, -0.1, 0.2]} rotation={[0.2, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.28, 0.15, 0.8]} />
            <meshStandardMaterial color="#050000" roughness={0.8} />
          </mesh>
          {/* Needle Teeth */}
          {[...Array(8)].map((_, i) => (
            <mesh
              key={`ltooth-${i}`}
              position={[-0.12, 0.15, 0.3 - i * 0.1]}
              rotation={[0.2, 0, 0.2]}
            >
              <coneGeometry args={[0.015, 0.2, 3]} />
              <meshStandardMaterial color="#555" metalness={0.5} />
            </mesh>
          ))}
          {[...Array(8)].map((_, i) => (
            <mesh
              key={`rtooth-${i}`}
              position={[0.12, 0.15, 0.3 - i * 0.1]}
              rotation={[0.2, 0, -0.2]}
            >
              <coneGeometry args={[0.015, 0.2, 3]} />
              <meshStandardMaterial color="#555" metalness={0.5} />
            </mesh>
          ))}
        </group>

        {/* Glowing Beady Eyes */}
        <group position={[0, 0.1, 0.46]}>
          <mesh position={[-0.1, 0, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#ff0000" />
            <pointLight distance={3} intensity={5} color="#ff0000" />
          </mesh>
          <mesh position={[0.1, 0, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Smaller secondary eyes */}
          <mesh position={[-0.15, -0.05, -0.05]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0.15, -0.05, -0.05]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function StareMonster() {
  const head = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const fingers = useRef<THREE.Group>(null);
  const eyeGroup = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (head.current) {
      // Unnatural twitching
      head.current.rotation.z =
        -0.4 +
        (Math.random() > 0.9
          ? Math.sin(t * 50) * 0.2
          : Math.sin(t * 15) * 0.05);
      head.current.rotation.y = Math.cos(t * 5) * 0.1;
    }
    if (body.current) {
      // Phasing/breathing
      body.current.scale.x = 1 + Math.sin(t * 6) * 0.1;
      body.current.scale.z = 1 + Math.sin(t * 6) * 0.1;
    }
    if (fingers.current) {
      fingers.current.children.forEach((finger, i) => {
        finger.rotation.x = Math.sin(t * 3 + i) * 0.2;
      });
    }
    if (eyeGroup.current) {
      // Dilating pupil effect
      eyeGroup.current.scale.setScalar(1 + Math.sin(t * 12) * 0.15);
    }
  });

  return (
    <group scale={0.45} position={[0, -0.4, 0]}>
      {/* Ridiculously tall, emaciated segmented body */}
      <group ref={body} position={[0, -1.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.05, 5, 8]} />
          <meshStandardMaterial
            color="#e8e8e8"
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        {/* Protruding Ribs */}
        {[...Array(12)].map((_, i) => (
          <mesh
            key={`rib-${i}`}
            position={[0, 1.8 - i * 0.25, 0.05 - Math.sin(i * 0.3) * 0.1]}
            rotation={[Math.PI / 2 + 0.3 - i * 0.05, 0, 0]}
          >
            <torusGeometry
              args={[0.2 - Math.abs(i - 5) * 0.015, 0.025, 8, 16]}
            />
            <meshStandardMaterial color="#c0c0c0" roughness={0.6} />
          </mesh>
        ))}
        {/* Twisted Long Arms Reaching Forward */}
        <group position={[0, 1.5, 0]}>
          <mesh position={[-0.4, -1, 0.5]} rotation={[0.5, 0.3, -0.2]}>
            <cylinderGeometry args={[0.03, 0.02, 2.5]} />
            <meshStandardMaterial color="#d4d4d4" />
          </mesh>
          <mesh position={[0.4, -1.2, 0.6]} rotation={[0.6, -0.3, 0.2]}>
            <cylinderGeometry args={[0.03, 0.02, 2.8]} />
            <meshStandardMaterial color="#d4d4d4" />
          </mesh>

          {/* Freakishly long fingers reaching out */}
          <group ref={fingers} position={[0, -2, 1.5]}>
            {[...Array(5)].map((_, i) => (
              <mesh
                key={`lfinger-${i}`}
                position={[-0.4 + i * 0.05, 0, 0]}
                rotation={[1.5, 0, (i - 2) * 0.2]}
              >
                <cylinderGeometry args={[0.005, 0.001, 1.5]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            ))}
            {[...Array(5)].map((_, i) => (
              <mesh
                key={`rfinger-${i}`}
                position={[0.4 + i * 0.05, 0, 0.2]}
                rotation={[1.6, 0, (i - 2) * 0.2]}
              >
                <cylinderGeometry args={[0.005, 0.001, 1.8]} />
                <meshStandardMaterial color="#111" />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* Multi-segmented Twisted Neck */}
      <group position={[0, 1.0, 0]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.04, 0.06, 0.5]} />
          <meshStandardMaterial color="#e0e0e0" roughness={1} />
        </mesh>
        <mesh position={[0.1, 0.4, 0.1]} rotation={[0.2, 0, -0.5]}>
          <cylinderGeometry args={[0.03, 0.04, 0.6]} />
          <meshStandardMaterial color="#e0e0e0" roughness={1} />
        </mesh>
        <mesh position={[-0.05, 0.8, 0.2]} rotation={[0.5, 0, 0.3]}>
          <cylinderGeometry args={[0.02, 0.03, 0.5]} />
          <meshStandardMaterial color="#e0e0e0" roughness={1} />
        </mesh>
      </group>

      {/* Weird Head tilted */}
      <group
        ref={head}
        position={[-0.2, 2.2, 0.4]}
        rotation={[0.2, -0.2, -0.4]}
      >
        <mesh>
          {/* Skewed head shape */}
          <icosahedronGeometry args={[0.3, 2]} />
          <meshStandardMaterial
            color="#b0b0b0"
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>
        {/* Void around eye stretched */}
        <mesh position={[0, 0.05, 0.22]} scale={[1.2, 0.8, 1]}>
          <sphereGeometry args={[0.22, 32, 16]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* Giant staring eye that looks directly forward */}
        <group ref={eyeGroup} position={[0, 0.05, 0.4]}>
          <mesh>
            <sphereGeometry args={[0.09, 32, 16]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
          <pointLight distance={4} intensity={5} color="#00ffff" />
          {/* Dilating Pupil */}
          <mesh position={[0, 0, 0.085]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function TrapMonster() {
  const group = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const tentacles = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = t * 0.2;
      group.current.children.forEach((child, i) => {
        if (child.type === "Mesh") {
          const mesh = child as THREE.Mesh;
          mesh.position.y += Math.sin(t * 4 + i) * 0.01;
          mesh.scale.setScalar(1 + Math.sin(t * 5 + i) * 0.1);
        }
      });
    }
    if (eyes.current) {
      eyes.current.position.y = Math.sin(t * 1.5) * 0.1;
      eyes.current.rotation.z = Math.sin(t * 0.5) * 0.05;
      eyes.current.children.forEach((child, i) => {
        // Let eyes blink or stare intently
        child.scale.setScalar(1 + (Math.sin(t * 10 + i) > 0.8 ? -0.5 : 0));
      });
    }
    if (tentacles.current) {
      tentacles.current.children.forEach((child, i) => {
        child.rotation.x = Math.sin(t * 3 + i) * 0.2;
        child.rotation.z = Math.cos(t * 2.5 + i) * 0.2;
      });
    }
  });

  return (
    <group>
      {/* Shadowy shapeless floating blob vortex */}
      <group ref={group}>
        {Array.from({ length: 30 }).map((_, i) => (
          <mesh
            key={`blob-${i}`}
            position={[
              Math.sin(i * 3.1) * 0.8,
              -0.5 + Math.cos(i) * 1.3,
              Math.sin(i * 1.7) * 0.8,
            ]}
          >
            <sphereGeometry args={[0.2 + (i % 5) * 0.1, 16, 16]} />
            <meshStandardMaterial
              color="#000000"
              roughness={0.1}
              transparent
              opacity={0.8}
              depthWrite={false}
            />
          </mesh>
        ))}
        {/* Core darker mass */}
        <mesh position={[0, -0.2, 0]}>
          <icosahedronGeometry args={[0.7, 2]} />
          <meshStandardMaterial color="#000000" roughness={0.9} />
        </mesh>
      </group>

      {/* Creepy black tentacles hanging down */}
      <group ref={tentacles} position={[0, -0.5, 0]}>
        {[...Array(8)].map((_, i) => (
          <mesh
            key={`tt-${i}`}
            position={[
              Math.cos((i * Math.PI) / 4) * 0.5,
              -0.8,
              Math.sin((i * Math.PI) / 4) * 0.5,
            ]}
            rotation={[0.2, (i * Math.PI) / 4, 0]}
          >
            <cylinderGeometry args={[0.08, 0.01, 2, 5]} />
            <meshStandardMaterial color="#050005" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Cluster of glowing purple eyes */}
      <group ref={eyes}>
        <pointLight
          distance={3}
          intensity={4}
          color="#ff00ff"
          position={[0, -0.2, 0.6]}
        />
        {Array.from({ length: 24 }).map((_, i) => (
          <group
            key={`eye-${i}`}
            position={[
              Math.sin(i * 2.4) * 0.6,
              -0.2 + Math.cos(i * 1.8) * 0.6,
              0.6 + Math.sin(i) * 0.2,
            ]}
          >
            <mesh>
              <sphereGeometry args={[0.02 + (i % 4) * 0.02, 16, 16]} />
              <meshBasicMaterial color={i % 4 === 0 ? "#ffffff" : "#aa00ff"} />
            </mesh>
            {/* Tiny pupils for the bigger eyes */}
            {i % 4 === 2 && (
              <mesh position={[0, 0, 0.05]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}

function MainMonster() {
  const activeMonster = useStore((state) => state.activeMonster);
  const killerMonster = useStore((state) => state.killerMonster);
  const jumpscare = useStore((state) => state.gameState === "jumpscare");
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    if (jumpscare && killerMonster !== "click") {
      // Shake geometry rapidly during jumpscare
      ref.current.position.x = 2 + (Math.random() - 0.5) * 0.2;
      ref.current.position.y = 1.6 + (Math.random() - 0.5) * 0.2;
      ref.current.position.z = -2;
      ref.current.rotation.set(0, 0, 0);
    } else if (!jumpscare && activeMonster !== "none") {
      ref.current.position.set(2, 1.6, -2);
      if (activeMonster === "trap") {
        ref.current.position.y =
          1.6 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      } else if (activeMonster === "stare") {
        ref.current.position.x =
          2 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
        ref.current.rotation.y = 0;
      } else {
        ref.current.rotation.y = 0;
      }
    }
  });

  const isVisible =
    (!jumpscare && activeMonster !== "none") ||
    (jumpscare && killerMonster !== "click" && killerMonster !== "none");
  const renderType =
    jumpscare && killerMonster !== "none" && killerMonster !== "click"
      ? killerMonster
      : activeMonster !== "none"
        ? activeMonster
        : "peek";

  return (
    <group ref={ref} visible={isVisible}>
      {renderType === "peek" && <PeekMonster />}
      {renderType === "stare" && <StareMonster />}
      {renderType === "trap" && <TrapMonster />}
      {renderType === "bird" && <BirdMonster />}
      {renderType === "twin_left" && <TwinMonster side="left" />}
      {renderType === "twin_right" && <TwinMonster side="right" />}
    </group>
  );
}

function TwinMonster({ side }: { side: "left" | "right" }) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      // Unnatural twitching
      group.current.position.y =
        Math.sin(t * 3.5) * 0.05 +
        (Math.random() > 0.95 ? Math.random() * 0.05 : 0) -
        0.7;
      group.current.position.x = side === "left" ? -0.2 : 0.2;
      group.current.rotation.z = Math.sin(t * 1.5) * 0.05;
    }
    if (head.current) {
      head.current.rotation.y =
        Math.sin(t * 4) * 0.15 + (side === "left" ? 0.3 : -0.3);
      head.current.rotation.z =
        Math.sin(t * 2) * 0.05 +
        (Math.random() > 0.9 ? Math.random() * 0.1 : 0);
      head.current.position.x = Math.sin(t * 10) * 0.01; // subtle vibration
    }
    if (leftArm.current) {
      leftArm.current.rotation.z = Math.sin(t * 1.2) * 0.1 + 0.1;
      leftArm.current.rotation.x = Math.sin(t * 0.8) * 0.2;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = -Math.sin(t * 1.3) * 0.1 - 0.1;
      rightArm.current.rotation.x = Math.sin(t * 0.7) * 0.2;
    }
    if (jaw.current) {
      // Creepy gaping mouth
      jaw.current.position.y = Math.sin(t * 2) * 0.02 - 0.15;
    }
  });

  return (
    <group ref={group} scale={0.8}>
      {/* Horribly stretched neck */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.2, 16]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.9} />
      </mesh>

      {/* Emaciated torso */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.15, 0.3, 2.5, 16]} />
        <meshStandardMaterial color="#151515" roughness={0.9} />
      </mesh>

      {/* Too-long dangling arms */}
      <group ref={leftArm} position={[-0.2, 0.2, 0]}>
        <mesh position={[-0.1, -1.2, 0]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.04, 0.02, 2.5, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Long claws */}
        <mesh position={[-0.2, -2.5, 0.1]} rotation={[0.4, 0, 0.2]}>
          <coneGeometry args={[0.02, 0.4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>

      <group ref={rightArm} position={[0.2, 0.2, 0]}>
        <mesh position={[0.1, -1.2, 0]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.04, 0.02, 2.5, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Long claws */}
        <mesh position={[0.2, -2.5, 0.1]} rotation={[0.4, 0, -0.2]}>
          <coneGeometry args={[0.02, 0.4, 4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>

      {/* Weird elongated face */}
      <group ref={head} position={[0, 1.3, 0]}>
        <mesh>
          <capsuleGeometry args={[0.2, 0.6, 16, 16]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
        </mesh>

        {/* Creepy gaping mouth */}
        <group ref={jaw} position={[0, -0.15, 0.18]}>
          <mesh>
            <boxGeometry args={[0.25, 0.15, 0.1]} />
            <meshBasicMaterial color="#000" />
          </mesh>
          {/* jagged teeth */}
          <mesh position={[0, 0.05, 0.05]}>
            <boxGeometry args={[0.2, 0.02, 0.01]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh position={[0, -0.05, 0.05]}>
            <boxGeometry args={[0.2, 0.02, 0.01]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
        </group>

        {/* Glowing eye based on side */}
        <group position={[0, 0.2, 0]}>
          {side === "left" ? (
            <mesh position={[-0.1, 0, 0.18]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#ffff55" />
            </mesh>
          ) : (
            <mesh position={[0.1, 0, 0.18]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#ffff55" />
            </mesh>
          )}

          {/* Hollow carved out dead eye for the other side */}
          {side === "left" ? (
            <mesh position={[0.1, 0, 0.18]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color="#000" />
            </mesh>
          ) : (
            <mesh position={[-0.1, 0, 0.18]}>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color="#000" />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

function BirdMonster() {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const feathers = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.5) * 0.05;
    }
    if (head.current) {
      // Bird twitching movement
      head.current.rotation.y =
        Math.sin(t * 5) > 0.8 ? 0.3 : Math.sin(t * 5) < -0.8 ? -0.3 : 0;
      head.current.rotation.z = Math.sin(t * 7) > 0.9 ? 0.1 : 0;
    }
    if (feathers.current) {
      feathers.current.children.forEach((child, i) => {
        child.rotation.x = -Math.PI / 8 + Math.sin(t * 4 + i) * 0.05;
      });
    }
  });

  return (
    <group ref={group} scale={0.65} position={[0, -0.8, 0]}>
      {/* Tall figure wrapped in a black feather cloak */}
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[1, 4, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>

      <group ref={feathers} position={[0, 0, 0]}>
        {/* Add some feather-like meshes falling down */}
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh
            key={`f-${i}`}
            position={[
              (Math.random() - 0.5) * 1.5,
              Math.random() * 2 - 1,
              (Math.random() - 0.5) * 1.5 + 0.3,
            ]}
            rotation={[-Math.PI / 8, Math.random() * Math.PI, 0]}
          >
            <cylinderGeometry args={[0.05, 0.01, 0.4]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
      </group>

      {/* Bird Head (Plague doctor-ish or Raven) */}
      <group ref={head} position={[0, 1.8, 0.2]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#111" roughness={0.7} />
        </mesh>
        {/* Beak */}
        <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.1, 0.8, 4]} />
          <meshStandardMaterial color="#d4d4d4" metalness={0.5} />
        </mesh>
        {/* Creepy glowing yellow eye slit */}
        <mesh position={[0.15, 0.1, 0.2]} rotation={[0, 0.5, 0]}>
          <planeGeometry args={[0.15, 0.05]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
        <mesh position={[-0.15, 0.1, 0.2]} rotation={[0, -0.5, 0]}>
          <planeGeometry args={[0.15, 0.05]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      </group>
    </group>
  );
}

function ClickMonster() {
  const isClickMonsterActive = useStore((state) => state.clickMonsterActive);
  const killerMonster = useStore((state) => state.killerMonster);
  const jumpscare = useStore((state) => state.gameState === "jumpscare");
  const ref = useRef<THREE.Group>(null);
  const massGroup = useRef<THREE.Group>(null);
  const tendrils = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    if (jumpscare && killerMonster === "click") {
      ref.current.position.set(
        -1.0 + (Math.random() - 0.5) * 0.1,
        1.6 + (Math.random() - 0.5) * 0.1,
        4.0,
      );
      ref.current.rotation.set(0, Math.PI / 4, 0);
    } else {
      // Slowly creep in
      const progress = Math.min((t % 7) / 7, 1);
      ref.current.position.set(-2.5 + progress * 0.5, 1.6, 4);
      ref.current.rotation.set(0, Math.PI / 3, 0);
    }

    if (massGroup.current) {
      massGroup.current.scale.setScalar(1 + Math.sin(t * 15) * 0.08); // Rapid terrifying pulsing
      massGroup.current.rotation.y = t;
    }
    if (coreRef.current) {
      coreRef.current.rotation.x = t * 2;
      coreRef.current.rotation.z = t * 2.5;
    }
    if (tendrils.current) {
      tendrils.current.children.forEach((child, i) => {
        child.rotation.z = Math.sin(t * 8 + i) * 0.4;
        child.rotation.x = Math.cos(t * 7 + i) * 0.4;
      });
    }
  });

  const isVisible =
    (!jumpscare && isClickMonsterActive) ||
    (jumpscare && killerMonster === "click");

  return (
    <group ref={ref} visible={isVisible}>
      <group
        onPointerDown={(e) => {
          e.stopPropagation();
          useStore.getState().decrementClicks();
        }}
      >
        <group ref={massGroup}>
          {/* Horrific pulsating mass */}
          <mesh position={[0, -0.2, 0]}>
            <torusKnotGeometry args={[0.5, 0.2, 128, 32]} />
            <meshStandardMaterial
              color="#1a0a05"
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          <mesh ref={coreRef} position={[0, 0, 0]}>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshStandardMaterial color="#000000" roughness={0.1} />
          </mesh>
          <pointLight
            distance={4}
            intensity={8}
            color="#ffaa00"
            position={[0, 0, 0]}
          />

          {/* Many tiny swarming spheres */}
          {[...Array(20)].map((_, i) => (
            <mesh
              key={`swarm-${i}`}
              position={[
                Math.sin(i * 2) * 0.6,
                Math.cos(i * 3) * 0.6,
                Math.sin(i * 5) * 0.6,
              ]}
            >
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color="#2a0505" />
            </mesh>
          ))}

          {/* Multiple eyes looking everywhere */}
          {[...Array(15)].map((_, i) => (
            <group
              key={`ceye-${i}`}
              position={[
                Math.sin(i * 1.5) * 0.55,
                Math.cos(i * 2.2) * 0.55,
                Math.sin(i * 3.1) * 0.55,
              ]}
              rotation={[i, i * 2, 0]}
            >
              <mesh position={[0, 0, 0.05]}>
                <sphereGeometry args={[0.05 + (i % 3) * 0.02, 16, 16]} />
                <meshBasicMaterial color="#ffff00" />
              </mesh>
              <mesh position={[0, 0, 0.08 + (i % 3) * 0.02]}>
                <sphereGeometry args={[0.02 + (i % 3) * 0.01, 8, 8]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            </group>
          ))}
        </group>
        {/* Spastic Tendrils */}
        <group ref={tendrils}>
          {[...Array(16)].map((_, i) => (
            <mesh
              key={`tendril-${i}`}
              position={[
                Math.cos((i * Math.PI) / 8) * 0.4,
                -0.6 + Math.sin(i) * 0.4,
                Math.sin((i * Math.PI) / 8) * 0.4,
              ]}
              rotation={[0, 0, Math.cos(i)]}
            >
              <cylinderGeometry
                args={[0.01, 0.06, 1.8 + Math.sin(i) * 0.5, 5]}
              />
              <meshStandardMaterial color="#0a0502" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// --- inside Scene.tsx before export function Scene ---

// --- Menu Monsters ---
function MenuMonsters() {
  const gameState = useStore((state) => state.gameState);
  const peekRef = useRef<THREE.Group>(null);
  const stareRef = useRef<THREE.Group>(null);
  const creeperRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (gameState !== "menu") return;
    const t = clock.elapsedTime;

    // Peek monster appears on the right edge
    if (peekRef.current) {
      const peekOffset = Math.sin(t * 0.6 + 4);
      // when positive, it moves out from the wall (x going negative relative to wall right)
      peekRef.current.position.set(
        1.5 + Math.min(0, peekOffset) * 0.5,
        1.4,
        2.5,
      );
      peekRef.current.rotation.y = -0.5;
    }

    // Stare monster appears deep in hallway
    if (stareRef.current) {
      const stareOffset = Math.sin(t * 0.3 + 12);
      stareRef.current.position.set(1.5, 1.5, -2 + Math.max(0, stareOffset));
    }

    // Creeper appears on the left
    if (creeperRef.current) {
      const creepOffset = Math.sin(t * 0.8 + 2);
      creeperRef.current.position.set(
        -2.0 + Math.min(0, creepOffset) * 0.5,
        1.0,
        4.0,
      );
    }
  });

  if (gameState !== "menu") return null;

  return (
    <group>
      <group ref={peekRef} scale={0.7}>
        <PeekMonster />
      </group>
      <group ref={stareRef} scale={0.8}>
        <StareMonster />
      </group>
      <group ref={creeperRef} scale={0.6}>
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.4]} />
          <meshStandardMaterial color="#110505" />
        </mesh>
        <pointLight
          distance={1.5}
          intensity={2}
          color="#ffff00"
          position={[0, 0.2, 0.4]}
        />
        <mesh position={[-0.1, 0.1, 0.38]}>
          <sphereGeometry args={[0.04]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
        <mesh position={[0.1, 0.2, 0.36]}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      </group>
    </group>
  );
}

function HallwayEnvironment() {
  const activeMonster = useStore((state) => state.activeMonster);

  let glowColor = "#000000";
  let glowIntensity = 0;

  if (activeMonster === "trap") {
    glowColor = "#8800ff";
    glowIntensity = 0.6;
  } else if (
    activeMonster === "peek" ||
    activeMonster === "stare" ||
    activeMonster === "bird"
  ) {
    glowColor = "#ff1111";
    glowIntensity = 0.2;
  } else if (activeMonster === "twin_left" || activeMonster === "twin_right") {
    glowColor = "#eeee99";
    glowIntensity = 0.2;
  }

  return (
    <group>
      <ambientLight intensity={0.5} />
      <spotLight
        position={[0, 4, 6]}
        angle={0.5}
        penumbra={1}
        intensity={50}
        color="#aabbff"
        castShadow
      />
      {/* Weak light down the hallway so we can see the corridor slightly */}
      <pointLight
        position={[1.5, 2, 0]}
        intensity={3}
        color="#aabbff"
        distance={10}
      />

      {/* Weak light to reveal monster glow */}
      {activeMonster !== "none" && (
        <pointLight
          position={[2, 2, -1.8]}
          intensity={glowIntensity}
          color={glowColor}
          distance={6}
        />
      )}

      {/* The Hiding Wall */}
      <mesh position={[-1, 1.5, 3]} castShadow receiveShadow>
        <boxGeometry args={[4, 3, 0.5]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>

      {/* Hallway Left Outer Wall (So you're enclosed in a room) */}
      <mesh position={[-3.5, 1.5, 1]} castShadow receiveShadow>
        <boxGeometry args={[1, 3, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Back wall of the room the player is in */}
      <mesh position={[-0.5, 1.5, 6.5]} receiveShadow>
        <boxGeometry args={[7, 3, 0.5]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      {/* Hallway Right Wall */}
      <mesh position={[3.5, 1.5, 1]} castShadow receiveShadow>
        <boxGeometry args={[1, 3, 10]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>

      {/* Hallway Floor */}
      <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 10]} />
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </mesh>

      {/* Hallway Ceiling */}
      <mesh position={[0, 3, 1]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 10]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>

      {/* Back wall of hallway */}
      <mesh position={[1, 1.5, -4]} receiveShadow>
        <boxGeometry args={[6, 3, 0.5]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
    </group>
  );
}

export function Scene() {
  return (
    <>
      <color attach="background" args={["#020203"]} />
      <fog attach="fog" args={["#020203", 6, 18]} />

      <GameLogic />
      <CameraRig />

      <HallwayEnvironment />

      <MainMonster />
      <ClickMonster />
      <MenuMonsters />
    </>
  );
}
