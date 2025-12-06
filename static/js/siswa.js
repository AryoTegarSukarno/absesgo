      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const statusEl = document.getElementById('status');
      let currentStream = null;
      let usingFrontCamera = false;

      function stopCamera() {
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
          currentStream = null;
        }
      }

      function startCamera(facingMode = 'environment') {
        stopCamera();

        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
          .then((stream) => {
            video.srcObject = stream;
            currentStream = stream;
            usingFrontCamera = facingMode === 'user';
            video.setAttribute('playsinline', true);
            statusEl.textContent = 'Status: menunggu scan...';
            statusEl.style.color = 'var(--primary)';
          })
          .catch((err) => {
            statusEl.textContent = 'Gagal akses kamera: ' + err.message;
            statusEl.style.color = 'red';
          });
      }

      function switchCamera() {
        const newFacingMode = usingFrontCamera ? 'environment' : 'user';
        startCamera(newFacingMode);
      }

      function scanLoop() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, canvas.width, canvas.height);
          if (code) {
            statusEl.textContent =
              'Token ditemukan: ' + code.data.slice(0, 20) + '...';
            fetch('/scan_token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: code.data }),
            })
              .then((r) => r.json())
              .then((j) => {
                statusEl.textContent = j.message || JSON.stringify(j);
                statusEl.style.color = j.status === 'success' ? 'green' : 'red';

                if (j.status === 'success') {
                  // Refresh data absensi setelah scan berhasil
                  setTimeout(() => {
                    document.getElementById('btn-refresh-absensi').click();
                  }, 1500);
                }
              })
              .catch((e) => {
                statusEl.textContent = 'Error kirim token: ' + e;
                statusEl.style.color = 'red';
              });

            setTimeout(() => {
              statusEl.textContent = 'Menunggu scan...';
              statusEl.style.color = 'var(--primary)';
            }, 3000);
          }
        }
        requestAnimationFrame(scanLoop);
      }

      document
        .getElementById('btn-refresh-absensi')
        .addEventListener('click', () => {
          location.reload();
        });

      document
        .getElementById('btn-switch-camera')
        .addEventListener('click', switchCamera);
      // Inisialisasi halaman
      startCamera();
      requestAnimationFrame(scanLoop);
