import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const MANIFEST_TIMEOUT_MS = 12000;
const MAX_NETWORK_RECOVERIES = 2;
const MAX_MEDIA_RECOVERIES = 1;

function VideoPlayer({ video, videoRef, onLoadedMetadata, onPause, onEnded }) {
    const hlsRef = useRef(null);
    const pendingSeekRef = useRef(null);
    const [levels, setLevels] = useState([]);
    const [selectedLevel, setSelectedLevel] = useState(-1);
    const [autoHeight, setAutoHeight] = useState(null);
    const [isHlsActive, setIsHlsActive] = useState(false);

    const videoFile = video?.videoFile;
    const hlsUrl = video?.hls?.status === 'unavailable' ? null : video?.hls?.playbackUrl;

    useEffect(() => {
        const player = videoRef.current;
        if (!player || !videoFile) return undefined;

        let disposed = false;
        let manifestLoaded = false;
        let networkRecoveries = 0;
        let mediaRecoveries = 0;
        let watchdog = null;

        setLevels([]);
        setSelectedLevel(-1);
        setAutoHeight(null);
        setIsHlsActive(false);

        const destroyHls = () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };

        const playMp4 = () => {
            if (disposed) return;

            const resumeAt = Number.isFinite(player.currentTime) && player.currentTime > 1
                ? player.currentTime
                : null;

            window.clearTimeout(watchdog);
            destroyHls();
            setLevels([]);
            setIsHlsActive(false);
            pendingSeekRef.current = resumeAt;

            if (player.getAttribute('src') !== videoFile) {
                player.src = videoFile;
                player.load();
            }
            player.play().catch(() => {});
        };

        const handleMediaError = () => {
            if (disposed) return;
            const source = player.currentSrc || player.getAttribute('src') || '';
            if (source && source !== videoFile) playMp4();
        };

        const cleanup = () => {
            disposed = true;
            window.clearTimeout(watchdog);
            player.removeEventListener('error', handleMediaError);
            destroyHls();
        };

        player.addEventListener('error', handleMediaError);

        if (!hlsUrl) {
            pendingSeekRef.current = null;
            if (player.getAttribute('src') !== videoFile) {
                player.src = videoFile;
                player.load();
            }
            return cleanup;
        }

        if (!Hls.isSupported()) {
            if (player.canPlayType('application/vnd.apple.mpegurl')) {
                pendingSeekRef.current = null;
                player.src = hlsUrl;
                player.load();
                player.play().catch(() => {});

                watchdog = window.setTimeout(() => {
                    if (!disposed && player.readyState < 1) playMp4();
                }, MANIFEST_TIMEOUT_MS);

                return cleanup;
            }

            playMp4();
            return cleanup;
        }

        pendingSeekRef.current = null;
        const hls = new Hls({ enableWorker: true, backBufferLength: 90 });
        hlsRef.current = hls;
        setIsHlsActive(true);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
            if (disposed) return;

            manifestLoaded = true;
            window.clearTimeout(watchdog);

            const availableLevels = data.levels
                .map((level, index) => ({
                    index,
                    height: Math.min(level.width || level.height, level.height || level.width),
                    bitrate: level.bitrate,
                }))
                .filter((level) => level.height > 0)
                .sort((left, right) => left.height - right.height);

            setLevels(availableLevels);
            player.play().catch(() => {});
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
            if (disposed || !hls.autoLevelEnabled) return;
            const level = hls.levels[data.level];
            setAutoHeight(level
                ? Math.min(level.width || level.height, level.height || level.width)
                : null);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
            if (disposed || !data.fatal) return;

            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                const maxRecoveries = manifestLoaded ? MAX_NETWORK_RECOVERIES : 1;
                if (networkRecoveries < maxRecoveries) {
                    networkRecoveries += 1;
                    hls.startLoad();
                    return;
                }
                playMp4();
                return;
            }

            if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveries < MAX_MEDIA_RECOVERIES) {
                mediaRecoveries += 1;
                hls.recoverMediaError();
                return;
            }

            playMp4();
        });

        watchdog = window.setTimeout(() => {
            if (!disposed && !manifestLoaded) playMp4();
        }, MANIFEST_TIMEOUT_MS);

        hls.loadSource(hlsUrl);
        hls.attachMedia(player);

        return cleanup;
    }, [hlsUrl, videoFile, videoRef]);

    const handleLoadedMetadata = () => {
        const player = videoRef.current;
        if (!player) return;

        if (pendingSeekRef.current && Number.isFinite(player.duration)) {
            player.currentTime = Math.min(pendingSeekRef.current, Math.max(0, player.duration - 0.5));
            pendingSeekRef.current = null;
            return;
        }

        onLoadedMetadata?.();
    };

    const handleQualityChange = (event) => {
        const nextLevel = Number(event.target.value);
        setSelectedLevel(nextLevel);

        if (hlsRef.current) {
            hlsRef.current.currentLevel = nextLevel;
        }
    };

    const showQualityMenu = isHlsActive && levels.length > 1;

    return (
        <div className="relative w-full h-full">
            <video
                ref={videoRef}
                controls
                autoPlay
                muted
                playsInline
                className="w-full h-full"
                onLoadedMetadata={handleLoadedMetadata}
                onPause={onPause}
                onEnded={onEnded}
            ></video>

            {showQualityMenu && (
                <label className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm border border-white/20">
                    <span className="text-white/70">Quality</span>
                    <select
                        value={selectedLevel}
                        onChange={handleQualityChange}
                        aria-label="Video quality"
                        className="bg-transparent text-white focus:outline-none cursor-pointer"
                    >
                        <option value={-1} className="text-black">
                            {autoHeight ? `Auto (${autoHeight}p)` : 'Auto'}
                        </option>
                        {levels.map((level) => (
                            <option key={level.index} value={level.index} className="text-black">
                                {level.height}p
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </div>
    );
}

export default VideoPlayer;
