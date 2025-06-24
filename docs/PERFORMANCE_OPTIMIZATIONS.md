# 🚀 Mobile Performance Optimizations

This document describes the platform-specific performance optimizations implemented for the Hex Zero mobile app.

## Overview

The mobile version includes several performance optimizations to ensure smooth gameplay on both iOS and Android devices:

1. **Platform-Specific Rendering** - Different optimizations for iOS WebKit and Android WebView
2. **Batch Rendering** - Hexes are rendered in batches to minimize draw calls
3. **Viewport Culling** - Only visible hexes are rendered
4. **Object Pooling** - Reuse of Path2D objects and text metrics
5. **Dirty Region Tracking** - Only changed hexes are redrawn
6. **Adaptive Quality** - Automatic quality reduction on low-performance devices
7. **Memory Management** - Periodic cache trimming and optimization

## Key Components

### MobilePerformanceOptimizer

Central performance management system that:

-   Detects platform (iOS/Android/Web)
-   Manages device pixel ratio capping
-   Provides platform-specific CSS optimizations
-   Monitors FPS and adjusts quality automatically
-   Handles memory optimization

### OptimizedHexRenderer

High-performance renderer that:

-   Caches hex data to avoid redundant calculations
-   Batches similar rendering operations
-   Uses Path2D for efficient shape rendering
-   Implements dirty region tracking
-   Provides viewport culling

### PerformanceMonitor

Debug tool (Ctrl+Shift+P) that displays:

-   Current FPS
-   Platform information
-   Cache statistics
-   Memory usage
-   Active optimizations

## Platform-Specific Optimizations

### iOS Optimizations

-   WebKit-specific CSS transforms for GPU acceleration
-   Higher device pixel ratio support (up to 3x)
-   Image smoothing enabled for better quality

### Android Optimizations

-   Lower device pixel ratio cap (2x) for better performance
-   Automatic low-performance mode detection
-   More aggressive memory management
-   Image smoothing disabled for better performance

## Adaptive Quality System

The system automatically adjusts quality based on performance:

1. **Full Quality Mode** (60 FPS)

    - All visual effects enabled
    - High-resolution rendering
    - Smooth animations

2. **Reduced Quality Mode** (<30 FPS)
    - Lower resolution rendering
    - Simplified visual effects
    - Frame skipping for animations
    - Reduced texture sizes

## Usage

The optimizations are automatically applied when running on mobile platforms. For debugging:

1. Add `?debug` to the URL to enable performance monitoring
2. Press Ctrl+Shift+P to toggle the performance overlay
3. Monitor FPS and adjust gameplay accordingly

## Best Practices

1. **Minimize State Changes** - Group similar rendering operations
2. **Use Viewport Culling** - Don't render off-screen elements
3. **Cache Calculations** - Store and reuse expensive computations
4. **Batch Updates** - Update multiple elements in a single pass
5. **Defer Non-Critical Updates** - Use idle callbacks for UI updates

## Performance Targets

-   **iOS**: 60 FPS on iPhone 12 and newer, 30+ FPS on older devices
-   **Android**: 60 FPS on high-end devices, 30+ FPS on mid-range devices
-   **Memory**: Stay under 100MB heap usage
-   **Battery**: Minimize CPU usage during idle periods
