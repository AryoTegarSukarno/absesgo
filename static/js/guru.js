      // ========================================
      // FUNGSI GENERATE QR TOKEN
      // ========================================
      document
        .getElementById('btn-generate')
        .addEventListener('click', async function () {
          const btn = this;
          const qrArea = document.getElementById('qr-area');

          btn.disabled = true;
          btn.innerHTML = '<span class="loading-icon">⏳</span> Generating...';

          try {
            const response = await fetch('/guru/generate_token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('QR Response:', data);

            if (data.status === 'success') {
              let waktu = data.expires_in || 300;

              qrArea.innerHTML = `
                <div style="text-align: center;">
                    <p style="color: var(--success); font-weight: 600; margin-bottom: 1rem;">
                        ✅ Token berhasil digenerate!
                    </p>
                    <p>Token valid: <span id="countdown" style="color: var(--primary); font-weight: 700; font-size: 1.2rem;">${waktu}</span> detik</p>
                    <img src="${data.qr_url}" alt="QR Code Absensi" style="margin: 1rem auto;">
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
                        Scan QR code ini untuk absensi
                    </p>
                </div>
            `;

              startCountdown(waktu, qrArea);
            } else {
              throw new Error(data.message || 'Gagal generate token');
            }
          } catch (error) {
            console.error('Error generating QR:', error);
            qrArea.innerHTML = `
            <div style="text-align: center; color: var(--danger);">
                <p style="font-weight: 600;">❌ Gagal generate token</p>
                <p style="font-size: 0.9rem;">${error.message}</p>
            </div>
        `;
          } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>🔐</span> Generate QR Token (5 menit)';
          }
        });

      // ========================================
      // FUNGSI COUNTDOWN TIMER
      // ========================================
      function startCountdown(duration, qrArea) {
        let timer = duration;
        const countdownElement = document.getElementById('countdown');

        const countdownInterval = setInterval(() => {
          countdownElement.textContent = timer;

          if (timer <= 60) {
            countdownElement.style.color = 'var(--danger)';
          } else if (timer <= 120) {
            countdownElement.style.color = 'var(--warning)';
          }

          if (timer <= 0) {
            clearInterval(countdownInterval);
            qrArea.innerHTML = `
                <div style="text-align: center;">
                    <p style="color: var(--danger); font-weight: 600;">❌ Token sudah kedaluwarsa</p>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                        Klik tombol "Generate QR Token" untuk membuat token baru
                    </p>
                </div>
            `;
          }

          timer--;
        }, 1000);

        return countdownInterval;
      }

      // ========================================
      // AUTO-REFRESH TOKEN
      // ========================================
      function setupAutoRefresh() {
        setInterval(() => {
          const qrArea = document.getElementById('qr-area');
          const hasActiveToken = qrArea.querySelector('img') !== null;

          if (hasActiveToken) {
            console.log('🔄 Auto-refreshing QR token...');
            document.getElementById('btn-generate').click();
          }
        }, 300000);
      }

      // ========================================
      // FUNGSI FORMAT WAKTU
      // ========================================
      function formatDate(dateInput) {
        if (!dateInput) return '-';
        if (
          typeof dateInput === 'string' &&
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateInput)
        ) {
          return dateInput;
        }
        try {
          const d = new Date(dateInput);
          if (isNaN(d)) return String(dateInput);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            '0'
          )}-${String(d.getDate()).padStart(2, '0')} ${String(
            d.getHours()
          ).padStart(2, '0')}:${String(d.getMinutes()).padStart(
            2,
            '0'
          )}:${String(d.getSeconds()).padStart(2, '0')}`;
        } catch (e) {
          return String(dateInput);
        }
      }

      // ========================================
      // Alert Function
      // ========================================
      function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
        const icon = type === 'success' ? '✅' : '❌';

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${alertClass}`;
        alertDiv.innerHTML = `
          <span>${icon}</span>
          <span>${message}</span>
      `;

        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
          if (alertDiv.parentNode) {
            alertDiv.remove();
          }
        }, 5000);
      }

      // ========================================
      // Refresh Absensi
      // ========================================
      function updateLastRefreshTime() {
        const now = new Date();
        const timeString = formatDate(now);
        document.getElementById('lastUpdateTime').textContent =
          `Terakhir diupdate: ${timeString}`;
      }

      function refreshAbsensi() {
        const btn = document.getElementById('btn-refresh-absensi');
        const container = document.getElementById('absensiTableContainer');
        const tbody = document.getElementById('absensiTableBody');

        btn.disabled = true;
        btn.innerHTML = '<span class="loading-icon">⏳</span> Loading...';
        container.classList.add('updating');

        fetch('/api/absensi', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              tbody.innerHTML = '';

              if (data.data.length === 0) {
                tbody.innerHTML = `
              <tr>
                <td colspan="5">
                  <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>Belum ada data absensi</p>
                  </div>
                </td>
              </tr>
            `;
              } else {
                data.data.forEach((absen) => {
                  const formattedTime = formatDate(absen.waktu_absen);
                  const row = `
                <tr>
                  <td>${absen.nis || '-'}</td>
                  <td>${absen.nama_siswa || '-'}</td>
                  <td>${absen.kelas || '-'}</td>
                  <td>${absen.jurusan || '-'}</td>
                  <td>${formattedTime}</td>
                </tr>
              `;
                  tbody.innerHTML += row;
                });
              }

              updateLastRefreshTime();
              showAlert('Data absensi berhasil dimuat ulang', 'success');
            } else {
              showAlert(
                'Gagal memuat data absensi: ' + (data.message || 'unknown'),
                'error'
              );
            }
          })
          .catch((error) => {
            console.error('Error:', error);
            showAlert('Error: Tidak dapat terhubung ke server', 'error');
          })
          .finally(() => {
            btn.disabled = false;
            btn.innerHTML = '<span class="refresh-icon">🔄</span> Refresh Data';
            container.classList.remove('updating');
          });
      }

      // ========================================
      // Export Excel
      // ========================================
      function exportExcel() {
        window.location.href = '/api/export_absensi';
      }

      // ========================================
      // CRUD Siswa Functions
      // ========================================
      function loadSiswaData() {
        fetch('/api/siswa')
          .then((response) => response.json())
          .then((data) => {
            const tbody = document.getElementById('siswaTableBody');
            if (data.success) {
              if (data.data.length === 0) {
                tbody.innerHTML = `
                            <tr>
                                <td colspan="7">
                                    <div class="empty-state">
                                        <div class="empty-state-icon">👥</div>
                                        <p>Belum ada data siswa</p>
                                    </div>
                                </td>
                            </tr>
                        `;
              } else {
                tbody.innerHTML = '';
                data.data.forEach((siswa) => {
                  const row = `
                                <tr>
                                    <td>${siswa.id_siswa}</td>
                                    <td>${siswa.username}</td>
                                    <td>${siswa.nis}</td>
                                    <td>${siswa.nama_siswa}</td>
                                    <td>${siswa.jurusan || '-'}</td>
                                    <td>${siswa.kelas || '-'}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-warning" onclick="editSiswa(${
                                              siswa.id_siswa
                                            })">
                                                <span>✏️</span> Edit
                                            </button>
                                            <button class="btn btn-danger" onclick="deleteSiswa(${
                                              siswa.id_siswa
                                            })">
                                                <span>🗑️</span> Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                  tbody.innerHTML += row;
                });
              }
            } else {
              showAlert('Gagal memuat data siswa: ' + data.message, 'error');
            }
          })
          .catch((error) => {
            console.error('Error:', error);
            showAlert('Error memuat data siswa', 'error');
          });
      }

      function openModal(type, id = null) {
        const modal = document.getElementById('siswaModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('siswaForm');

        if (type === 'add') {
          title.textContent = 'Tambah Siswa';
          form.reset();
          document.getElementById('siswaId').value = '';
        } else {
          title.textContent = 'Edit Siswa';
          fetch(`/api/siswa/${id}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                document.getElementById('siswaId').value = data.data.id_siswa;
                document.getElementById('username').value = data.data.username;
                document.getElementById('password').value = data.data.password;
                document.getElementById('nis').value = data.data.nis;
                document.getElementById('nama_siswa').value =
                  data.data.nama_siswa;
                document.getElementById('jurusan').value =
                  data.data.jurusan || '';
                document.getElementById('kelas').value = data.data.kelas || '';
              }
            });
        }

        modal.style.display = 'block';
      }

      function closeModal() {
        document.getElementById('siswaModal').style.display = 'none';
      }

      function editSiswa(id) {
        openModal('edit', id);
      }

      function deleteSiswa(id) {
        if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
          fetch(`/api/siswa/${id}`, { method: 'DELETE' })
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                showAlert('Siswa berhasil dihapus', 'success');
                loadSiswaData();
              } else {
                showAlert('Gagal menghapus siswa: ' + data.message, 'error');
              }
            })
            .catch((error) => {
              console.error('Error:', error);
              showAlert('Error menghapus siswa', 'error');
            });
        }
      }

      // Handle form submission
      document
        .getElementById('siswaForm')
        .addEventListener('submit', function (e) {
          e.preventDefault();

          const id = document.getElementById('siswaId').value;
          const method = id ? 'PUT' : 'POST';
          const url = id ? `/api/siswa/${id}` : '/api/siswa';

          const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            nis: document.getElementById('nis').value,
            nama_siswa: document.getElementById('nama_siswa').value,
            jurusan: document.getElementById('jurusan').value,
            kelas: document.getElementById('kelas').value,
          };

          fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                showAlert(data.message, 'success');
                closeModal();
                loadSiswaData();
              } else {
                showAlert(data.message, 'error');
              }
            })
            .catch((error) => {
              console.error('Error:', error);
              showAlert('Error menyimpan data', 'error');
            });
        });

      // ========================================
      // Event Listeners
      // ========================================
      document.addEventListener('DOMContentLoaded', function () {
        console.log('🚀 Initializing dashboard...');

        // Event listener untuk tombol export excel
        const btnExportExcel = document.getElementById('btnExportExcel');
        if (btnExportExcel) {
          btnExportExcel.addEventListener('click', exportExcel);
          console.log('✅ Export button event listener added');
        }

        // Event listener untuk tombol refresh
        const btnRefresh = document.getElementById('btn-refresh-absensi');
        if (btnRefresh) {
          btnRefresh.addEventListener('click', refreshAbsensi);
          console.log('✅ Refresh button event listener added');
        }

        // Muat data siswa saat halaman dimuat
        loadSiswaData();

        // Muat data absensi saat halaman dimuat
        refreshAbsensi();

        // Inisialisasi waktu update
        updateLastRefreshTime();

        // Setup auto-refresh untuk QR token
        setupAutoRefresh();

        console.log('✅ Dashboard initialized successfully');
      });

      // Close modal when clicking outside
      window.onclick = function (event) {
        const modal = document.getElementById('siswaModal');
        if (event.target == modal) {
          closeModal();
        }
      };
