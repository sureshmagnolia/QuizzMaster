/**
 * Universal Media Player & Controller for QuizzMaster Pro
 * Supports Images, Bioacoustic/Speech Audio with visualizer, Local HTML5 Video (MP4/WebM), and YouTube Video Embeds
 */

(function (window) {
    'use strict';

    const MediaPlayer = {
        /**
         * Extracts YouTube video ID from various standard URL formats
         * e.g., youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, or pure ID
         */
        extractYouTubeId: function (url) {
            if (!url || typeof url !== 'string') return null;
            const trimmed = url.trim();
            if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
                return trimmed;
            }
            const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            return match ? match[1] : null;
        },

        /**
         * Parses start timestamp in seconds from URL or parameter
         */
        parseTimestamp: function (val) {
            if (val === null || val === undefined || val === '') return 0;
            if (typeof val === 'number') return Math.max(0, val);
            const str = String(val).trim();
            if (/^\d+$/.test(str)) return parseInt(str, 10);
            // mm:ss format
            if (/^\d+:\d+$/.test(str)) {
                const parts = str.split(':');
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            }
            return 0;
        },

        /**
         * Renders media into a target DOM container
         * @param {HTMLElement|string} target - Container element or CSS selector
         * @param {Object} media - { type: 'none'|'image'|'audio'|'video'|'youtube', src, start, end, autoPlay, caption, isAnswer }
         * @param {Object} options - { isQMView: boolean, onPlay: Function, onPause: Function }
         */
        render: function (target, media, options) {
            const container = typeof target === 'string' ? document.querySelector(target) : target;
            if (!container) return;

            options = options || {};
            media = media || { type: 'none' };

            // Clear previous media
            this.destroy(container);

            const type = (media.type || 'none').toLowerCase();
            const src = (media.src || media.url || '').trim();

            if (type === 'none' || !src) {
                container.style.display = 'none';
                container.innerHTML = '';
                return;
            }

            container.style.display = '';
            container.classList.add('media-rendered-container');

            switch (type) {
                case 'image':
                    this.renderImage(container, src, media.caption, options);
                    break;
                case 'audio':
                    this.renderAudio(container, src, media, options);
                    break;
                case 'video':
                    this.renderVideo(container, src, media, options);
                    break;
                case 'youtube':
                    this.renderYouTube(container, src, media, options);
                    break;
                default:
                    container.style.display = 'none';
                    break;
            }
        },

        /**
         * Render Image with zoom and caption
         */
        renderImage: function (container, src, caption, options) {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-image-wrapper';

            const img = document.createElement('img');
            img.src = src;
            img.alt = caption || 'Quiz Visual Asset';
            img.className = 'media-responsive-image';
            img.loading = 'eager';

            img.onerror = function () {
                wrapper.innerHTML = `<div class="media-error-placeholder"><span class="media-error-icon">🖼️</span><span>Unable to load image: ${src}</span></div>`;
            };

            wrapper.appendChild(img);

            if (caption) {
                const cap = document.createElement('div');
                cap.className = 'media-caption';
                cap.textContent = caption;
                wrapper.appendChild(cap);
            }

            container.appendChild(wrapper);
        },

        /**
         * Render Audio with waveform visualizer
         */
        renderAudio: function (container, src, media, options) {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-audio-wrapper';

            const audioEl = document.createElement('audio');
            audioEl.src = src;
            audioEl.preload = 'auto';
            if (media.autoPlay) audioEl.autoplay = true;

            const visualizerBox = document.createElement('div');
            visualizerBox.className = 'audio-visualizer-box';
            visualizerBox.innerHTML = `
                <div class="audio-sound-waves">
                    <span class="bar"></span><span class="bar"></span><span class="bar"></span>
                    <span class="bar"></span><span class="bar"></span><span class="bar"></span>
                    <span class="bar"></span><span class="bar"></span><span class="bar"></span>
                </div>
                <div class="audio-track-info">
                    <div class="audio-track-title">${media.caption || 'Acoustic Sound / Audio Cue'}</div>
                    <div class="audio-track-status">Ready to Play</div>
                </div>
            `;

            const controlsBox = document.createElement('div');
            controlsBox.className = 'audio-player-controls';

            const playBtn = document.createElement('button');
            playBtn.className = 'media-btn media-btn-play';
            playBtn.type = 'button';
            playBtn.innerHTML = '▶ Play';

            const restartBtn = document.createElement('button');
            restartBtn.className = 'media-btn media-btn-restart';
            restartBtn.type = 'button';
            restartBtn.innerHTML = '↺ Replay';

            controlsBox.appendChild(playBtn);
            controlsBox.appendChild(restartBtn);

            const statusText = visualizerBox.querySelector('.audio-track-status');
            const waveBox = visualizerBox.querySelector('.audio-sound-waves');

            playBtn.onclick = function () {
                if (audioEl.paused) {
                    audioEl.play().then(() => {
                        playBtn.innerHTML = '⏸ Pause';
                        statusText.textContent = 'Playing...';
                        waveBox.classList.add('playing');
                    }).catch(err => {
                        statusText.textContent = 'Autoplay blocked. Click play.';
                    });
                } else {
                    audioEl.pause();
                    playBtn.innerHTML = '▶ Play';
                    statusText.textContent = 'Paused';
                    waveBox.classList.remove('playing');
                }
            };

            restartBtn.onclick = function () {
                audioEl.currentTime = 0;
                audioEl.play().then(() => {
                    playBtn.innerHTML = '⏸ Pause';
                    statusText.textContent = 'Playing...';
                    waveBox.classList.add('playing');
                });
            };

            audioEl.onended = function () {
                playBtn.innerHTML = '▶ Play';
                statusText.textContent = 'Finished';
                waveBox.classList.remove('playing');
            };

            wrapper.appendChild(audioEl);
            wrapper.appendChild(visualizerBox);
            wrapper.appendChild(controlsBox);
            container.appendChild(wrapper);

            container._activeAudio = audioEl;
        },

        /**
         * Render Local Video (HTML5 MP4/WebM)
         */
        renderVideo: function (container, src, media, options) {
            const wrapper = document.createElement('div');
            wrapper.className = 'media-video-wrapper';

            const videoEl = document.createElement('video');
            videoEl.src = src;
            videoEl.className = 'media-responsive-video';
            videoEl.controls = true;
            videoEl.playsInline = true;
            videoEl.preload = 'auto';

            if (media.start) {
                videoEl.currentTime = this.parseTimestamp(media.start);
            }
            if (media.autoPlay) {
                videoEl.autoplay = true;
                if (!options.isQMView) videoEl.muted = false;
            }

            if (media.end) {
                const endTime = this.parseTimestamp(media.end);
                videoEl.ontimeupdate = function () {
                    if (videoEl.currentTime >= endTime) {
                        videoEl.pause();
                    }
                };
            }

            wrapper.appendChild(videoEl);

            if (media.caption) {
                const cap = document.createElement('div');
                cap.className = 'media-caption';
                cap.textContent = media.caption;
                wrapper.appendChild(cap);
            }

            container.appendChild(wrapper);
            container._activeVideo = videoEl;
        },

        /**
         * Render YouTube Embed
         */
        renderYouTube: function (container, src, media, options) {
            const ytId = this.extractYouTubeId(src);
            if (!ytId) {
                container.innerHTML = `<div class="media-error-placeholder">Invalid YouTube URL or ID: ${src}</div>`;
                return;
            }

            const startSec = this.parseTimestamp(media.start);
            const endSec = this.parseTimestamp(media.end);

            let embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1`;
            if (startSec > 0) embedUrl += `&start=${startSec}`;
            if (endSec > 0) embedUrl += `&end=${endSec}`;
            if (media.autoPlay) embedUrl += '&autoplay=1';

            const wrapper = document.createElement('div');
            wrapper.className = 'media-youtube-wrapper responsive-video-container';

            const iframe = document.createElement('iframe');
            iframe.src = embedUrl;
            iframe.title = media.caption || 'YouTube Quiz Video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.className = 'media-youtube-iframe';

            wrapper.appendChild(iframe);

            if (media.caption) {
                const cap = document.createElement('div');
                cap.className = 'media-caption';
                cap.textContent = media.caption;
                wrapper.appendChild(cap);
            }

            container.appendChild(wrapper);
        },

        /**
         * Pause or stop all playing media in container
         */
        destroy: function (container) {
            if (!container) return;
            if (container._activeAudio) {
                try {
                    container._activeAudio.pause();
                    container._activeAudio.src = '';
                } catch (e) {}
                container._activeAudio = null;
            }
            if (container._activeVideo) {
                try {
                    container._activeVideo.pause();
                    container._activeVideo.src = '';
                } catch (e) {}
                container._activeVideo = null;
            }
            container.innerHTML = '';
        }
    };

    window.MediaPlayer = MediaPlayer;
})(typeof window !== 'undefined' ? window : this);
