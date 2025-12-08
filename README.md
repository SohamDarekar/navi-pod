# 🎵 NaviPod

**A nostalgic, high-fidelity Navidrome client wrapped in the iconic iPod Classic design.**

<div align="center">

![Navidrome](https://img.shields.io/badge/Navidrome-Compatible-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-13-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

</div>

-----

## About

**NaviPod** is a fork of the incredible [iPod.js](https://github.com/tvillarete/ipod-classic-js) project. While the original brings Spotify and Apple Music to the click wheel, **NaviPod** is built specifically for the self-hosted music enthusiast.

It connects directly to your **Navidrome** server (or any Subsonic-compatible API) to stream your personal music collection. We've stripped out the commercial streaming services to focus purely on your own library, adding robust synchronization, a full queue management system, and lossless playback capabilities that true audiophiles appreciate.

-----

## Features

### Advanced Playback Control

  * **Dynamic Queue**: View upcoming tracks, verify what's next, and remove songs directly from the Now Playing queue.
  * **Play Next & Enqueue**: Seamlessly build your listening session. Choose to **Play Next** to hear a song immediately after the current one, or **Add to Queue** to listen later.
  * **Loop & Shuffle**: Toggle **Loop Mode** to keep your favorite track on repeat, or shuffle your playback for a fresh mix.
  * **Smart Preloading**: Intelligent audio preloading ensures near-instant track switching and a gapless-like experience.

### Navidrome Integration

  * **100% Lossless Music**: Streams audio directly from your server in raw format, ensuring no quality is lost in transcoding.
  * **Scrobbling**: Automatically reports your playback history back to your Navidrome server.
  * **Full Library Access**: Browse Artists, Albums, and Playlists from your self-hosted collection.

### Smart Synchronization

  * **Library Sync**: A dedicated synchronization engine caches metadata for a snappy, responsive browsing experience.
  * **Sync Status**: Real-time feedback on sync progress.
  * **Auto-Sync**: Keeps your device library fresh in the background.

### Refactored Core Engine

  * **New Scrolling System**: A completely rewritten, deterministic scrolling engine guarantees the selected item is always visible and eliminates visual glitches.
  * **Performance**: GPU-accelerated transforms for butter-smooth 60fps animations.

-----

## Differences from iPod.js

While visually faithful to the original project, the internals of NaviPod have been overhauled for self-hosted streaming:

1.  **Backend Replacement**: The Spotify/Apple Music SDKs have been replaced with a custom **Subsonic/Navidrome Client** using MD5 legacy authentication.
2.  **Audio Engine**: A custom `useAudioPlayer` hook manages the HTML5 Audio element, handling queue state, volume persistence, and preloading logic locally.
3.  **Navigation Refactor**: The original `scrollIntoView` logic has been replaced with a deterministic `useMenuNavigation` hook for consistent behavior across devices.

-----

## 🚀 Quick Start

### Docker (Recommended)

The easiest way to get started is using the pre-built Docker image available on [Docker Hub](https://hub.docker.com/repository/docker/soh4m/navi-pod/general).

```bash
docker run -p 3000:3000 soh4m/navi-pod
```

Visit `http://localhost:3000` to start using NaviPod.

### Manual Installation

If you prefer to build from source:

1.  **Prerequisites**: Node.js and Yarn.

2.  **Clone & Install**:

    ```bash
    git clone https://github.com/SohamDarekar/navi-pod.git
    cd navi-pod
    yarn install
    ```

3.  **Run Development Server**:

    ```bash
    yarn dev
    ```

-----

## Configuration

### Connecting Your Server

1.  Open NaviPod in your browser.
2.  Navigate to **Settings** > **Service**.
3.  Enter your Navidrome **Server URL** (e.g., `https://music.yourdomain.com`).
4.  Enter your **Username** and **Password**.
5.  Hit **Connect** to authenticate and start syncing your library!

### Syncing Your Library

*   **Manual Sync**: Go to **Settings** > **Service** > **Sync Now** to refresh your library.
*   **Auto-Sync**: Enable automatic background synchronization in **Settings** > **Service** > **Auto Sync**.
*   **Sync Status**: View real-time sync progress from the Settings preview panel.

-----

## 📱 Install as Mobile App (PWA)

NaviPod works as a Progressive Web App, giving you a native app-like experience on your phone!

### Android Installation

1.  Open NaviPod in **Chrome** or **Samsung Internet**.
2.  Tap the **three-dot menu** (⋮) in the top-right corner.
3.  Select **"Add to Home screen"** or **"Install app"**.
4.  Confirm the installation.
5.  The NaviPod icon will appear on your home screen!

**Alternative method:**

*   Look for the **"Install"** banner at the bottom of the screen and tap **Install**.

### iOS Installation

1.  Open NaviPod in **Safari** (must be Safari, not Chrome).
2.  Tap the **Share button** (□ with an arrow pointing up) at the bottom of the screen.
3.  Scroll down and tap **"Add to Home Screen"**.
4.  Name it "NaviPod" (or whatever you prefer).
5.  Tap **"Add"** in the top-right corner.
6.  The NaviPod icon will appear on your home screen!

**Why Safari?** iOS only allows PWA installation through Safari. Other browsers won't show the install option.

### PWA Benefits

*   **Standalone Mode**: Runs fullscreen without browser UI.
*   **Home Screen Icon**: Launch directly from your phone's home screen.
*   **Haptic Feedback**: Tactile vibrations when navigating the click wheel (mobile only).
*   **Offline UI**: The interface loads instantly, even without internet.
*   **Native Feel**: Behaves like a real app with smooth animations.

-----

## Controls & Navigation

### Click Wheel Controls

*   **Clockwise Rotation**: Scroll down through lists
*   **Counter-Clockwise Rotation**: Scroll up through lists
*   **Center Button**: Select item / Play-Pause
*   **Menu Button**: Go back / Return to previous screen
*   **Forward Button**: Skip to next track
*   **Backward Button**: Previous track or restart current
*   **Play/Pause Button**: Toggle playback

### Desktop Controls

*   **Arrow Keys** (↑ ↓): Navigate through menus
*   **Enter**: Select item
*   **Escape/Backspace**: Go back
*   **Spacebar**: Play/Pause
*   **Mouse Wheel**: Scroll through lists on click wheel
*   **Click**: Interact with buttons

### Mobile Controls

*   **Swipe** on click wheel to navigate
*   **Tap** buttons to interact
*   **Haptic feedback** on supported devices

-----

## Customization

### Themes

NaviPod supports multiple classic iPod color schemes:

*   **Silver** (Default) - Classic iPod look
*   **Black** - Sleek dark variant
*   **U2 Special Edition** - Red click wheel tribute

### Cover Art Animations

NaviPod features a **Ken Burns effect** for album artwork - a subtle pan and zoom animation that brings your music preview to life, just like the original iPod photo slideshows.

-----

## Technical Details

### Architecture

*   **Framework**: Next.js 16 with React 19
*   **Styling**: Styled Components with Framer Motion animations
*   **State Management**: React Query (TanStack Query) for server state
*   **Audio Engine**: Custom HTML5 Audio implementation with preloading
*   **API Client**: Custom Subsonic/Navidrome client with MD5 authentication

### Key Features Under the Hood

*   **Deterministic Scrolling**: Custom `useMenuNavigation` hook ensures pixel-perfect menu scrolling
*   **GPU-Accelerated Animations**: Transform-based scrolling for 60fps performance
*   **Smart Audio Preloading**: Next track preloads during playback for instant switching
*   **Query Caching**: Intelligent caching with React Query reduces server requests
*   **Haptic Feedback**: Native vibration API integration for mobile devices
*   **Scrobbling**: Automatic playback reporting to your Navidrome server

### Browser Compatibility

*   **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)
*   **Mobile**: iOS Safari 14+, Chrome for Android, Samsung Internet
*   **PWA Support**: Full PWA capabilities on iOS 14+ and Android 5+

### What's Included

*   **Music Library**: Browse by Artists, Albums, Songs, and Playlists
*   **Search**: Full-text search with on-screen keyboard
*   **Brick Game**: Classic retro game easter egg!
*   **Settings**: Server configuration, theme selection, and sync controls
*   **About**: Version and app information

-----

## Troubleshooting

### Connection Issues

**"Unable to connect to server"**

*   Verify your server URL includes `http://` or `https://`
*   Ensure your Navidrome server is accessible from your device
*   Check that CORS is properly configured on your Navidrome server
*   Try accessing your server URL directly in a browser

### Sync Problems

**"Library not updating"**

*   Go to **Settings** > **Service** > **Sync Now** to manually refresh
*   Try logging out and back in
*   Clear browser cache and reload the page

### Audio Playback Issues

**"Songs won't play or skip immediately"**

*   Check your Navidrome server is streaming files correctly
*   Verify your browser supports the audio format (most browsers support MP3, FLAC, OGG)
*   Try a different browser
*   Check browser console for error messages (F12 → Console)

### PWA Installation Issues

**iOS: "Add to Home Screen" doesn't show up**

*   Make sure you're using **Safari** (not Chrome or Firefox)
*   The option is in the Share menu (□↑), not the settings menu

**Android: Install prompt doesn't appear**

*   Look for the menu option (⋮ → "Install app" or "Add to Home screen")
*   Some browsers may require HTTPS to show install prompts

-----

## Acknowledgements & Credits

**This project would not exist without the brilliant work of [Tanner Villarete](https://tannerv.com).**

NaviPod is a fork of his [ipod-classic-js](https://github.com/tvillarete/ipod-classic-js) repository. The pixel-perfect design, the click wheel logic, and the beautiful Framer Motion animations are all thanks to his original dedication to recreating the iPod experience.

  * **Original Creator**: [Tanner Villarete](https://github.com/tvillarete)
  * **Original Repository**: [ipod-classic-js](https://github.com/tvillarete/ipod-classic-js)

Please consider starring the original repository to show your support for the foundation of this project\!

-----

## Contributing

Contributions are welcome! Whether it's:

*   Bug reports and fixes
*   New features and enhancements
*   Documentation improvements
*   UI/UX refinements

Feel free to open an issue or submit a pull request on [GitHub](https://github.com/SohamDarekar/navi-pod).

### Development Setup

```bash
git clone https://github.com/SohamDarekar/navi-pod.git
cd navi-pod
yarn install
yarn dev
```

Visit `http://localhost:3000` to see your changes.

-----

## License

This project is open source and available under the [MIT License](LICENSE).