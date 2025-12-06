/* ========================================
   GURU DASHBOARD CLASS
   ======================================== */

class GuruDashboard {
  /**
   * Constructor - Initialize properties
   */
  constructor() {
    this.countdownInterval = null;
    this.autoRefreshInterval = null;
  }

  /**
   * Initialize dashboard
   */
  init() {
    console.log('🚀 Initializing Guru Dashboard...');
    this.bindEvents();
    this.loadInitialData();
    this.setupAutoRefresh();
    console.log('✅ Guru Dashboard initialized successfully');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Generate QR Token button
    const btnGenerate = document.getElementById('btn-generate');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', () => this.generateQRToken());
    }

    // Refresh Absensi button
    const btnRefresh = document.getElementById('btn-refresh-absensi');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.refreshAbsensi());
    }

    // Export Excel button
    const btnExport = document.getElementById('btnExportExcel');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportExcel());
    }

    // Siswa Form submission
    const siswaForm = document.getElementById('siswaForm');
    if (siswaForm) {
      siswaForm.addEventListener('submit', (e) =>
        this.handleSiswaFormSubmit(e)
      );
    }

    // Close modal when clicking outside
    window.onclick = (event) => {
      const modal = document.getElementById('siswaModal');
      if (event.target === modal) {
        this.closeModal();
      }
    };
  }

  /**
   * Load initial data on page load
   */
  loadInitialData() {
    this.refreshAbsensi();
    this.loadSiswaData();
    this.updateLastRefreshTime();
  }

  /**
   * Generate QR Token
   */
  async generateQRToken() {
    const btn = document.getElementById('btn-generate');
    const qrArea = document.getElementById('qr-area');

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-icon">⏳</span> Generating...';

    try {
      const data = await apiRequest('/guru/generate_token', {
        method: 'POST',
      });

      console.log('QR Response:', data);

      if (data.status === 'success') {
        const waktu = data.expires_in || 300;
        this.displayQRCode(data, qrArea, waktu);
        this.startCountdown(waktu, qrArea);
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
  }

  /**
   * Display QR Code with countdown
   */
  displayQRCode(data, qrArea, waktu) {
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
  }

  /**
   * Start countdown timer
   */
  startCountdown(duration, qrArea) {
    // Clear existing interval if any
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    let timer = duration;
    const countdownElement = document.getElementById('countdown');

    this.countdownInterval = setInterval(() => {
      if (!countdownElement) {
        clearInterval(this.countdownInterval);
        return;
      }

      countdownElement.textContent = timer;

      if (timer <= 60) {
        countdownElement.style.color = 'var(--danger)';
      } else if (timer <= 120) {
        countdownElement.style.color = 'var(--warning)';
      }

      if (timer <= 0) {
        clearInterval(this.countdownInterval);
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

    return this.countdownInterval;
  }

  /**
   * Refresh absensi data
   */
  async refreshAbsensi() {
    const btn = document.getElementById('btn-refresh-absensi');
    const container = document.getElementById('absensiTableContainer');
    const tbody = document.getElementById('absensiTableBody');

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-icon">⏳</span> Loading...';
    container.classList.add('updating');

    try {
      const data = await apiRequest('/api/absensi', { method: 'GET' });

      if (data.success) {
        this.renderAbsensiTable(tbody, data.data);
        this.updateLastRefreshTime();
        showAlert('Data absensi berhasil dimuat ulang', 'success');
      } else {
        showAlert(
          'Gagal memuat data absensi: ' + (data.message || 'unknown'),
          'error'
        );
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error: Tidak dapat terhubung ke server', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="refresh-icon">🔄</span> Refresh Data';
      container.classList.remove('updating');
    }
  }

  /**
   * Render absensi table
   */
  renderAbsensiTable(tbody, data) {
    tbody.innerHTML = '';

    if (data.length === 0) {
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
      data.forEach((absen) => {
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
  }

  /**
   * Update last refresh time
   */
  updateLastRefreshTime() {
    const now = new Date();
    const timeString = formatDate(now);
    const element = document.getElementById('lastUpdateTime');
    if (element) {
      element.textContent = `Terakhir diupdate: ${timeString}`;
    }
  }

  /**
   * Export Excel
   */
  exportExcel() {
    window.location.href = '/api/export_absensi';
  }

  /**
   * Load siswa data
   */
  async loadSiswaData() {
    try {
      const data = await apiRequest('/api/siswa');
      const tbody = document.getElementById('siswaTableBody');

      if (data.success) {
        this.renderSiswaTable(tbody, data.data);
      } else {
        showAlert('Gagal memuat data siswa: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error memuat data siswa', 'error');
    }
  }

  /**
   * Render siswa table
   */
  renderSiswaTable(tbody, data) {
    if (data.length === 0) {
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
      data.forEach((siswa) => {
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
                <button class="btn btn-warning" onclick="dashboard.editSiswa(${siswa.id_siswa})">
                  <span>✏️</span> Edit
                </button>
                <button class="btn btn-danger" onclick="dashboard.deleteSiswa(${siswa.id_siswa})">
                  <span>🗑️</span> Hapus
                </button>
              </div>
            </td>
          </tr>
        `;
        tbody.innerHTML += row;
      });
    }
  }

  /**
   * Handle siswa form submission
   */
  async handleSiswaFormSubmit(e) {
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

    try {
      const data = await apiRequest(url, {
        method: method,
        body: JSON.stringify(formData),
      });

      if (data.success) {
        showAlert(data.message, 'success');
        this.closeModal();
        this.loadSiswaData();
      } else {
        showAlert(data.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error menyimpan data', 'error');
    }
  }

  /**
   * Open modal for add/edit
   */
  async openModal(type, id = null) {
    const modal = document.getElementById('siswaModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('siswaForm');

    if (type === 'add') {
      title.textContent = 'Tambah Siswa';
      form.reset();
      document.getElementById('siswaId').value = '';
    } else {
      title.textContent = 'Edit Siswa';
      await this.loadSiswaForEdit(id);
    }

    modal.style.display = 'block';
  }

  /**
   * Load siswa data for editing
   */
  async loadSiswaForEdit(id) {
    try {
      const data = await apiRequest(`/api/siswa/${id}`);

      if (data.success) {
        document.getElementById('siswaId').value = data.data.id_siswa;
        document.getElementById('username').value = data.data.username;
        document.getElementById('password').value = data.data.password;
        document.getElementById('nis').value = data.data.nis;
        document.getElementById('nama_siswa').value = data.data.nama_siswa;
        document.getElementById('jurusan').value = data.data.jurusan || '';
        document.getElementById('kelas').value = data.data.kelas || '';
      }
    } catch (error) {
      console.error('Error loading siswa:', error);
      showAlert('Error memuat data siswa', 'error');
    }
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('siswaModal');
    modal.style.display = 'none';
  }

  /**
   * Edit siswa
   */
  editSiswa(id) {
    this.openModal('edit', id);
  }

  /**
   * Delete siswa
   */
  async deleteSiswa(id) {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
      try {
        const data = await apiRequest(`/api/siswa/${id}`, {
          method: 'DELETE',
        });

        if (data.success) {
          showAlert('Siswa berhasil dihapus', 'success');
          this.loadSiswaData();
        } else {
          showAlert('Gagal menghapus siswa: ' + data.message, 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlert('Error menghapus siswa', 'error');
      }
    }
  }

  /**
   * Setup auto-refresh for QR token
   */
  setupAutoRefresh() {
    this.autoRefreshInterval = setInterval(() => {
      const qrArea = document.getElementById('qr-area');
      const hasActiveToken = qrArea && qrArea.querySelector('img') !== null;

      if (hasActiveToken) {
        console.log('🔄 Auto-refreshing QR token...');
        document.getElementById('btn-generate').click();
      }
    }, 300000); // 5 minutes
  }

  /**
   * Cleanup intervals
   */
  destroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }
}

// Global functions for onclick handlers
function openModal(type, id) {
  if (window.dashboard) {
    window.dashboard.openModal(type, id);
  }
}

function closeModal() {
  if (window.dashboard) {
    window.dashboard.closeModal();
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  window.dashboard = new GuruDashboard();
  window.dashboard.init();
});
