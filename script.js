document.addEventListener('DOMContentLoaded', () => {
    const { jsPDF } = window.jspdf;

    // ===== SELEKSI ELEMEN DARI HTML =====
    const formKalkulator = document.getElementById('form-kalkulator');
    const inputBeratKarung = document.getElementById('berat-karung');
    const daftarTimbanganList = document.getElementById('daftar-timbangan');
    const jumlahKarungSementaraEl = document.getElementById('jumlah-karung-sementara');
    const totalBeratSementaraEl = document.getElementById('total-berat-sementara');
    const btnResetKalkulator = document.getElementById('btn-reset-kalkulator');
    const formFinal = document.getElementById('form-final');
    const jumlahKarungFinalInput = document.getElementById('jumlahKarungFinal');
    const beratFinalInput = document.getElementById('beratFinal');
    const teleponInput = document.getElementById('telepon');
    const tableBody = document.getElementById('data-tabel-body');
    const filterTanggalInput = document.getElementById('filter-tanggal');
    const btnResetFilter = document.getElementById('btn-reset-filter');
    const btnExportExcelAll = document.getElementById('btn-export-excel-all');
    const btnExportPdfAll = document.getElementById('btn-export-pdf-all');
    const pilihPetaniSelect = document.getElementById('pilih-petani');
    const btnExportPetani = document.getElementById('btn-export-petani');
    const pilihTanggalInput = document.getElementById('pilih-tanggal');
    const btnExportHarian = document.getElementById('btn-export-harian');
    const totalBeratHariIniEl = document.getElementById('total-berat-hari-ini');
    const jumlahDataEl = document.getElementById('jumlah-data');
    const btnResetSemuaData = document.getElementById('btn-reset-semua-data'); // BARU

    let timbanganSementara = [];
    let dataPanenPermanen = JSON.parse(localStorage.getItem('dataPanen')) || [];

    const simpanDataPermanen = () => {
        localStorage.setItem('dataPanen', JSON.stringify(dataPanenPermanen));
    };

    const updateTampilanKalkulator = () => {
        daftarTimbanganList.innerHTML = '';
        if (timbanganSementara.length === 0) {
            daftarTimbanganList.innerHTML = '<li>Belum ada data</li>';
        } else {
            timbanganSementara.forEach((berat, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>Karung ${index + 1}: ${berat} kg</span><button class="btn-hapus-item" data-index="${index}">Hapus</button>`;
                daftarTimbanganList.appendChild(li);
            });
        }
        const totalBerat = timbanganSementara.reduce((total, berat) => total + berat, 0);
        const jumlahKarung = timbanganSementara.length;
        jumlahKarungSementaraEl.textContent = jumlahKarung;
        totalBeratSementaraEl.textContent = `${totalBerat.toFixed(2)} kg`;
        jumlahKarungFinalInput.value = jumlahKarung;
        beratFinalInput.value = totalBerat.toFixed(2);
    };

    const renderTabelRiwayat = (data) => {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Belum ada data riwayat</td></tr>`;
            return;
        }
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.tanggal}</td><td>${item.petani}</td><td>${item.telepon || '-'}</td>
                <td>${item.jenisPadi}</td><td>${item.jumlahKarung}</td><td>${item.berat}</td>
                <td>${item.catatan}</td><td><button class="btn-delete" data-id="${item.id}">Hapus</button></td>`;
            tableBody.appendChild(row);
        });
    };
    
    const updateDashboard = () => {
        const today = new Date().toISOString().slice(0, 10);
        const dataHariIni = dataPanenPermanen.filter(item => item.tanggal === today);
        const totalBeratHariIni = dataHariIni.reduce((total, item) => total + parseFloat(item.berat), 0);
        totalBeratHariIniEl.textContent = `${totalBeratHariIni.toFixed(2)} kg`;
        jumlahDataEl.textContent = dataPanenPermanen.length;
    };
    
    const populateFarmerDropdown = () => {
        const namaPetani = [...new Set(dataPanenPermanen.map(item => item.petani))];
        pilihPetaniSelect.innerHTML = '<option value="">-- Pilih Nama Petani --</option>';
        namaPetani.sort().forEach(nama => {
            const option = document.createElement('option');
            option.value = nama;
            option.textContent = nama;
            pilihPetaniSelect.appendChild(option);
        });
    };

    const generateIndividualExcel = (data) => {
        const worksheetData = [];
        data.rincianBerat.forEach((berat, index) => {
            worksheetData.push([`karung ${index + 1}`, berat]);
        });
        worksheetData.push([]);
        worksheetData.push(['total', parseFloat(data.berat)]);
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Rincian Timbangan");
        worksheet["!cols"] = [{ wch: 15 }, { wch: 15 }];
        const filename = `Timbangan_${data.petani.replace(/\s+/g, '_')}_${data.tanggal}.xlsx`;
        XLSX.writeFile(workbook, filename);
    };

    const generateCSV = (data, filename) => {
        if (data.length === 0) {
            alert('Tidak ada data yang sesuai untuk diekspor!');
            return;
        }
        const header = ["Tanggal", "Nama Petani", "No. Telepon", "Jenis Padi", "Jumlah Karung", "Total Berat (kg)", "Rincian Timbangan", "Catatan"];
        const rows = data.map(row => {
            const rincian = (row.rincianBerat && row.rincianBerat.length > 0)
                ? row.rincianBerat.map((berat, index) => `Karung ${index + 1}: ${berat}kg`).join('; ') : '-';
            return [row.tanggal, row.petani, row.telepon || '-', row.jenisPadi, row.jumlahKarung, row.berat, `"${rincian}"`, `"${(row.catatan || '').replace(/"/g, '""')}"`].join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + header.join(',') + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const eksporKePDF = () => {
        if (dataPanenPermanen.length === 0) { alert('Tidak ada data untuk diekspor!'); return; }
        const doc = new jsPDF();
        doc.text("Laporan Rekap Hasil Panen Padi", 14, 16);
        const head = [['Tanggal', 'Petani', 'No. Telp', 'Jenis Padi', 'Jml Karung', 'Berat (kg)']];
        const body = dataPanenPermanen.map(row => {
            return [
                row.tanggal, row.petani, row.telepon || '-', row.jenisPadi,
                row.jumlahKarung, row.berat
            ];
        });
        doc.autoTable({ head, body, startY: 20, headStyles: { fillColor: [44, 94, 45] } });
        doc.save(`laporan_rekap_panen_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    // ===== EVENT LISTENERS =====
    formKalkulator.addEventListener('submit', (e) => {
        e.preventDefault();
        const berat = parseFloat(inputBeratKarung.value);
        if (!isNaN(berat) && berat > 0) {
            timbanganSementara.push(berat);
            updateTampilanKalkulator();
            formKalkulator.reset();
            inputBeratKarung.focus();
        }
    });

    btnResetKalkulator.addEventListener('click', () => {
        if (confirm('Anda yakin ingin mengosongkan semua daftar timbangan ini?')) {
            timbanganSementara = [];
            updateTampilanKalkulator();
        }
    });

    daftarTimbanganList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-hapus-item')) {
            const indexToDelete = parseInt(e.target.getAttribute('data-index'));
            timbanganSementara.splice(indexToDelete, 1);
            updateTampilanKalkulator();
        }
    });

    formFinal.addEventListener('submit', (e) => {
        e.preventDefault();
        const jumlahKarung = parseInt(jumlahKarungFinalInput.value);
        if (jumlahKarung === 0) { alert('Tidak ada data timbangan untuk disimpan.'); return; }
        const newData = {
            id: Date.now(), tanggal: document.getElementById('tanggal').value, petani: document.getElementById('petani').value,
            telepon: teleponInput.value, jenisPadi: document.getElementById('jenisPadi').value, jumlahKarung: jumlahKarung,
            berat: beratFinalInput.value, catatan: document.getElementById('catatan').value, rincianBerat: [...timbanganSementara] 
        };
        dataPanenPermanen.push(newData);
        simpanDataPermanen();
        renderTabelRiwayat(dataPanenPermanen);
        updateDashboard();
        populateFarmerDropdown();
        generateIndividualExcel(newData);
        formFinal.reset();
        timbanganSementara = [];
        updateTampilanKalkulator();
        document.getElementById('tanggal').valueAsDate = new Date();
        alert('Data panen berhasil disimpan & Nota Excel telah diunduh!');
    });

    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const idToDelete = parseInt(e.target.getAttribute('data-id'));
            if (confirm('Apakah Anda yakin ingin menghapus data riwayat ini secara permanen?')) {
                dataPanenPermanen = dataPanenPermanen.filter(item => item.id !== idToDelete);
                simpanDataPermanen();
                renderTabelRiwayat(dataPanenPermanen);
                updateDashboard();
                populateFarmerDropdown();
            }
        }
    });
    
    filterTanggalInput.addEventListener('change', (e) => {
        const tanggalDipilih = e.target.value;
        const dataTersaring = dataPanenPermanen.filter(item => item.tanggal === tanggalDipilih);
        renderTabelRiwayat(dataTersaring);
    });
    btnResetFilter.addEventListener('click', () => {
        filterTanggalInput.value = '';
        renderTabelRiwayat(dataPanenPermanen);
    });

    btnExportExcelAll.addEventListener('click', () => generateCSV(dataPanenPermanen, `laporan_panen_rinci_keseluruhan_${new Date().toISOString().slice(0,10)}`));
    btnExportPdfAll.addEventListener('click', eksporKePDF);

    btnExportPetani.addEventListener('click', () => {
        const namaPetani = pilihPetaniSelect.value;
        if (!namaPetani) { alert('Silakan pilih nama petani terlebih dahulu!'); return; }
        const dataPetani = dataPanenPermanen.filter(item => item.petani === namaPetani);
        generateCSV(dataPetani, `laporan_panen_${namaPetani.replace(/\s+/g, '_')}`);
    });
    
    btnExportHarian.addEventListener('click', () => {
        const tanggal = pilihTanggalInput.value;
        if (!tanggal) { alert('Silakan pilih tanggal laporan terlebih dahulu!'); return; }
        const dataHarian = dataPanenPermanen.filter(item => item.tanggal === tanggal);
        generateCSV(dataHarian, `laporan_panen_harian_${tanggal}`);
    });

    // BARU: Event listener untuk tombol reset semua data
    btnResetSemuaData.addEventListener('click', () => {
        if (confirm('APAKAH ANDA YAKIN? Semua data riwayat panen akan dihapus permanen dan tidak bisa dikembalikan.')) {
            dataPanenPermanen = []; // Kosongkan array data
            simpanDataPermanen(); // Simpan array kosong ke localStorage
            
            // Perbarui semua tampilan
            renderTabelRiwayat(dataPanenPermanen);
            updateDashboard();
            populateFarmerDropdown();
            
            alert('Semua data riwayat telah berhasil dihapus.');
        }
    });

    const init = () => {
        document.getElementById('tanggal').valueAsDate = new Date();
        pilihTanggalInput.valueAsDate = new Date();
        updateTampilanKalkulator();
        renderTabelRiwayat(dataPanenPermanen);
        updateDashboard();
        populateFarmerDropdown();
    };

    init();
});