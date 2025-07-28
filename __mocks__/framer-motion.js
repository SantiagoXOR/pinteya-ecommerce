// ===================================
// PINTEYA E-COMMERCE - MOCK DE FRAMER MOTION PARA TESTS
// ===================================

const React = require('react');

// Mock de motion components
const motion = {
  div: React.forwardRef(({ children, ...props }, ref) => 
    React.createElement('div', { ...props, ref }, children)
  ),
  button: React.forwardRef(({ children, ...props }, ref) => 
    React.createElement('button', { ...props, ref }, children)
  ),
  span: React.forwardRef(({ children, ...props }, ref) => 
    React.createElement('span', { ...props, ref }, children)
  ),
  img: React.forwardRef(({ children, ...props }, ref) => 
    React.createElement('img', { ...props, ref }, children)
  ),
};

// Mock de AnimatePresence
const AnimatePresence = ({ children }) => children;

// Mock de useAnimation
const useAnimation = () => ({
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn(),
  set: jest.fn(),
});

// Mock de useMotionValue
const useMotionValue = (initialValue) => ({
  get: jest.fn(() => initialValue),
  set: jest.fn(),
  onChange: jest.fn(),
  destroy: jest.fn(),
});

// Mock de useTransform
const useTransform = (value, inputRange, outputRange) => ({
  get: jest.fn(() => outputRange[0]),
  set: jest.fn(),
});

// Mock de useSpring
const useSpring = (value, config) => ({
  get: jest.fn(() => value),
  set: jest.fn(),
});

// Mock de useCycle
const useCycle = (...items) => [
  items[0],
  jest.fn(() => items[1]),
];

// Mock de useAnimationFrame
const useAnimationFrame = (callback) => {
  // No hacer nada en tests
};

// Mock de useViewportScroll
const useViewportScroll = () => ({
  scrollX: { get: jest.fn(() => 0) },
  scrollY: { get: jest.fn(() => 0) },
  scrollXProgress: { get: jest.fn(() => 0) },
  scrollYProgress: { get: jest.fn(() => 0) },
});

// Mock de useElementScroll
const useElementScroll = () => ({
  scrollX: { get: jest.fn(() => 0) },
  scrollY: { get: jest.fn(() => 0) },
  scrollXProgress: { get: jest.fn(() => 0) },
  scrollYProgress: { get: jest.fn(() => 0) },
});

// Mock de useDragControls
const useDragControls = () => ({
  start: jest.fn(),
});

// Mock de useAnimationControls
const useAnimationControls = () => ({
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn(),
  set: jest.fn(),
  mount: jest.fn(),
  unmount: jest.fn(),
});

module.exports = {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useSpring,
  useCycle,
  useAnimationFrame,
  useViewportScroll,
  useElementScroll,
  useDragControls,
  useAnimationControls,
  // Aliases
  useAnimationControls: useAnimationControls,
};
