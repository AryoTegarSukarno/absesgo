/* ========================================
   SISWA DASHBOARD CLASS
   ======================================== */

class SiswaDashboard {
  /**
   * Constructor - Initialize camera and canvas
   */
  constructor() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.statusEl = document.getElementById('status');
    this.currentStream = null;
    this.usingFrontCamera = false;
    this.scanLoopRunning = false;
  }

  /**
   * Initialize dashboard
   */
  init() {
    console.log('🚀 Initializing Siswa Dashboard...');
    this.bindEvents();
    this.startCamera();
    this.startScanLoop();
    console.log('✅ Siswa Dashboard initialized successfully');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Switch camera button
    const btnSwitchCamera = document.getElementById('btn-switch-camera');
    if (btnSwitchCamera) {
      btnSwitchCamera.addEventListener('click', () => this.switchCamera());
    }

    // Refresh absensi button
    const btnRefresh = document.getElementById('btn-refresh-absensi');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.refreshAbsensi());
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
  }

  /**
   * Start camera with facing mode
   */
  startCamera(facingMode = 'environment') {
    this.stopCamera();

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      .then((stream) => {
        this.video.srcObject = stream;
        this.currentStream = stream;
        this.usingFrontCamera = facingMode === 'user';
        this.video.setAttribute('playsinline', true);
        this.updateStatus('Status: menunggu scan...', 'var(--primary)');
      })
      .catch((err) => {
        this.updateStatus('Gagal akses kamera: ' + err.message, 'red');
      });
  }

  /**
   * Switch camera between front and back
   */
  switchCamera() {
    const newFacingMode = this.usingFrontCamera ? 'environment' : 'user';
    this.startCamera(newFacingMode);
  }

  /**
   * Start QR scanning loop
   */
  startScanLoop() {
    if (this.scanLoopRunning) return;
    this.scanLoopRunning = true;
    this.scanLoop();
  }

  /**
   * Continuous scanning loop with jsQR
   */
  scanLoop() {
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.ctx.drawImage(
        this.video,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      const imageData = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      const code = jsQR(imageData.data, this.canvas.width, this.canvas.height);

      if (code) {
        this.handleQRCode(code.data);
      }
    }

    if (this.scanLoopRunning) {
      requestAnimationFrame(() => this.scanLoop());
    }
  }

  /**
   * Handle scanned QR code
   */
  async handleQRCode(token) {
    this.updateStatus(
      'Token ditemukan: ' + token.slice(0, 20) + '...',
      'var(--primary)'
    );

    try {
      const data = await apiRequest('/scan_token', {
        method: 'POST',
        body: JSON.stringify({ token: token }),
      });

      const message = data.message || JSON.stringify(data);
      const color = data.status === 'success' ? 'green' : 'red';
      this.updateStatus(message, color);

      if (data.status === 'success') {
        // Refresh data absensi setelah scan berhasil
        setTimeout(() => {
          const btnRefresh = document.getElementById('btn-refresh-absensi');
          if (btnRefresh) {
            btnRefresh.click();
          }
        }, 1500);
      }
    } catch (error) {
      this.updateStatus('Error kirim token: ' + error, 'red');
    }

    // Reset status after 3 seconds
    setTimeout(() => {
      this.updateStatus('Menunggu scan...', 'var(--primary)');
    }, 3000);
  }

  /**
   * Update status message
   */
  updateStatus(text, color) {
    if (this.statusEl) {
      this.statusEl.textContent = text;
      this.statusEl.style.color = color;
    }
  }

  /**
   * Refresh absensi data (reload page)
   */
  refreshAbsensi() {
    location.reload();
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.scanLoopRunning = false;
    this.stopCamera();
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  window.dashboard = new SiswaDashboard();
  window.dashboard.init();
});
